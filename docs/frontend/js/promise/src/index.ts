import MyPromise from './MyPromise'

const p1 = new MyPromise<number>((resolve, reject) => {
  // throw new Error('error')
  // 异步错误是捕获不到的，原生也不能捕获到
  // setTimeout(() => {
  //   throw new Error('error')
  // }, 1000)
  // resolve(123)
  reject(456)

  // 如果是定时器的话，executor 执行完，就执行 then 方法，then 方法同步执行完后，再执行定时器
  // ，但是此时状态是 pending。
  // setTimeout(() => {
  //   resolve('定时器成功123')
  //   // reject('定时器失败456')
  // }, 1000)
})

const p2 = new Promise((resolve, reject) => {
  resolve(123)
})

console.log(p1)

// p1.then(
//   null, // 第一个函数不传函数，则把 resolve 的值传给链式调用里面的 then 中的 res
//   null
// ).then(
//   res => {
//     console.log('res链式调用===>', res)
//   },
//   err => {
//     console.log('err链式调用===>', err)
//   }
// )

// p1.then(
//   res => {
//     console.log('res第二个===>', res)
//   },
//   err => {
//     console.log('err第二个===>', err)
//   }
// )

// p1.then(
//   res => {
//     console.log('res===>', res)
//   },
//   err => {
//     console.log('err===>', err)
//   }
// )

console.log('end')

// p1.then(
//   res => {
//     // return new MyPromise((resolve, reject) => {
//     //   reject('123')
//     // })
//     return {
//       then(resolve: any, reject: any) {
//         resolve('123')
//       }
//     }
//     // console.log('res===>', res)
//   },
//   err => {
//     console.log('err===>', err)
//   }
// ).then(
//   res => {
//     console.log('res链式调用===>', res)
//   },
//   err => {
//     console.log('err链式调用===>', err)
//   }
// )

// p1.catch()
//   .then(res => {
//     console.log(res)
//   })
//   .finally(() => {
//     console.log('完成了')
//   })
//   .catch(err => {
//     console.log(err)
//   })

// MyPromise.resolve(123).then(res => {
//   console.log(res)
// })

// MyPromise.resolve(new Promise(resolve => resolve(789))).then(res => {
//   console.log(res)
// })

// MyPromise.resolve({
//   then: (resolve: any, reject: any) => {
//     resolve('xxx')
//   },
// }).then(res => {
//   console.log(res)
// })

// MyPromise.reject(123).then(null, err => {
//   console.log(err)
// })

function fn(a: number, b: number, c: number) {
  throw new Error('报错啦')
  return a + b + c
}

// Promise.resolve(fn(1, 2, 3))
//   .then(res => {
//     console.log(res)
//   })
//   .catch(err => {
//     // 这样的话 在 catch 里面是捕获不到 fn报错的，但是我们也不能确定 fn 一定能调用成功,可以用 promise.try 来捕获
//     console.log(err)
//   })

// MyPromise.try(fn, 1, 2, 3).then(
//   res => {
//     console.log(res)
//   },
//   err => {
//     console.log(err)
//   }
// )

MyPromise.all([Promise.resolve(0), Promise.reject(1), Promise.reject(2)])
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.log(err)
  })
