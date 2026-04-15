'use client'

import { useEffect, useState } from 'react'
import { getAllUsers, updateUserPermissions } from '../actions'
import { ShieldCheck, ShieldAlert, User, Check, X, Loader2, Search, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const data = await getAllUsers()
      if (data.length === 0) {
        // If empty data but not loading, might mean access denied (returned [] in action)
        // Check if there is a way to distinguish, but for now redirect.
      }
      setUsers(data)
      setLoading(false)
    }
    init()
  }, [])

  async function fetchUsers() {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  async function handleToggle(userId: string, field: string, value: any) {
    setUpdatingId(`${userId}-${field}`)
    const res = await updateUserPermissions(userId, { [field]: value })
    if (res.error) alert(res.error)
    else await fetchUsers()
    setUpdatingId(null)
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin" size={40} color="#00d8ff" />
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.4rem', color: '#f1f5f9' }}>
            Gestão de <span style={{ color: '#00d8ff' }}>Operadores</span>
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Controle permissões granulares e roles do sistema CIR-A.
          </p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem 0.75rem 3rem', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '14px',
              color: 'white',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Operador</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Cargo (Role)</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Cancelar Pac.</th>
                <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Imprimir Rel.</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Nenhum operador encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s hover' }} className="table-row-hover">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,180,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d8ff' }}>
                          <User size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>{u.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <select 
                        value={u.role}
                        onChange={(e) => handleToggle(u.id, 'role', e.target.value)}
                        disabled={updatingId === `${u.id}-role`}
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '8px', 
                          color: '#e2e8f0', 
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="REGULADOR">REGULADOR</option>
                        <option value="ENFERMEIRO_AUDITOR">ENFERMEIRO</option>
                        <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                      </select>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <PermissionToggle 
                        isActive={u.canCancelPatient} 
                        isLoading={updatingId === `${u.id}-canCancelPatient`}
                        onClick={() => handleToggle(u.id, 'canCancelPatient', !u.canCancelPatient)}
                      />
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <PermissionToggle 
                        isActive={u.canPrintReports} 
                        isLoading={updatingId === `${u.id}-canPrintReports`}
                        onClick={() => handleToggle(u.id, 'canPrintReports', !u.canPrintReports)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>

    </div>
  )
}

function PermissionToggle({ isActive, isLoading, onClick }: { isActive: boolean, isLoading: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      disabled={isLoading}
      style={{
        width: '64px',
        height: '32px',
        borderRadius: '99px',
        border: 'none',
        background: isLoading ? 'rgba(255,255,255,0.1)' : (isActive ? '#059669' : '#334155'),
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px'
      }}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        transform: isActive ? 'translateX(32px)' : 'translateX(0)'
      }}>
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" color="#64748b" />
        ) : (
          isActive ? <Check size={14} color="#059669" /> : <X size={14} color="#334155" />
        )}
      </div>
    </button>
  )
}
