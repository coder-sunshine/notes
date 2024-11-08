import type { Preview } from '@storybook/react'
import { Subtitle, Title, Description, Primary, Controls, Stories } from '@storybook/blocks'
import React from 'react'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      page: () => (
        <>
          12354
          <Title></Title>
          12345
          <Subtitle></Subtitle>
          <Description></Description>
          <Primary></Primary>
          <Controls></Controls>
          <Stories></Stories>
        </>
      )
    }
  }
}

export default preview
