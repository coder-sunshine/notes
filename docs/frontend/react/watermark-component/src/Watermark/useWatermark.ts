import { CSSProperties, useEffect, useRef, useState } from 'react'
import { WatermarkProps } from '.'
import { merge } from 'lodash-es'

export type WatermarkOptions = Omit<WatermarkProps, 'className' | 'style' | 'children'>

export function isNumber(obj: any): obj is number {
  // obj === obj 用于判断 NaN，因为 NaN !== NaN
  return Object.prototype.toString.call(obj) === '[object Number]' && obj === obj
}

// 判断是否为数字，不是返回默认值
export function toNumber(value?: string | number, defaultValue?: number) {
  if (value === undefined) {
    return defaultValue
  }
  if (isNumber(value)) {
    return value
  }

  const numberVal = parseFloat(value)
  return isNumber(numberVal) ? numberVal : defaultValue
}

const defaultOptions = {
  rotate: -20,
  zIndex: 1,
  width: 100,
  gap: [100, 100],
  fontStyle: {
    fontSize: '16px',
    color: 'rgba(0, 0, 0, 0.15)',
    fontFamily: 'sans-serif',
    fontWeight: 'normal'
  } as CSSProperties,
  getContainer: () => document.body
}

const getMergedOptions = (o: Partial<WatermarkOptions>) => {
  const options = o || {}

  const mergedOptions = {
    ...options,
    rotate: options.rotate || defaultOptions.rotate,
    zIndex: options.zIndex || defaultOptions.zIndex,
    // fontStyle 是默认 fontStyle 和传入的 fontStyle 的合并
    fontStyle: { ...defaultOptions.fontStyle, ...options.fontStyle },
    // width 的默认值，如果是图片就用默认 width，否则 undefined，因为后面文字宽度是动态算的。
    width: toNumber(options.width, options.image ? defaultOptions.width : undefined),
    height: toNumber(options.height, undefined),
    getContainer: options.getContainer,
    gap: [
      toNumber(options.gap?.[0], defaultOptions.gap[0]),
      toNumber(options.gap?.[1] || options.gap?.[0], defaultOptions.gap[1])
    ]
  } as Required<WatermarkOptions> // 处理完之后肯定是有值的，所以断言为 Required<WatermarkOptions> 类型。 Required 是去掉可选用的

  const mergedOffsetX = toNumber(mergedOptions.offset?.[0], 0)!
  const mergedOffsetY = toNumber(mergedOptions.offset?.[1] || mergedOptions.offset?.[0], 0)!
  // offset 的默认值是 0。
  mergedOptions.offset = [mergedOffsetX, mergedOffsetY]

  return mergedOptions
}

const measureTextSize = (ctx: CanvasRenderingContext2D, content: string[], rotate: number) => {
  let width = 0
  let height = 0
  const lineSize: Array<{ width: number; height: number }> = []

  content.forEach(item => {
    const { width: textWidth, fontBoundingBoxAscent, fontBoundingBoxDescent } = ctx.measureText(item)

    const textHeight = fontBoundingBoxAscent + fontBoundingBoxDescent

    if (textWidth > width) {
      width = textWidth
    }

    height += textHeight
    lineSize.push({ height: textHeight, width: textWidth })
  })

  const angle = (rotate * Math.PI) / 180

  return {
    originWidth: width,
    originHeight: height,
    width: Math.ceil(Math.abs(Math.sin(angle) * height) + Math.abs(Math.cos(angle) * width)),
    height: Math.ceil(Math.abs(Math.sin(angle) * width) + Math.abs(height * Math.cos(angle))),
    lineSize
  }
}

