const blessed = require('blessed')

const screen = blessed.screen({
  fullUnicode: true
})

const prompt = blessed.prompt({
  parent: screen,
  border: 'line',
  height: 'shrink',
  width: 'half',
  top: 'center',
  left: 'center',
  label: ' {blue-fg}登录{/blue-fg} ',
  tags: true
})

const msg = blessed.message({
  parent: screen,
  border: 'line',
  width: 'half', // 宽度为一半
  height: 'shrink', // 高度自适应
  top: 'center',
  left: 'center',
  label: ' {blue-fg}提示{/blue-fg} ',
  tags: true,
  hidden: true
})

prompt.input('你的用户名?', '', function (err, username) {
  prompt.input('你的密码?', '', function (err, password) {
    if (username === 'test' && password === 'aaa123') {
      msg.display('登录成功!', 1)
    } else {
      msg.display('用户名或密码错误!', 1)
    }

    setTimeout(function () {
      screen.destroy()
      console.log(username, password)
    }, 1000)
  })
})

screen.key('C-c', function () {
  screen.destroy()
})

screen.render()
