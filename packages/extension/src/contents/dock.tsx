import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect } from "react"
import { AppProvider } from "~components/common/AppProvider"
import { useWSKStore } from "~store/wsk-store"
import styleText from "data-text:../style.css"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const SocialAIODock = () => {
  const { dockVisible, set } = useWSKStore()

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'TOGGLE_DOCK') {
        set("dockVisible", !dockVisible)
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [dockVisible])

  return (
    <AppProvider showDock={true}>
      <div className="social-aio-container" />
    </AppProvider>
  )
}

export default SocialAIODock
