// - 10：LIS = [10]（空列表直接加入 10）
// - 3：LIS = [3]（3 小于 10，用 3 替换 10）
// - 5：LIS = [3, 5]（5 大于 3，追加）
// - 9：LIS = [3, 5, 9]（9 大于 5，追加）
// - 12：LIS = [3, 5, 9, 12]（12 大于 9，追加）
// - 8：LIS = [3, 5, 8, 12]（8 小于 9，用 8 替换 9）-- **也就是找到第一个比自己大的数替换**
// - 15：LIS = [3, 5, 8, 12, 15]（15 大于 12，追加）
// - 18：LIS = [3, 5, 8, 12, 15, 18]（18 大于 15，追加）

function getSequence(arr) {
  // 记录结果数组，存的是索引
  const result = []

  // 记录前驱节点
  const map = new Map()

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (result.length === 0) {
      // 如果 result 一个都没有，就把当前的索引放进去，第一个也不用记录前驱节点
      result.push(i)
      continue
    }

    // 拿到最后一个索引
    const lastIndex = result[result.length - 1]
    // 拿到最后一个元素
    const lastItem = arr[lastIndex]

    // 当前元素大于最后一个元素
    if (item > lastItem) {
      // 直接 push ，并且记录 当前 i 的前驱节点
      result.push(i)
      map.set(i, lastIndex)
      continue
    }

    // 此时需要找到第一个比自己大的数，并且替换 --> 二分查找
    console.log('result', result)

    let left = 0
    let right = result.length - 1

    /**
     * 需要找到第一个比当前值大的值
     * 如果中间值小于当前值，那么第一个比当前值大的肯定在右边
     * 如果中间值大于当前值，那么第一个比当前值大的肯定在左边
     */
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]

      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (arr[result[left]] > item) {
      // 第一个不用记录前驱节点
      if (left > 0) {
        // 记录前驱节点
        map.set(i, result[left - 1])
      }
      // 找到最合适的，把索引替换进去
      result[left] = i
    }
  }

  // 反向追溯
  let l = result.length

  let last = result[l - 1]

  while (l > 0) {
    l--
    // 纠正顺序
    result[l] = last
    // 下一次的last等于当前last记录的前驱节点
    last = map.get(last)
  }

  return result
}

console.log(getSequence([10, 3, 5, 9, 12, 8, 15, 18]))
