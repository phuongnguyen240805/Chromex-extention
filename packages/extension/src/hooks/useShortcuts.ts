import { useEffect } from "react"

type ShortcutHandler = (e: KeyboardEvent) => void

interface ShortcutConfig {
  [key: string]: ShortcutHandler
}

/**
 * Hook to manage keyboard shortcuts.
 * Supports WSK-like shortcut parsing.
 */
export const useShortcuts = (config: ShortcutConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push("ctrl")
      if (e.shiftKey) keys.push("shift")
      if (e.altKey) keys.push("alt")
      keys.push(e.key.toLowerCase())
      
      const combo = keys.join("+")
      
      const handler = config[combo]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [config])
}