const getCanvasData = async (
  options: Required<WatermarkOptions>
): Promise<{ width: number; height: number; base64Url: string }> => {
  const { rotate, image, content, fontStyle, gap } = options
  // 创建个 canvas 元素，拿到画图用的 context。
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const ratio = window.devicePixelRatio

  // 封装 configCanvas 方法，用来设置 canvas 的宽高、rotate、scale：
  const configCanvas = (size: { width: number; height: number }) => {
    // 宽高同样是 gap + width、gap + height。
    const canvasWidth = size.width + gap[0]
    const canvasHeight = size.height + gap[1]
    canvas.setAttribute('width', `${canvasWidth * ratio}px`)
    canvas.setAttribute('height', `${canvasHeight * ratio}px`)
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`

    // 用 translate 移动中心点到 宽高的一半的位置再 schale、rotate。
    ctx.translate((canvasWidth * ratio) / 2, (canvasHeight * ratio) / 2)
    // 因为不同屏幕的设备像素比不一样，也就是 1px 对应的物理像素不一样，所以要在单位后面乘以 devicePixelRatio。
    // 我们设置了 scale 放大 devicePixelRatio 倍，这样接下来绘制尺寸就不用乘以设备像素比了。
    ctx.scale(ratio, ratio)

    const RotateAngle = (rotate * Math.PI) / 180
    ctx.rotate(RotateAngle)
  }

  // 封装 drawText、drawImage 两个方法，优先绘制 image。
  const drawText = () => {
    const { fontSize, color, fontWeight, fontFamily } = fontStyle
    // fontSize 转为 number。
    const realFontSize = toNumber(fontSize, 0) || fontStyle.fontSize

    ctx.font = `${fontWeight} ${realFontSize}px ${fontFamily}`
    // 如果没有传入 width、height 就自己计算，
    const measureSize = measureTextSize(ctx, [...content], rotate)

    const width = options.width || measureSize.width
    const height = options.height || measureSize.height

    configCanvas({ width, height })

    ctx.fillStyle = color!
    ctx.font = `${fontWeight} ${realFontSize}px ${fontFamily}`
    // 设置 textBaseline 为 top，顶部对齐
    ctx.textBaseline = 'top'
    // 然后依次绘制文字。
    // 绘制文字要按照坐标来，在 measureTextSize 里计算出每一行的 lineSize，也就是行高、行宽。

    // 在行宽的一半的地方开始绘制文字，行内每个文字的位置是行高的一半 * index。
    ;[...content].forEach((item, index) => {
      const { height: lineHeight, width: lineWidth } = measureSize.lineSize[index]

      const xStartPoint = -lineWidth / 2
      const yStartPoint = -(options.height || measureSize.originHeight) / 2 + lineHeight * index

      ctx.fillText(item, xStartPoint, yStartPoint, options.width || measureSize.originWidth)
    })
    return Promise.resolve({ base64Url: canvas.toDataURL(), height, width })
  }

  const drawImage = () => {
    // 然后实现 drawText：
    return new Promise<{ width: number; height: number; base64Url: string }>(resolve => {
      // new Image 指定 src 加载图片。
      const img = new Image()
      // 这里的 crossOrigin 设置 anonymous 是跨域的时候不携带 cookie，而 refererPolicy 设置 no-referrer 是不携带 referer，都是安全相关的。
      img.crossOrigin = 'anonymous'
      img.referrerPolicy = 'no-referrer'

      img.src = image
      // onload 的时候，对于没有设置 width 或 height 的时候，根据图片宽高比算出另一个值。
      img.onload = () => {
        let { width, height } = options
        if (!width || !height) {
          if (width) {
            height = (img.height / img.width) * +width
          } else {
            width = (img.width / img.height) * +height
          }
        }
        // 然后调用 configCanvas 修改 canvas 的宽高、缩放、旋转。
        configCanvas({ width, height })

        // 之后在中心点绘制一张图片，返回 base64 的结果。
        ctx.drawImage(img, -width / 2, -height / 2, width, height)
        return resolve({ base64Url: canvas.toDataURL(), width, height })
      }
      img.onerror = () => {
        // 当加载失败时，onerror 里绘制文本。
        return drawText()
      }
    })
  }

  return image ? drawImage() : drawText()
}

export default function useWatermark(params: WatermarkOptions) {
  const [options, setOptions] = useState(params || {})

  const mergedOptions = getMergedOptions(options)
  const watermarkDiv = useRef<HTMLDivElement>()

  const mutationObserver = useRef<MutationObserver>()

  const container = mergedOptions.getContainer()
  const { gap, zIndex } = mergedOptions

  function drawWatermark() {
    if (!container) {
      return
    }

    getCanvasData(mergedOptions).then(({ base64Url, width, height }) => {
      const offsetLeft = mergedOptions.offset[0] + 'px'
      const offsetTop = mergedOptions.offset[1] + 'px'

      const wmStyle = `
      width:calc(100% - ${offsetLeft});
      height:calc(100% - ${offsetTop});
      position:absolute;
      top:${offsetTop};
      left:${offsetLeft};
      bottom:0;
      right:0;
      pointer-events: none;
      z-index:${zIndex};
      background-position: 0 0;
      background-size:${gap[0] + width}px ${gap[1] + height}px;
      background-repeat: repeat;
      background-image:url(${base64Url})`

      if (!watermarkDiv.current) {
        const div = document.createElement('div')
        watermarkDiv.current = div
        container.append(div)
        container.style.position = 'relative'
      }

      watermarkDiv.current?.setAttribute('style', wmStyle.trim())

      if (container) {
        mutationObserver.current?.disconnect()

        mutationObserver.current = new MutationObserver(mutations => {
          const isChanged = mutations.some(mutation => {
            let flag = false
            if (mutation.removedNodes.length) {
              flag = Array.from(mutation.removedNodes).some(node => node === watermarkDiv.current)
            }
            if (mutation.type === 'attributes' && mutation.target === watermarkDiv.current) {
              flag = true
            }
            return flag
          })
          if (isChanged) {
            watermarkDiv.current = undefined
            drawWatermark()
          }
        })

        mutationObserver.current.observe(container, {
          attributes: true,
          subtree: true,
          childList: true
        })
      }
    })
  }

  useEffect(() => {
    drawWatermark()
  }, [options])

  return {
    generateWatermark: (newOptions: Partial<WatermarkOptions>) => {
      // 调用 generateWatermark 后，更新 options 触发 useEffect 重新渲染
      setOptions(merge({}, options, newOptions))
    },
    destroy: () => {}
  }
}
