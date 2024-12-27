import readline from 'node:readline'

readline.emitKeypressEvents(process.stdin)

process.stdin.setRawMode(true)

process.stdin.on('keypress', (str, key) => {
  // 输入 ctrl + c 退出程序
  if (key.sequence === '\u0003') {
    process.exit()
  }
  console.log(str, key)
})
