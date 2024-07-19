// import util from './util.js'
// const r = util.getRandomNum(1, 10)
// console.log('🚀 ~ r:', r)

// const obj = {
//   a: 1,
//   b: {
//     c: 3
//   }
// }
// const cloneObj = util.deepClone(obj)
// cloneObj.b.c = 4
// console.log('🚀 ~ obj:', obj)
// console.log('🚀 ~ cloneObj:', cloneObj)

function run() {
  import('./util.js').then(chunk => console.log('🚀 ~ chunk:', chunk))

  // import('./util.js').then(({ default: foo }) => {
  //   const r = foo.getRandomNum(1, 10)
  //   console.log('🚀 ~ r:', r)
  // })
}
run()
