'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Hospital, User, Info, AlertTriangle, CheckCircle, Mail, Trash2 } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/lib/notifications'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Polling para simular real-time na apresentação (5 em 5 segundos)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (Array.isArray(data)) {
          setNotifications(data)
        }
      } catch (err) {
        console.error('Erro ao buscar notificações:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

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
      case 'SUCCESS': return <CheckCircle className="text-green-400" size={18} />
      case 'ALERT': return <AlertTriangle className="text-red-400" size={18} />
      case 'WARNING': return <Info className="text-yellow-400" size={18} />
      case 'EMAIL': return <Mail className="text-blue-400" size={18} />
      default: return <Bell size={18} />
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors duration-200 focus:outline-none"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-bold">
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[450px] overflow-y-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="text-blue-400">Notificações</span>
            </h3>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-white/5 bg-white/5 transition-all duration-200 uppercase font-bold tracking-wider shadow-sm"
                  title="Marcar todas como lidas"
                >
                  <Trash2 size={12} />
                  Limpar tudo
                </button>
              )}
              {notifications.length > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-bold border border-blue-500/10">
                  {notifications.length}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm italic">
                Nenhuma resposta pendente no momento.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors group relative ${n.type === 'EMAIL' ? 'border-l-2 border-l-blue-500/50' : ''}`}>
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate pr-6">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                        {n.hospital && (
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            <Hospital size={10} /> {n.hospital.name}
                          </span>
                        )}
                        {n.patient && (
                          <span className="flex items-center gap-1 text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            <User size={10} /> {n.patient.name}
                          </span>
                        )}
                        {n.type === 'EMAIL' && (
                          <span className="text-blue-400 font-medium">E-mail da Central</span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleMarkAsRead(n.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-green-400 bg-slate-800 rounded-md transition-all duration-200"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 text-center border-t border-white/10">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              Fechar painel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


