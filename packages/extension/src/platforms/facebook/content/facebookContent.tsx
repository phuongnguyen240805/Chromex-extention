import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import { FloatingActionButton } from "../ui"

export const config: PlasmoCSConfig = {
  matches: ["https://www.facebook.com/*"]
}

const FacebookContent = () => {
  return (
    <div className="social-aio-facebook">
      <FloatingActionButton />
    </div>
  )
}

export default FacebookContent
