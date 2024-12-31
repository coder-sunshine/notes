// minimist 是用于命令行解析的，因为 create-vite 只有一个 --template 参数，比较简单，没必要用 commander
import chalk from 'chalk'
import minimist from 'minimist'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prompts from 'prompts'
import fs from 'node:fs'

// 定义 Framework 类型
type Framework = {
  name: string
  display: string // 显示名称
  color: Function // 颜色函数
  variants: FrameworkVariant[] // variants 数组里就是这个 framework 对应的那个数组,例如 当你选择 react、vue 的时候，这个数组是不同的：
}

// 定义 FrameworkVariant 类型
type FrameworkVariant = {
  name: string
  display: string
  color: Function
  customCommand?: string
}

// 定义支持的框架及其变体
const FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    display: 'Vue',
    color: chalk.green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: chalk.blue
      },
      {
        name: 'vue',
        display: 'JavaScript',
        color: chalk.yellow
      }
    ]
  },
  {
    name: 'react',
    display: 'React',
    color: chalk.cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: chalk.blue
      },
      {
        name: 'react-swc-ts',
        display: 'TypeScript + SWC',
        color: chalk.blue
      },
      {
        name: 'react',
        display: 'JavaScript',
        color: chalk.yellow
      },
      {
        name: 'react-swc',
        display: 'JavaScript + SWC',
        color: chalk.yellow
      }
    ]
  }
]

// 从框架中提取模板名称
const TEMPLATES = FRAMEWORKS.map(f => {
  return f.variants?.map(v => v.name)
}).reduce((a, b) => {
  return a.concat(b)
}, [])

// 支持 help、template 两个选项，并且有别名 h 和 t
const argv = minimist<{
  template?: string
  help?: boolean
}>(process.argv.slice(2), {
  alias: { h: 'help', t: 'template' }, // 别名
  string: ['_'] // 字符串数组
})

// 帮助信息
const helpMessage = `\
Usage: create-vite [OPTION]... [DIRECTORY]

Create a new Vite project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${chalk.yellow('vanilla-ts     vanilla')}
${chalk.green('vue-ts         vue')}
${chalk.cyan('react-ts       react')}
${chalk.cyan('react-swc-ts   react-swc')}
${chalk.magenta('preact-ts      preact')}
${chalk.redBright('lit-ts         lit')}
${chalk.red('svelte-ts      svelte')}
${chalk.blue('solid-ts       solid')}
${chalk.blueBright('qwik-ts        qwik')}`

// 格式化目标目录
function formatTargetDir(targetDir: string | undefined) {
  // 如果目录名后面带了 /，那就去掉它，比如 aaa/ 替换成 aaa
  return targetDir?.trim().replace(/\/+$/g, '')
}

// 默认目标目录
const defaultTargetDir = 'vite-project'

