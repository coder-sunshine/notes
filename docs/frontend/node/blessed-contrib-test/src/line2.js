const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen({
  fullUnicode: true
})

const lineChart = contrib.line({
  style: {
    line: 'yellow',
    text: 'green',
    baseline: 'blue'
  },
  showLegend: true,
  label: '气温变化'
})

const data1 = {
  title: '北京',
  x: ['10 月 1 日', '10 月 2 日', '10 月 3 日', '10 月 4 日'],
  y: [4, 10, 3, 5],
  style: {
    line: 'red'
  }
}
const data2 = {
  title: '上海',
  color: 'red',
  x: ['10 月 1 日', '10 月 2 日', '10 月 3 日', '10 月 4 日'],
  y: [6, 13, 8, 10]
}

screen.append(lineChart)
lineChart.setData([data1, data2])

screen.key('C-c', function () {
  screen.destroy()
})

screen.render()
