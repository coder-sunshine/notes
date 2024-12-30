const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen({
  fullUnicode: true
})

// barWidth 是柱形的宽度，barSpacing 是柱形之间的间距。
const bar = contrib.bar({
  label: '气温变化',
  barWidth: 8,
  barSpacing: 20,
  maxHeight: 20
})

screen.append(bar)

bar.setData({
  titles: ['10.1', '10.2', '10.3', '10.4'],
  data: [6, 13, 8, 10]
})

screen.key('C-c', function () {
  screen.destroy()
})

screen.render()
