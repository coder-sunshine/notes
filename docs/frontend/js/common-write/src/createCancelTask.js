const NOOP = () => {}

function createCancelTask(asyncTask) {
  // 定义一个空函数
  let cancel = NOOP

  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      // 下一次执行的时候就调用，(第一次调用是空函数，无所谓)
      cancel()

      // 将空函数赋值
      cancel = () => {
        resolve = reject = NOOP
      }

      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}

const getData = id => {
  const time = id === 1 ? 2000 : 1000
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(id)
    }, time)
  })
}

const getDataTask = createCancelTask(getData)

getDataTask(1).then(res => {
  console.log(res)
})

getDataTask(2).then(res => {
  console.log(res)
})
