// const tasks = Array.from({ length: 100000 }, (_, i) => () => {
//   const div = document.createElement('div')
//   div.textContent = i
//   document.body.appendChild(div)
// })

btn.onclick = () => {
  console.log('开始执行任务')
  // for (const task of tasks) {
  //   task()
  // }

  const scheduler = isGoOn => {
    let count = 0
    setTimeout(() => {
      isGoOn(() => count++ < 3)
    }, 1000)
  }

  const taskHandler = index => {
    const div = document.createElement('div')
    div.textContent = index
    document.body.appendChild(div)
  }

  performTask(100000, taskHandler)

  // idlePerformTask(tasks)
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

/**
 *
 * @param {Number} executorNum 执行任务的次数
 * @param {Function} taskHandler 执行什么任务
 * @param {Function | undefined} scheduler 调度器，默认为 requestIdleCallback
 */
function performTask(executorNum, taskHandler, scheduler) {
  if (scheduler === undefined) {
    // 默认的调度器
    scheduler = isGoOn => {
      requestIdleCallback(idle => {
        isGoOn(() => idle.timeRemaining() > 0)
      })
    }
  }

  // 记录当前执行任务的下标
  let index = 0
  // 渲染帧空闲时间回调
  const _run = () => {
    scheduler(isGoOn => {
      while (index < executorNum && isGoOn()) {
        // 满足条件，执行任务
        taskHandler(index++)
      }
      // 当 while 循环结束后，说明当前帧没有空闲时间了，或者任务已经执行完了
      if (index < executorNum) {
        // 继续注册下一步任务事件，重复的调用 _run
        _run()
      }
    })
  }

  _run()
}

// function idlePerformTask(tasks) {
//   performTask(tasks, runChunk => {
//     requestIdleCallback(idle => {
//       runChunk(() => idle.timeRemaining() > 0)
//     })
//   })
// }
