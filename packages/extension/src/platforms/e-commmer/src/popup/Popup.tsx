import { useState, useEffect } from 'react'

import './Popup.css'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import LayoutRoot from '../SHARED/layout'

export const Popup = () => {
  const [count, setCount] = useState(0)
  const link = 'https://github.com/guocaoyi/create-chrome-ext'

  const minus = () => {
    if (count > 0) setCount(count - 1)
  }

  const add = () => setCount(count + 1)

  useEffect(() => {
    chrome.storage.sync.get(['count'], (result) => {
      setCount(result.count || 0)
    })
  }, [])

  useEffect(() => {
    chrome.storage.sync.set({ count })
    chrome.runtime.sendMessage({ type: 'COUNT', count })
  }, [count])

  const openSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' })
  }

  return <LayoutRoot></LayoutRoot>
}

export default Popup
