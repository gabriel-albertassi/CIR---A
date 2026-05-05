'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, Info, Bell, X } from 'lucide-react'

type ToastType = 'SUCCESS' | 'ALERT' | 'WARNING' | 'INFO' | 'EMAIL'

interface Toast {
  id: string
  title: string
  message: string
  type: ToastType
  duration?: number
}

interface NotificationContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.duration])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 400) // Match animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'SUCCESS': return <CheckCircle className="text-green-400" size={20} />
      case 'ALERT': return <AlertTriangle className="text-red-400" size={20} />
      case 'WARNING': return <Info className="text-yellow-400" size={20} />
      case 'EMAIL': return <Bell className="text-blue-400" size={20} />
      default: return <Bell className="text-slate-400" size={20} />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'SUCCESS': return 'rgba(34, 197, 94, 0.5)'
      case 'ALERT': return 'rgba(239, 68, 68, 0.5)'
      case 'WARNING': return 'rgba(234, 179, 8, 0.5)'
      case 'EMAIL': return 'rgba(59, 130, 246, 0.5)'
      default: return 'rgba(0, 180, 216, 0.5)'
    }
  }

  return (
    <div 
      className={`toast-premium ${isExiting ? 'toast-premium-exit' : ''} group`}
      style={{ borderLeftColor: getBorderColor() }}
    >
      {/* Efeito Shimmer */}
      <div className="toast-shimmer" />
      
      <div className="toast-icon-glow">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-white mb-0.5 tracking-tight">
            {toast.title}
          </h4>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
            Agora
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-snug line-clamp-2">
          {toast.message}
        </p>
        
        {/* Botão de Ação Condicional */}
        {(toast.type === 'EMAIL' || toast.type === 'ALERT') && (
          <button className="toast-action-btn">
            Ver detalhes
            <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
          </button>
        )}
      </div>

      <button 
        onClick={handleRemove}
        className="text-slate-500 hover:text-white transition-all hover:rotate-90 relative z-10 p-1"
      >
        <X size={16} />
      </button>

      <div 
        className="toast-progress-bar" 
        style={{ 
          animationDuration: `${toast.duration || 5000}ms`,
          background: getBorderColor()
        }} 
      />
    </div>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
