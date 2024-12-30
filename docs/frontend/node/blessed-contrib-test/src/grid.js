const blessed = require('blessed')
const contrib = require('blessed-contrib')

const screen = blessed.screen({
  fullUnicode: true
})

const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen })

//grid.set(row, col, rowSpan, colSpan, obj, opts)
// 在 0、0 的位置渲染宽高占 6 份的 gauge 组件。
const guage = grid.set(0, 0, 6, 6, contrib.gauge, {
  label: '下载进度',
  width: 'half',
  stroke: 'green',
  fill: 'white',
  percent: 0.3
})

// 在 0、6 的位置，渲染宽高占 6 份的 donut 组件。
// const donut = grid.set(0, 6, 6, 6, contrib.donut, {
// 在 6、6 的位置，渲染宽高占 6 份的 donut 组件。
const donut = grid.set(6, 6, 6, 6, contrib.donut, {
  label: '进度',
  radius: 10,
  arcWidth: 2,
  remainColor: 'black',
  data: [
    { percent: 0.3, label: 'aaa 进度', color: 'green' },
    { percent: 0.5, label: 'bbb 进度', color: 'red' }
  ]
})

screen.key('C-c', function () {
  screen.destroy()
})

screen.render()
