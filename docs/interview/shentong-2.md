# 8.5号申通二面

## 面试题目

### 1. 两分钟自我介绍

xxxxx

### 2. 对于原生js熟悉程度如何？

熟悉

### 3. promise和async,await有何区别

async和await是语法糖，用来解决回调地狱的问题

### 4. 分别怎么错误捕获

promise用catch，async/await用try/catch

### 5. 箭头函数和普通函数的区别

箭头函数主要用来处理 this 的问题，箭头函数不是构造函数，没有构造器，不能new，然后继续追问还有其他改变this的方法吗？我答了用闭包保存当前函数的this，然后在其他地方用，又问还有没有办法，我答了用 call,apply,bind等也可以做到，在react类组件中，如果不写箭头函数，就会很常见的使用 bind

### 6. 如果我有很多同步代码，怎样在不入侵代码的情况下，捕获到错误

没答出来

### 7. 如果有很多接口请求，不入侵代码的情况下，怎样捕获到错误（原问题好像是问怎样全局拦截promise错误）（我回答了axios拦截器，讲不依赖第三方库）

没答出来

### 8. 如果有很多节点，怎么在不操作dom的情况下，点击哪个地方，就能获得点击的地方的文本

没答出来

### 9. 聊项目，选一个你觉得做的最好的项目

选了pc项目，然后问了看到你简历中写道，包体积大小由 7m -> 4m，是怎样做的,还有热更新速度提升了 50以上是怎么做的。 ----- 我说的是重构过后，使用了 gzip压缩，以及 代码分割，cdn等，然后热更新是 webpack -> vite的技术转型实现的

### 10. 看了你简历上有封装组件，你可以说一下封装组件需要注意的地方吗？

因为我们项目中需要用到大量的表格以及表单等组件，所以二次封装了 el-form和table等组件，包括dialog命令式弹框等。我觉得需要注意的点，例如需要完整的Ts提示支持，调用者需要方便调用，例如用json配置化等渲染表格等，支持了 tsx，h函数等处理，然后继续追问我，如果多个项目都需要用到这个组件，在迭代升级的时候需要怎样去处理呢？ ----- 这个我回答了不能破坏式的更新，其他暂时没想到

### 11. 微前端有了解过吗，你们的项目是怎样管理的

没了解过，有考虑过用 monorepo 方案管理，后面没时间就没处理，一个个单一管理的

### 12. 性能优化有哪些指标？

不清楚这几个指标，算是没答

### 13. 如果让你挑一个性能优化的指标，你觉得用户会最在意哪一个指标呢

讲了有个页面有一些图片加载慢，用户反映，然后封装了 vite 插件，让图片预加载，减少等待时间，然后继续追问是哪一个指标,没答出来

### 14. 打包工具熟悉情况，有了解过 babel,webpack等吗？

回答的是之前有系统了解过，但是工作中不常用，很多已经忘了

### 15. 移动端适配字体的方案，postcss处理的插件名字叫什么？

说了rem，然后让我讲rem原理，答的是 给根字体设置大小，然后通过设计稿，用js去计算出来其他字体的大小，然后问工程化里面怎么做，我答了postcss，继续追问实现这个的 postcss插件名字叫什么，忘了

### 16. 数组方法，map 和 forEach 有何区别，哪一个性能更好,都是怎么终止循环的

map返回一个新数组，forEach可以修改值，不清楚哪一个性能更好，抛出终止循环

### 17. 数组有哪些可以判断的方法

some,every

### 18. react的api熟悉程度如何

熟悉

### 19. useRef一般用在哪些地方

dom,还有解决闭包陷阱等

### 20. 平常获取新知识的途径，学习的方法

通过github优秀项目，看文章，文档等，学习交流群跟着大佬学，知识付费等

### 21. 对于 Ai 的熟悉程度，mcp arg等

不是很清楚，表示正准备下一个学习这个

## 总结

### 5.箭头函数和普通函数的区别

