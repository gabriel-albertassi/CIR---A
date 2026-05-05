'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Hospital, User, Info, AlertTriangle, CheckCircle, Mail, Trash2, X, BellOff } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/lib/notifications'
import { useNotification } from '@/context/NotificationContext'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useNotification()
  const prevIds = useRef<Set<string>>(new Set())

  // Polling para simular real-time na apresentação (5 em 5 segundos)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (Array.isArray(data)) {
          // Detectar novas notificações para disparar Toasts
          const currentIds = new Set(data.map(n => n.id))
          
          if (prevIds.current.size > 0) { // Evitar disparar no primeiro load
            data.forEach(n => {
              if (!prevIds.current.has(n.id)) {
                addToast({
                  title: n.title || 'Nova Notificação',
                  message: n.message,
                  type: n.type || 'INFO'
                })
              }
            })
          }
          
          prevIds.current = currentIds
          setNotifications(data)
        }
      } catch (err) {
        console.error('Erro ao buscar notificações:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [addToast])

  const handleMarkAsRead = async (id: string) => {
    setLoading(true)
    try {
      await markAsRead(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return
    setLoading(true)
    try {
      await markAllAsRead()
      setNotifications([])
    } catch (err) {
      console.error('Erro ao limpar notificações:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="text-green-400" size={16} />
      case 'ALERT': return <AlertTriangle className="text-red-400" size={16} />
      case 'WARNING': return <Info className="text-yellow-400" size={16} />
      case 'EMAIL': return <Mail className="text-blue-400" size={16} />
      default: return <Bell className="text-slate-400" size={16} />
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-300 focus:outline-none group ${
          isOpen ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Bell size={22} className={notifications.length > 0 ? 'animate-bounce' : ''} />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-[#081423]"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-4 w-96 max-h-[550px] flex flex-col premium-glass rounded-3xl shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="font-extrabold text-white text-lg tracking-tight">Notificações</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  {notifications.length > 0 ? `${notifications.length} pendentes` : 'Tudo em dia'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Limpar todas"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto notifications-scroll max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-white/5">
                    <BellOff size={24} className="text-slate-600" />
                  </div>
                  <h4 className="text-slate-300 font-bold text-sm">Nenhuma novidade</h4>
                  <p className="text-slate-500 text-xs mt-1">
                    Você está em dia com todas as atualizações de regulação.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className="p-4 hover:bg-white/[0.04] transition-all group relative border-b border-white/5"
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative ${
                          n.type === 'ALERT' ? 'bg-red-500/10' : 
                          n.type === 'EMAIL' ? 'bg-blue-500/10' : 
                          n.type === 'SUCCESS' ? 'bg-green-500/10' : 'bg-slate-800/50'
                        }`}>
                          {getTypeIcon(n.type)}
                          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${
                            n.type === 'ALERT' ? 'bg-red-500' : 
                            n.type === 'EMAIL' ? 'bg-blue-500' : 
                            n.type === 'SUCCESS' ? 'bg-green-500' : 'bg-slate-500'
                          } animate-pulse`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-sm font-extrabold text-white truncate group-hover:text-blue-400 transition-colors">
                              {n.title}
                            </h5>
                            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap ml-2">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {n.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {n.hospital && (
                                <span className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                                  <Hospital size={10} className="text-blue-400" /> {n.hospital.name}
                                </span>
                              )}
                              {n.patient && (
                                <span className="flex items-center gap-1.5 text-[9px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-bold">
                                  <User size={10} className="text-slate-400" /> {n.patient.name}
                                </span>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => handleMarkAsRead(n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all transform translate-x-2 group-hover:translate-x-0"
                              title="Arquivar"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                <button 
                  className="text-[10px] font-bold text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Fechar Central de Alertas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
