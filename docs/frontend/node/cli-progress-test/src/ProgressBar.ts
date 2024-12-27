import ansiEscapes from 'ansi-escapes' // 用于控制台光标的隐藏、显示和位置保存/恢复。
import chalk from 'chalk'
import { EOL } from 'os' // 表示操作系统的行尾符号。

// 用于输出到控制台。
const write = process.stdout.write.bind(process.stdout)

export class ProgressBar {
  total: number = 0 // 进度条的总值。
  value: number = 0 // 进度条当前的进度值。

  constructor() {}

  start(total: number, initValue: number) {
    this.total = total
    this.value = initValue

    // 隐藏光标并保存光标位置。
    write(ansiEscapes.cursorHide)
    write(ansiEscapes.cursorSavePosition)

    this.render()
  }

  render() {
    let progress = this.value / this.total

    if (progress < 0) {
      progress = 0
    } else if (progress > 1) {
      progress = 1
      this.value = this.total
    }

    const barSize = 40

    const completeSize = Math.floor(progress * barSize)
    const incompleteSize = barSize - completeSize

    write(ansiEscapes.cursorRestorePosition)

    write(chalk.red('█').repeat(completeSize))
    write('░'.repeat(incompleteSize))
    write(` ${this.value} / ${this.total}`)
  }

  update(value: number) {
    this.value = value

    this.render()
  }

  getTotalSize() {
    return this.total
  }

  stop() {
    // 显示光标并换行。
    write(ansiEscapes.cursorShow)
    write(EOL)
  }
}
