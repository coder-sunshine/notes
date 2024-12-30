var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// minimist 是用于命令行解析的，因为 create-vite 只有一个 --template 参数，比较简单，没必要用 commander
import chalk from 'chalk';
import minimist from 'minimist';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';
import fs from 'node:fs';
const FRAMEWORKS = [
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
];
const TEMPLATES = FRAMEWORKS.map(f => {
    var _a;
    return (_a = f.variants) === null || _a === void 0 ? void 0 : _a.map(v => v.name);
}).reduce((a, b) => {
    return a.concat(b);
}, []);
// 支持 help、template 两个选项，并且有别名 h 和 t
const argv = minimist(process.argv.slice(2), {
    alias: { h: 'help', t: 'template' }, // 别名
    string: ['_'] // 字符串数组
});
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
${chalk.blueBright('qwik-ts        qwik')}`;
function formatTargetDir(targetDir) {
    // 如果目录名后面带了 /，那就去掉它，比如 aaa/ 替换成 aaa
    return targetDir === null || targetDir === void 0 ? void 0 : targetDir.trim().replace(/\/+$/g, '');
}
const defaultTargetDir = 'vite-project';
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const argTargetDir = formatTargetDir(argv._[0]);
        const argTemplate = argv.template || argv.t;
        const help = argv.help;
        // 如果传入了 -h 选项，就打印帮助信息。
        if (help) {
            console.log(helpMessage);
            return;
        }
        let targetDir = argTargetDir || defaultTargetDir;
        console.log(`Creating a new Vite project in ${chalk.green(targetDir)}`);
        let result;
        try {
            result = yield prompts([
                {
                    // type 是指定类型，比如 text、select，当指定为 null 的时候就会忽略这个问题。就是例如 npx create-vite tmp, 这里的 tmp 就是 projectName，
                    // 没指定的话有默认值 vite-project 那么也就是 text类型
                    type: argTargetDir ? null : 'text',
                    name: 'projectName',
                    message: chalk.reset('Project name:'),
                    initial: defaultTargetDir,
                    onState: state => {
                        targetDir = formatTargetDir(state.value) || defaultTargetDir;
                    }
                },
                {
                    // type 根据输入的参数是否在 template 数组里来决定显不显示。
                    type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
                    name: 'framework',
                    message: chalk.reset('Select a framework:'),
                    initial: 0,
                    choices: FRAMEWORKS.map(framework => {
                        const frameworkColor = framework.color;
                        return {
                            title: frameworkColor(framework.display || framework.name),
                            value: framework
                        };
                    })
                },
                {
                    // type 是个函数，当 type 为函数的时候，参数为上个问题的答案，所以这里可以根据 framework.variants 是否存在来决定是否显示。
                    type: (framework) => (framework && framework.variants ? 'select' : null),
                    name: 'variant',
                    message: chalk.reset('Select a variant:'),
                    choices: (framework) => framework.variants.map(variant => {
                        const variantColor = variant.color;
                        return {
                            title: variantColor(variant.display || variant.name),
                            value: variant.name
                        };
                    })
                }
            ], {
                onCancel: () => {
                    throw new Error(chalk.red('✖') + ' Operation cancelled');
                }
            });
            console.log('argv', argv);
            console.log('result', result);
            const { framework, variant } = result;
            // process.cwd() 是执行命令的目录，然后拼上 targetDir 就是目标目录。
            const root = path.join(process.cwd(), targetDir);
            // 根据 template 拼接要读取的 template 目录。
            let template = variant || argTemplate;
            console.log(`\nScaffolding project in ${root}...`);
            // import.meta.url 就是当前文件的路径、不过是 file:/// 开头的，可以用 fileURLToPath 转为文件路径。
            // 作用就是去掉前面的 file:///
            const templateDir = path.resolve(fileURLToPath(import.meta.url), '../..', `template-${template}`);
            console.log(templateDir);
            // console.log(result)
            const renameFiles = {
                _gitignore: '.gitignore'
            };
            const write = (file, content) => {
                var _a;
                const targetPath = path.join(root, (_a = renameFiles[file]) !== null && _a !== void 0 ? _a : file);
                if (content) {
                    fs.writeFileSync(targetPath, content);
                }
                else {
                    copy(path.join(templateDir, file), targetPath);
                }
            };
            function copyDir(srcDir, destDir) {
                fs.mkdirSync(destDir, { recursive: true });
                for (const file of fs.readdirSync(srcDir)) {
                    const srcFile = path.resolve(srcDir, file);
                    const destFile = path.resolve(destDir, file);
                    copy(srcFile, destFile);
                }
            }
            function copy(src, dest) {
                const stat = fs.statSync(src);
                if (stat.isDirectory()) {
                    copyDir(src, dest);
                }
                else {
                    fs.copyFileSync(src, dest);
                }
            }
        }
        catch (cancelled) {
            console.log(cancelled.message);
            // return
        }
    });
}
init().catch(e => {
    console.error(e);
});
// console.log(argv)
