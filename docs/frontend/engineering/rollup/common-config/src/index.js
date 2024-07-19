// import { randomNumber } from './util.js'

// const r = randomNumber(1, 10)
// console.log(r)

// import { chunk } from 'lodash-es'
// import _ from 'lodash'

// const r = _.chunk([1, 2, 3, 4], 2)
// console.log('🚀 ~ r:', r)

const arr = [1, 2, 3, 4].map(item => item * item)
console.log('🚀 ~ arr:', arr)

Promise.resolve(1).then(res => {
  console.log(res)
})