// 初始化函数
async function init() {
  // 获取命令行参数中的目标目录
  const argTargetDir = formatTargetDir(argv._[0])
  // 获取命令行参数中的模板
  const argTemplate = argv.template || argv.t

  // 检查是否需要显示帮助信息
  const help = argv.help
  // 如果传入了 -h 选项，就打印帮助信息。
  if (help) {
    console.log(helpMessage)
    return
  }

  // 设置目标目录 -- 项目名称
  let targetDir = argTargetDir || defaultTargetDir
  console.log(`Creating a new Vite project in ${chalk.green(targetDir)}`)

  let result: prompts.Answers<'projectName' | 'framework' | 'variant'>

  try {
    // 使用 prompts 进行交互式询问
    result = await prompts(
      [
        {
          // type 是指定类型，比如 text、select，当指定为 null 的时候就会忽略这个问题。就是例如 npx create-vite tmp, 这里的 tmp 就是 projectName，
          // 没指定的话有默认值 vite-project 那么也就是 text类型
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: chalk.reset('Project name:'),
          initial: defaultTargetDir,
          onState: state => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          }
        },
        {
          // type 根据输入的参数是否在 template 数组里来决定显不显示。
          type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message: chalk.reset('Select a framework:'),
          initial: 0,
          choices: FRAMEWORKS.map(framework => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework
            }
          })
        },
        {
          // type 是个函数，当 type 为函数的时候，参数为上个问题的答案，所以这里可以根据 framework.variants 是否存在来决定是否显示。
          type: (framework: Framework) => (framework && framework.variants ? 'select' : null),
          name: 'variant',
          message: chalk.reset('Select a variant:'),
          choices: (framework: Framework) =>
            framework.variants.map(variant => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name
              }
            })
        }
      ],
      {
        onCancel: () => {
          throw new Error(chalk.red('✖') + ' Operation cancelled')
        }
      }
    )
    console.log('argv', argv)
    console.log('result', result)

    const { framework, variant } = result
    // process.cwd() 是执行命令的目录，然后拼上 targetDir 就是目标目录。 也就是执行命令的目录下创建 vite-project（项目名称） 目录。
    const root = path.join(process.cwd(), targetDir)
    console.log('root', root)

    // 根据 template 拼接要读取的 template 目录。
    let template: string = variant || argTemplate

    console.log(`\nScaffolding project in ${root}...`)

    // import.meta.url 就是当前文件的路径、不过是 file:/// 开头的，可以用 fileURLToPath 转为文件路径。
    // fileURLToPath 作用就是去掉前面的 file:///
    console.log(import.meta.url)
    console.log(fileURLToPath(import.meta.url))

    // 计算模板目录路径
    const templateDir = path.resolve(fileURLToPath(import.meta.url), '../..', `template-${template}`)

    console.log(templateDir)

    // 定义需要重命名的文件
    const renameFiles: Record<string, any> = {
      _gitignore: '.gitignore'
    }

    // 写入文件或复制文件
    const write = (file: string, content?: string) => {
      console.log('file', file)
      console.log('content---', content)
      const targetPath = path.join(root, renameFiles[file] ?? file)
      // 如果是内容，直接写入，否则复制。
      if (content) {
        fs.writeFileSync(targetPath, content)
      } else {
        console.log(path.join(templateDir, file))
        console.log('targetPath', targetPath)

        copy(path.join(templateDir, file), targetPath)
      }
    }

    // 复制目录
    function copyDir(srcDir: string, destDir: string) {
      // 创建目标目录，recursive: true 表示如果父目录不存在会递归创建
      fs.mkdirSync(destDir, { recursive: true })
      for (const file of fs.readdirSync(srcDir)) {
        // 拼接源文件和目标文件的完整路径
        const srcFile = path.resolve(srcDir, file) // 源文件完整路径
        const destFile = path.resolve(destDir, file) // 目标文件完整路径
        // 递归复制文件或目录
        copy(srcFile, destFile)
      }
    }

    // 复制文件或目录
    function copy(src: string, dest: string) {
      const stat = fs.statSync(src)
      // 如果是文件，直接复制，否则递归复制。
      if (stat.isDirectory()) {
        copyDir(src, dest)
      } else {
        fs.copyFileSync(src, dest)
      }
    }

    // 如果目标目录不存在，则创建
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true })
    }

    // 读取模板目录中的文件并写入目标目录
    const files = fs.readdirSync(templateDir)
    for (const file of files) {
      write(file)
    }

    // 计算相对路径并输出完成信息

    // path.relative 是拿到从 a 目录到 b 目录的相对路径。
    const cdProjectName = path.relative(process.cwd(), root)
    console.log(`\nDone. Now run:\n`)
    if (root !== process.cwd()) {
      console.log(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`)
    }
    console.log(`  npm install`)
    console.log(`  npm run dev`)
    console.log()
  } catch (cancelled: any) {
    console.log(cancelled.message)
    // return
  }
}

// 执行初始化函数并捕获错误
init().catch(e => {
  console.error(e)
})

// console.log(argv)
