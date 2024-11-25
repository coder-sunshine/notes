import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
// import App1 from './App1.tsx'
import App2 from './App2.tsx'

// 总结
// 浏览器里计算位置、宽高、判断一些交互，都需要用到距离、宽高的属性。

// 这类属性比较多，我们整体过了一遍：

// e.pageY：鼠标距离文档顶部的距离
// e.clientY：鼠标距离可视区域顶部的距离
// e.offsetY：鼠标距离触发事件元素顶部的距离
// e.screenY：鼠标距离屏幕顶部的距离
// winwodw.scrollY：页面滚动的距离，也叫 window.pageYOffset，等同于 document.documentElement.scrollTop
// element.scrollTop：元素滚动的距离
// element.clientTop：上边框高度
// element.offsetTop：相对有 position 的父元素的内容顶部的距离，可以递归累加，加上 clientTop，算出到文档顶部的距离
// clientHeight：内容高度，不包括边框
// offsetHeight：包含边框的高度
// scrollHeight：滚动区域的高度，不包括边框
// window.innerHeight：窗口的高度
// element.getBoundingClientRect：拿到 width、height、top、left 属性，其中 top、left 是元素距离可视区域的距离，width、height 绝大多数情况下等同 offsetHeight、offsetWidth，但旋转之后就不一样了，拿到的是包围盒的宽高
// 其中，还要注意 react 的合成事件没有 offsetY 属性，可以自己算，react-use 的 useMouse 的 hook 就是自己算的，也可以用 e.nativeEvent.offsetY 来拿到。

// 掌握这些宽高、距离属性，就足够处理各种需要计算位置、宽高的需求了。

createRoot(document.getElementById('root')!).render(<App2 />)
