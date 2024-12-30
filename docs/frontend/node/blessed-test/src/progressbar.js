const blessed = require('blessed')

const screen = blessed.screen({
  fullUnicode: true
})

// 指定 progressBar 的宽高、位置、颜色。
const progressBar = blessed.progressbar({
  parent: screen,
  top: '50%',
  left: '50%',
  height: 2,
  width: 20,
  style: {
    bg: 'gray',
    bar: {
      bg: 'green'
    }
  }
})

screen.key('C-c', function () {
  screen.destroy()
})

// 用一个定时器不断修改进度。
let total = 0
const timer = setInterval(() => {
  if (total === 100) {
    clearInterval(timer)
  }

  progressBar.setProgress(total)
  screen.render()

  total += 2
}, 100)

screen.render()
