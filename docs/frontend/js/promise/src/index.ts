import MyPromise from './MyPromise'

const p1 = new MyPromise<number>((resolve, reject) => {
  // throw new Error('error')
  // 异步错误是捕获不到的，原生也不能捕获到
  setTimeout(() => {
    throw new Error('error')
  }, 1000)
  // resolve(123)
  // reject(456)
})

console.log(p1)

// p1.catch(err => {
//   console.log(err)
// })
