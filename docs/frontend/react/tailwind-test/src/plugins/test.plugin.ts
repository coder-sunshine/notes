import plugin from 'tailwindcss/plugin'

const testPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.test': {
      background: 'blue',
      color: 'yellow'
    },
    '.test-test': {
      'font-size': '70px'
    }
  })
})

export default testPlugin
