import testPlugin from './src/plugins/test.plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      padding: {
        1: '30px'
      },
      fontSize: {
        base: ['30px', '2rem']
      }
    },
    screens: {
      md: '300px'
    }
  },
  plugins: [testPlugin]
}
