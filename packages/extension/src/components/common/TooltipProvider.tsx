import React, { useEffect, useRef } from "react"

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create tooltip element if it doesn't exist
    let tooltip = document.getElementById("wsk-tooltip") as HTMLDivElement
    if (!tooltip) {
      tooltip = document.createElement("div")
      tooltip.id = "wsk-tooltip"
      tooltip.className = "wsk-tooltip-el"
      document.body.appendChild(tooltip)
    }
    tooltipRef.current = tooltip

    const container = document.body // Or a specific root if needed

    const showTooltip = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-tooltip]") as HTMLElement
      if (!target) return

      const text = target.getAttribute("data-tooltip")
      if (!text) return

      if (tooltipRef.current) {
        tooltipRef.current.textContent = text
        tooltipRef.current.style.display = "block"
        
        const rect = target.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        
        tooltipRef.current.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`
        tooltipRef.current.style.top = `${rect.top - tooltipRect.height - 8}px`
        tooltipRef.current.classList.add("visible")
      }
    }

    const hideTooltip = (e: MouseEvent) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = "none"
        tooltipRef.current.classList.remove("visible")
      }
    }

    container.addEventListener("mouseover", showTooltip)
    container.addEventListener("mouseout", hideTooltip)

    return () => {
      container.removeEventListener("mouseover", showTooltip)
      container.removeEventListener("mouseout", hideTooltip)
    }
  }, [])

  return <>{children}</>
}
