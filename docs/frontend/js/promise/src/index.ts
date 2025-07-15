import MyPromise from './MyPromise'

const p1 = new MyPromise<number | string>((resolve, reject) => {
  // throw new Error('error')
  // 异步错误是捕获不到的，原生也不能捕获到
  // setTimeout(() => {
  //   throw new Error('error')
  // }, 1000)
  // resolve(123)
  // reject(456)

  // 如果是定时器的话，executor 执行完，就执行 then 方法，then 方法同步执行完后，再执行定时器
  // ，但是此时状态是 pending。
  setTimeout(() => {
    resolve('定时器成功123')
    // reject('定时器失败456')
  }, 1000)
})

console.log(p1)

p1.then(
  null, // 第一个函数不传函数，则把 resolve 的值传给链式调用里面的 then 中的 res
  err => {
    console.log('err===>', err)
    // return 'err链式调用456'
    throw 'err链式调用789'
  }
).then(
  res => {
    console.log('res链式调用===>', res)
  },
  err => {
    console.log('err链式调用===>', err)
  }
)

// p1.then(
//   res => {
//     console.log('res第二个===>', res)
//   },
//   err => {
//     console.log('err第二个===>', err)
//   }
// )