| **特性**             | **箭头函数**                                 | **普通函数**                |
| -------------------- | -------------------------------------------- | --------------------------- |
| **`this` 绑定**      | 无自己的 `this`，继承外层作用域              | 有独立的 `this`（动态绑定） |
| **构造函数**         | ❌ 不能用作构造函数                          | ✅ 可以用 `new` 调用        |
| **`arguments` 对象** | ❌ 没有 `arguments` 对象（需用剩余参数替代） | ✅ 有 `arguments` 对象      |
| **`prototype` 属性** | ❌ 没有 `prototype` 属性                     | ✅ 有 `prototype` 属性      |
| **方法简写**         | 更适合回调函数                               | 更适合对象方法              |
| **语法**             | 更简洁（可省略 `function` 等）               | 更完整                      |

- 箭头函数：更简洁，没有独立的 this，适合回调函数和工具函数
- 普通函数：功能完整，有独立的 this，适合对象方法和构造函数

### 6.如果我有很多同步代码，怎样在不入侵代码的情况下，捕获到错误

- vue中可以用 [errorHandle](https://cn.vuejs.org/api/application.html#app-config-errorhandler)
- js 中可以用 `window.onerror = function(message, source, line, column, error) {}`

### 7.如果有很多接口请求，不入侵代码的情况下，怎样捕获到错误，不依赖第三方库，原问题好像就是问怎样全局拦截promise错误

大致有以下两种方法，

- 拦截`promise`错误，

```js
window.addEventListener('unhandledrejection', function (event) {
  // event.promise 是产生错误的Promise
  // event.reason 是Promise被reject的原因（错误对象）
  console.error('Unhandled promise rejection:', event.reason)
  // 可以在这里进行错误上报或其他处理
  // 阻止默认处理（比如控制台打印）
  event.preventDefault()
})
```

- 重写 `fetch`

```javascript
// 保存原生的fetch
const originalFetch = window.fetch
// 重写fetch
window.fetch = function (...args) {
  // 调用原始的fetch，返回一个promise
  return originalFetch.apply(this, args).catch(error => {
    // 捕获请求错误
    console.error('Fetch request failed:', error)
    // 这里可以进行错误上报
    // 可以选择将错误继续抛出，以便于后续代码捕获
    throw error
  })
}
```

- 重写 xmlhttprequest

```javascript
const originalXHROpen = XMLHttpRequest.prototype.open
const originalXHRSend = XMLHttpRequest.prototype.send
// 重写open方法
XMLHttpRequest.prototype.open = function (method, url) {
  // 保存请求的信息，以便在错误时使用
  this._requestMethod = method
  this._requestURL = url
  originalXHROpen.apply(this, arguments)
}
// 重写send方法
XMLHttpRequest.prototype.send = function (body) {
  // 监听错误事件
  this.addEventListener('error', function () {
    console.error(`XMLHttpRequest request failed for ${this._requestMethod} ${this._requestURL}`)
    // 错误上报
  })
  // 监听状态改变
  this.addEventListener('loadend', function () {
    // 状态码4xx, 5xx等也可以视为错误
    if (this.status >= 400) {
      console.error(`XMLHttpRequest request returned with status ${this.status} for ${this._requestMethod} ${this._requestURL}`)
      // 错误上报
    }
  })
  originalXHRSend.apply(this, arguments)
}
```

注意：**重写原生方法可能会引起与其他库的冲突，因此需要谨慎。确保在应用初始化之前就重写这些方法，并且不要破坏原有的功能。**，最好是使用第一种方案

### 8.如果有很多节点，怎么在不操作dom的情况下，点击哪个地方，就能获得点击的地方的文本

想到了事件委托，但是不清楚怎么拿到文本

### 15.移动端适配字体的方案，postcss处理的插件名字叫什么？

postcss-pxtorem (无法将内联样式和js中css的px转成rem，这是一个非常致命的缺点)

### 16.数组方法，map 和 forEach 有何区别，哪一个性能更好,都是怎么终止循环的

forEach 应该效率会高一些，因为 map 要创建新的数组,需要额外的开销
