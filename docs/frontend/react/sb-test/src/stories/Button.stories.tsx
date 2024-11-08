import type { Meta, StoryObj } from '@storybook/react'
import { expect, fn, userEvent, within } from '@storybook/test'

import { Button } from './Button'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'test/Button1',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    backgrounds: {
      values: [
        { name: '红色', value: 'red' },
        { name: '蓝色', value: 'blue' }
      ]
    }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: 'text' }
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button'
  }
}

export const Secondary: Story = {
  args: {
    label: 'Button'
  }
}

export const Large: Story = {
  args: {
    size: 'large',
    label: 'Button'
  }
}

export const Small: Story = {
  args: {
    size: 'small',
    label: 'Button'
  }
}

export const Test: Story = {
  args: {
    size: 'large',
    label: 'test',
    backgroundColor: 'green'
  },
  render(args, meta) {
    const list = meta.loaded.list
    return (
      <div>
        <button>aaaa</button>
        <Button {...args} />
        <button>bbb</button>
        <div>{list.join(',')}</div>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const btn = await canvas.getByRole('button', {
      name: /aaa/i
    })
    console.log(btn)

    await userEvent.click(btn)
    console.log(1234)

    btn.textContent = '修改为ccc'
  },
  loaders: [
    async () => {
      await '假装 fetch'
      return {
        list: [111, 222, 333]
      }
    }
  ]
}

export const Test123: Story = {
  args: {
    size: 'medium',
    label: 'test',
    backgroundColor: 'green'
  },

  render(args) {
    return (
      <div>
        <button>aaaa</button>
        <Button {...args} />
        <button>bbb</button>
      </div>
    )
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const btn = await canvas.getByRole('button', {
      name: /test/i
    })
    await userEvent.click(btn)

    // btn.textContent = '修改为ccc'

    await expect(btn.textContent).toEqual('test')

    await expect(btn.style.backgroundColor).toEqual('green')
    // await expect(btn.style.backgroundColor).toEqual('blue')
  }
}
