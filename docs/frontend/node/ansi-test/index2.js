import readline from 'node:readline'

// process.stdout.rows 终端能显示的行数
const repeatCount = process.stdout.rows - 2
const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''

// 移动 到 0 行 0 列的位置，之后清除下面的内容：
readline.cursorTo(process.stdout, 0, 0)
readline.clearScreenDown(process.stdout)

// console.log(blank)
