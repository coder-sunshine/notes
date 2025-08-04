const tasks = Array.from({ length: 100000 }, (_, i) => () => {
  const div = document.createElement('div')
  div.textContent = i
  document.body.appendChild(div)
})

btn.onclick = () => {
  console.log('开始执行任务')
  // for (const task of tasks) {
  //   task()
  // }
  performTask(tasks)
}

// 分步执行任务
// function performTask(tasks) {
//   // 渲染帧空闲时间回调
//   const _run = () => {
//     requestIdleCallback(() => {
//       while (当前还有任务要执行 && 这一帧还有空闲时间可用) {
//         执行一个任务
//       }
//       // 当 while 循环结束后，说明当前帧没有空闲时间了，或者任务已经执行完了
//       if (当前还有任务要执行) {
//         // 继续注册下一步任务事件，重复的调用 _run
//         _run()
//       }
//     })
//   }

//   _run()
// }

function performTask(tasks) {
  let index = 0
  // 渲染帧空闲时间回调
  const _run = () => {
    requestIdleCallback(idle => {
      console.log('空闲时间', idle.timeRemaining())
      while (index < tasks.length && idle.timeRemaining() > 0) {
        console.log('当前空闲时间', idle.timeRemaining())
        tasks[index++]()
      }
      // 当 while 循环结束后，说明当前帧没有空闲时间了，或者任务已经执行完了
      if (index < tasks.length) {
        // 继续注册下一步任务事件，重复的调用 _run
        _run()
      }
    })
  }

  _run()
}
