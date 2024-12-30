const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen({
  fullUnicode: true
})

// 其实 blessed 也有这个，只不过 blessed-contrib 的会有个进度显示。
const gauge = contrib.gauge({
  label: '下载进度',
  width: 'half',
  stroke: 'green',
  fill: 'white'
})

screen.append(gauge)

let total = 0
const timer = setInterval(() => {
  if (total === 100) {
    clearInterval(timer)
  }

  gauge.setPercent(total)
  screen.render()

  total += 2
}, 100)

screen.key('C-c', function () {
  screen.destroy()
})

screen.render()
