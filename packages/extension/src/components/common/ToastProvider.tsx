import React, { createContext, useContext, useState, useCallback } from "react"

type ToastType = "info" | "success" | "warning" | "error"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass px-4 py-2 rounded-lg shadow-lg border-l-4 transition-all animate-in slide-in-from-right-full font-semibold font-inter text-sm ${
              t.type === "success" ? "border-green-500" : 
              t.type === "error" ? "border-red-500" : 
              t.type === "warning" ? "border-yellow-500" : 
              "border-indigo-500"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useWSKToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useWSKToast must be used within ToastProvider")
  return context
}
