import { prisma } from '../../lib/db'
import { ALL_HOSPITALS } from '../../lib/constants'
import VagasForm from './VagasForm'
import { Building2, HeartPulse } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VagasPage() {
  try {
    const currentAvailabilities = await prisma.bedAvailability.findMany();

    // Map into an easily consumable format for the client
    const mapData: Record<string, any> = {};
    currentAvailabilities.forEach(b => {
      mapData[b.hospital_name] = b;
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-700 relative">
        <div className="absolute inset-0 technical-grid pointer-events-none opacity-20 -m-8" />
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] font-outfit">CENSO OPERACIONAL • ATUALIZAÇÃO 24H</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none font-outfit">
              Censo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400">Leitos</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
              <Building2 size={12} className="text-emerald-500/50" />
              Gestão de Capacidade • Rede Hospitalar
            </p>
          </div>
        </div>

        {/* INFO CARD */}
        <div className="premium-card p-4 border-l-4 border-l-emerald-500 bg-slate-900/40 relative z-10 overflow-hidden">
          <div className="scanline opacity-5" />
          <p className="text-slate-400 text-xs font-medium leading-relaxed flex items-center gap-3">
            <HeartPulse size={14} className="text-emerald-400" />
            <span>Atualize a quantidade de vagas disponíveis informadas em cada hospital para otimização da regulação.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {ALL_HOSPITALS.map(hospitalName => {
            const data = mapData[hospitalName] || {
              cti_masc: 0, cti_fem: 0, clinica_masc: 0, clinica_fem: 0, sem_vagas: false
            };

            return (
              <div key={hospitalName} className="premium-card p-6 technical-grid bg-slate-900/20">
                <VagasForm hospitalName={hospitalName} initialData={data} />
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error('[VAGAS_PAGE_ERROR]', error)
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Erro ao carregar censo de leitos</h1>
        <p style={{ color: '#94a3b8' }}>Por favor, recarregue a página ou verifique sua conexão com o servidor.</p>
      </div>
    )
  }
}

