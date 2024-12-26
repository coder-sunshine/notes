import ansiEscapes from 'ansi-escapes'

const log = process.stdout.write.bind(process.stdout)

// cursorTo 第一个参数是列号、第二个参数是行号。
log(ansiEscapes.cursorTo(10, 1) + '111')
log(ansiEscapes.cursorTo(7, 2) + '222')
log(ansiEscapes.cursorTo(5, 3) + '333')

setTimeout(() => {
  log(ansiEscapes.cursorTo(0, 2) + ansiEscapes.eraseEndLine)
  log(ansiEscapes.cursorTo(5, 3) + '444')
}, 1000)
