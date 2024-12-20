import { FC, PropsWithChildren } from 'react'
import { styled } from 'styled-components'

const Title = styled.h1<{ color?: string }>`
  font-size: 30px;
  text-align: center;
  color: ${props => props.color || 'blue'};
`

const Header = styled.div`
  padding: 20px;
  background: pink;
`

const Button = styled.button<{ color?: string }>`
  font-size: 20px;
  margin: 5px 10px;
  border: 2px solid #000;
  color: ${props => props.color || 'blue'};
`

const Button2 = styled(Button)`
  border-radius: 8px;
`

interface LinkProps extends PropsWithChildren {
  href: string
  className?: string
}

const Link: FC<LinkProps> = props => {
  const { href, className, children } = props

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

const StyledLink = styled(Link)`
  color: green;
  font-size: 40px;
`

function App() {
  return (
    <>
      <Header>
        <Title>Hello World!</Title>
        <Title color='green'>Hello World!</Title>
        <Title color='black'>Hello World!</Title>
      </Header>
      <Button color='red'>Hello World!</Button>
      <Button2 color='red'>Hello World!</Button2>
      <StyledLink href='#aaa'>click me</StyledLink>
    </>
  )
}

export default App
