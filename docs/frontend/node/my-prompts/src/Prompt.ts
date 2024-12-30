import ansiEscapes from 'ansi-escapes' // 导入ansi-escapes库，用于处理终端转义序列
import EventEmitter from 'events' // 导入事件发射器模块
import readline from 'node:readline' // 导入readline模块，用于处理输入输出

// process.stdout	属性返回一个对象，表示标准输出
// process.stdin	返回一个对象，表示标准输入

// 定义一个接口Key，包含name和sequence两个属性
export interface Key {
  name: string // 键的名称
  sequence: string // 键的序列
}

let onKeypress: (str: string, key: Key) => void // 定义一个全局的按键处理函数

// 定义一个抽象类Prompt，继承自EventEmitter
export abstract class Prompt extends EventEmitter {
  value = '' // 存储用户输入的值
  rl: readline.Interface // readline接口实例

  constructor() {
    super() // 调用父类的构造函数

    readline.emitKeypressEvents(process.stdin) // 使标准输入流支持按键事件
    this.rl = readline.createInterface({ input: process.stdin }) // 创建readline接口实例

    process.stdin.setRawMode(true) // 设置标准输入为原始模式

    onKeypress = this.onKeypress.bind(this) // 绑定onKeypress方法到当前实例
    process.stdin.on('keypress', onKeypress) // 监听按键事件
  }

  // 抽象方法，子类需要实现，用于处理按键输入
  abstract onKeyInput(str: string, key: Key): void

  // 私有方法，处理按键事件
  private onKeypress(str: string, key: Key) {
    if (key.sequence === '\u0003') {
      // 如果按下Ctrl+C
      process.exit() // 退出程序
    }

    if (key.name === 'return') {
      // 如果按下回车键
      this.close() // 关闭输入
      return
    }
    this?.onKeyInput(str, key) // 调用子类实现的onKeyInput方法
  }

  // 关闭输入的方法
  close() {
    process.stdout.write('\n') // 输出换行
    process.stdout.write(ansiEscapes.eraseDown) // 清除下面内容

    process.stdin.removeListener('keypress', onKeypress) // 移除按键事件监听
    process.stdin.setRawMode(false) // 取消标准输入的原始模式

    this.rl.close() // 关闭readline接口
    this.emit('submit', this.value) // 触发'submit'事件，传递输入的值
  }
}
