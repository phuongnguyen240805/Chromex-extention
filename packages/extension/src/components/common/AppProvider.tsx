import React from "react"
import { TooltipProvider } from "./TooltipProvider"
import { ToastProvider } from "./ToastProvider"
import { DockManager } from "./DockManager"

export const AppProvider: React.FC<{ children: React.ReactNode, showDock?: boolean }> = ({ children, showDock = true }) => {
  return (
    <ToastProvider>
      <TooltipProvider>
        <div className="wsk-root text-slate-200 antialiased selection:bg-indigo-500/30">
          {children}
          {showDock && <DockManager />}
        </div>
      </TooltipProvider>
    </ToastProvider>
  )
}
