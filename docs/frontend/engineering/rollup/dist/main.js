;(() => {
  'use strict'
  const o = r => {
      if ('object' != typeof r || null === r) return r
      const t = Array.isArray(r) ? [] : {}
      for (let e in r) r.hasOwnProperty(e) && (t[e] = o(r[e]))
      return t
    },
    r = {
      randomNumber: (o, r) => ((o = Math.ceil(o)), (r = Math.floor(r)), Math.floor(Math.random() * (r - o + 1)) + o),
      deepClone: o
    }.getRandomNum(1, 10)
  console.log(r)
})()
