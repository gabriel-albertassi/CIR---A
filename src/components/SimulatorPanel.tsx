'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Send, X, Check, AlertCircle, Loader2 } from 'lucide-react'

export default function SimulatorPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [hospitals, setHospitals] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [selectedHospital, setSelectedHospital] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [status, setStatus] = useState<'ACCEPT' | 'REJECT'>('ACCEPT')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Carregar dados para o simulador
      const loadData = async () => {
        try {
          const [hRes, pRes] = await Promise.all([
            fetch('/api/hospitals'), // Precisaremos criar ou usar um existente
            fetch('/api/patients/list') // Simplificado
          ])
          const hData = await hRes.json()
          const pData = await pRes.json()
          setHospitals(Array.isArray(hData) ? hData : [])
          setPatients(Array.isArray(pData) ? pData : [])
        } catch (err) {
          console.error('Erro ao carregar dados do simulador', err)
        }
      }
      loadData()
    }
  }, [isOpen])

  const handleSimulate = async () => {
    if (!selectedHospital || !selectedPatient) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/simulate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: selectedHospital,
          patientId: selectedPatient,
          status,
          message: message || undefined
        })
      })
      
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setIsOpen(false)
        }, 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão de Ativação Discreto (Canto Inferior Esquerdo) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 p-3 bg-slate-800/40 hover:bg-blue-600/40 text-blue-400/50 hover:text-blue-300 rounded-full backdrop-blur-md border border-white/5 transition-all duration-300 z-50 group shadow-lg"
        title="Simulador de Respostas (Demo)"
      >
        <FlaskConical size={20} className="group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FlaskConical size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold">Simulador de Respostas</h2>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Laboratório de Testes CIR-A</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hospital Respondendo</label>
                <select 
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                >
                  <option value="">Selecione o Hospital...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Paciente Alvo</label>
                <select 
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">Selecione o Paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setStatus('ACCEPT')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${status === 'ACCEPT' ? 'bg-green-500/20 border-green-500 text-green-400 font-bold' : 'bg-slate-800 border-white/5 text-slate-400'}`}
                >
                  <Check size={18} /> Aceitar Vaga
                </button>
                <button 
                  onClick={() => setStatus('REJECT')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${status === 'REJECT' ? 'bg-red-500/20 border-red-500 text-red-400 font-bold' : 'bg-slate-800 border-white/5 text-slate-400'}`}
                >
                  <AlertCircle size={18} /> Negar Vaga
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Mensagem do Hospital (Opcional)</label>
                <textarea 
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Deixe em branco para usar o padrão inteligente..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <button 
                onClick={handleSimulate}
                disabled={loading || !selectedHospital || !selectedPatient || success}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${success ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20'}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : success ? <Check /> : <Send size={18} />}
                {success ? 'Resposta Enviada!' : 'Disparar Simulação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
