import copy from 'copy-to-clipboard'
import CopyToClipboard from './CopyToClipboard'
// import { CopyToClipboard } from 'react-copy-to-clipboard'

export default function App() {
  function onClick() {
    const res = copy('复制的文本')
    console.log('done', res)
  }

  return (
    <>
      <div onClick={onClick}>复制</div>

      <CopyToClipboard
        text={'复制的文本2'}
        onCopy={(text, result) => {
          console.log('text', text)
          console.log('result', result)
        }}
      >
        <div onClick={() => alert(2)}>复制2</div>
      </CopyToClipboard>
    </>
  )
}
