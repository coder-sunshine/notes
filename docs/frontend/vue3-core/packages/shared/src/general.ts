export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'

export const hasChanged = (value: any, oldValue: any): boolean => !Object.is(value, oldValue)

export const isFunction = (val: unknown): val is Function => typeof val === 'function'

export function isOn(key: string) {
  return /^on[A-Z]/.test(key)
}

export const isArray = Array.isArray

export const isString = (val: unknown): val is string => typeof val === 'string'
