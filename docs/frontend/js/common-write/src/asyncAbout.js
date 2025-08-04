/**
 *
 * @param fn 传入的异步函数
 * @param delay 延迟执行的时间
 * @returns 延迟执行的异步函数
 */
function delayAsync(fn, delay) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await fn.apply(this, args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

// 使用示例
const asyncFn = async name => {
  // return `Hello, ${name}!`
  return Promise.reject('error')
}

const delayedAsyncFn = delayAsync(asyncFn, 2000)
delayedAsyncFn('World')
  .then(result => {
    console.log(result) // 2秒后输出: Hello, World!
  })
  .catch(error => {
    console.log('error', error)
  })
