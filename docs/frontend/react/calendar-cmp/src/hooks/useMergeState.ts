import { SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { isFunction } from '../utils/index'

const useMergeState = <T>(
  defaultStateValue: T,
  props: {
    defaultValue?: T
    value?: T
    onChange?: (value: T) => void
  }
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const { defaultValue, value: propsValue, onChange } = props || {}

  const isFirstRender = useRef(true)

  const [stateValue, setStateValue] = useState<T>(() => {
    if (propsValue !== undefined) {
      return propsValue!
    } else if (defaultValue !== undefined) {
      return defaultValue!
    } else {
      return defaultStateValue
    }
  })

  useEffect(() => {
    if (propsValue === undefined && !isFirstRender.current) {
      setStateValue(propsValue!)
    }

    // 第一次渲染就不需要设置 setStateValue 了，上面初始化已经设置过了
    isFirstRender.current = false
  }, [propsValue])

  const mergedValue = propsValue === undefined ? stateValue : propsValue

  const setState = useCallback(
    (value: SetStateAction<T>) => {
      const res = isFunction(value) ? value(stateValue) : value

      if (propsValue === undefined) {
        setStateValue(res)
      }
      onChange?.(res)
    },
    [stateValue]
  )

  return [mergedValue, setState]
}

export default useMergeState
