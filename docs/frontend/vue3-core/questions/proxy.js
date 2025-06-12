// const obj = {
//   a: 1,
//   b: 2,
//   get sum() {
//     console.log('this', this)
//     return this.a + this.b
//   },
// }

// const proxy = new Proxy(obj, {
//   get(target, key, receiver) {
//     // 打印 key 发现 只打印了 sum，并没有打印 a 和 b，说明 a 和 b 没有被 get 拦截到
//     console.log('key', key)
//     return target[key]
//   },
//   set(target, key, value, receiver) {
//     target[key] = value
//   },
// })

// console.log(proxy.sum)

// 结果如下
// key sum
// this { a: 1, b: 2, sum: [Getter] }, 这里的 this 是 obj， 因为 obj 并不是代理对象，所以 a 和 b 不会被 get 拦截到，我们需要做的就是把 this 指向代理对象
// 3

// 修改如下

// Reflect 的作用 => 完成对象的基本操作

const obj1 = {
  a: 1,
  b: 2,
  get sum() {
    console.log('this', this)
    return this.a + this.b
  },
}

const proxy1 = new Proxy(obj1, {
  get(target, key, receiver) {
    console.log('receiver', receiver === proxy1)
    console.log('key', key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver)
  },
})

console.log(proxy1.sum)

// key sum
// this { a: 1, b: 2, sum: [Getter] }
// 3
// receiver true 这里 receiver 是 proxy1， 所以 a 和 b 会被 get 拦截到
// key sum
// this { a: 1, b: 2, sum: [Getter] }
// receiver true
// key a => a 被 get 拦截到
// receiver true
// key b => b 被 get 拦截到
// 3
