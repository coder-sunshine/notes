import ansiEscapes from 'ansi-escapes' // 用于控制终端光标和清除行的库
import { Key, Prompt } from './Prompt.js' // 导入Key和Prompt类
import chalk from 'chalk' // 用于终端字符串样式的库

// 定义文本提示选项的接口
export interface TextPromptOptions {
  type: 'text' // 提示类型
  name: string // 提示名称
  message: string // 提示信息
}

// 检查字符是否为不可打印字符
function isNonPrintableChar(char: string) {
  return /^[\x00-\x1F\x7F]$/.test(char)
}

// 定义TextPrompt类，继承自Prompt
export class TextPrompt extends Prompt {
  out = process.stdout // 输出流
  cursor = 0 // 光标位置

  // 构造函数，接收TextPromptOptions类型的参数
  constructor(private options: TextPromptOptions) {
    super() // 调用父类构造函数
  }

  // 处理键盘输入
  onKeyInput(str: string, key: Key) {
    if (key.name === 'backspace') {
      // 如果按下的是退格键
      this.cursor-- // 光标左移
      this.value = this.value.slice(0, this.cursor) // 删除最后一个字符
    }

    if (!isNonPrintableChar(str)) {
      // 如果输入的字符是可打印的
      this.value += str // 将字符添加到当前值
      this.cursor++ // 光标右移
    }

    this.render() // 重新渲染输出
  }

  // 渲染输出
  render() {
    this.out.write(ansiEscapes.eraseLine) // 清除当前行

    this.out.write(ansiEscapes.cursorTo(0)) // 将光标移动到行首

    // 输出提示信息和当前输入的值
    this.out.write([chalk.bold(this.options.message), chalk.gray('›'), ' ', chalk.blue(this.value)].join(''))

    this.out.write(ansiEscapes.cursorSavePosition) // 保存光标位置

    this.out.write(ansiEscapes.cursorDown(1) + ansiEscapes.cursorTo(0)) // 光标下移一行并移到行首

    if (this.value === '') {
      // 如果当前值为空
      this.out.write(chalk.red(`请输入${this.options.message}`)) // 提示用户输入
    } else {
      this.out.write(ansiEscapes.eraseLine) // 清除当前行
    }

    this.out.write(ansiEscapes.cursorRestorePosition) // 恢复光标位置
  }
}
