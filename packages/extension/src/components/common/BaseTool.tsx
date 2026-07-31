import React, { useEffect, useLayoutEffect } from "react"
import { useFocusRestore } from "~hooks/useFocusRestore"

interface BaseToolProps {
  children: React.ReactNode
  onMount?: () => void
  onUpdate?: () => void
  className?: string
}

/**
 * BaseTool mimics the WSK.Component lifecycle.
 * It handles automatic focus restoration and provides mount/update hooks.
 */
export const BaseTool: React.FC<BaseToolProps> = ({ 
  children, 
  onMount, 
  onUpdate,
  className = "" 
}) => {
  const { saveFocus, restoreFocus } = useFocusRestore()

  // Equivalent to onMount
  useEffect(() => {
    if (onMount) onMount()
  }, [])

  // Equivalent to onUpdate/rerender logic
  // useLayoutEffect runs before browser paint, ideal for focus restoration
  useLayoutEffect(() => {
    saveFocus()
    // In React, the "rerender" happens automatically when props/state change
    // We just need to ensure we restore focus after that
    restoreFocus()
    if (onUpdate) onUpdate()
  })

  return (
    <div className={`wsk-tool-container ${className}`}>
      {children}
    </div>
  )
}
