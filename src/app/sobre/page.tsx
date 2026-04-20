import Image from 'next/image'
import { Sparkles, Activity, ShieldCheck, Clock, Layers, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SobrePage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Header Principal */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', background: 'linear-gradient(90deg, #e2e8f0, #00d8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Sobre o Sistema
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 500 }}>
          Compreenda a visão por trás da CIRA e seu impacto em Volta Redonda.
        </p>
      </div>

      {/* Seção: O que é a CIR-A e por que foi criada */}
      <div style={{ padding: '3rem', background: 'rgba(8,20,40,0.7)', borderRadius: '24px', border: '1px solid rgba(0,180,216,0.2)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(37,99,235,0.2)', borderRadius: '12px', color: '#60a5fa' }}><Sparkles size={24} /></div>
              Nossa Missão
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
              A <strong style={{ color: '#e2e8f0' }}>CIRA (Central Inteligente de Regulação Automatizada)</strong> nasceu para revolucionar e humanizar a gestão de leitos e transferências médicas no município de Volta Redonda.
            </p>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>
              No modelo fragmentado do passado, a regulação dependia excessivamente de telefonemas, papéis e planilhas desconexas, o que naturalmente aumentava a margem para atrasos. <strong style={{ color: '#e2e8f0' }}>A CIRA foi criada para resolver essa dor:</strong> unir todos os hospitais sob uma mesma linguagem digital, criando uma "torre de controle" capaz de enxergar tudo em tempo real para não deixar nenhum paciente esperando sem necessidade.
            </p>
          </div>
          <div className="logo-container-glow" style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', border: '1px dashed rgba(0,180,216,0.3)' }}>
            <Image src="/logo.png" alt="Logo CIR-A" width={300} height={100} style={{ width: '100%', height: 'auto', maxWidth: '300px', display: 'block', margin: '0 auto' }} />
          </div>
        </div>
      </div>

      {/* Seção: Resumo de O Que o Sistema Faz */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '1.5rem', textAlign: 'center' }}>Por dentro do Sistema: O que fazemos?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '14px', borderRadius: '14px' }}><Activity size={32} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f1f5f9' }}>Triagem de Gravidade Híbrida</h4>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                O sistema categoriza pacientes automaticamente por cores de risco (Sala Vermelha, CTI, Clínica). Ele impede atrasos para casos críticos, ordenando a fila baseado em algoritmos de tempo-gravidade.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '14px', borderRadius: '14px' }}><Layers size={32} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f1f5f9' }}>Censo Dinâmico Centralizado</h4>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Unimos todas as unidades de saúde em um único painel. Os hospitais alimentam a plataforma com os leitos disponíveis, e a regulação aloca os pacientes instantaneamente, sem planilhas de papel.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '14px', borderRadius: '14px' }}><Clock size={32} /></div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#f1f5f9' }}>Registro Histórico Intocável</h4>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Gravação contínua e imutável de todas as ofertas de leito, recusas, e transferências bem-sucedidas. Garante segurança jurídica total para o município e equipe médica.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Seção: O Impacto em VR */}
      <div className="card" style={{ padding: '4rem 3rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '24px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 10% 20%, rgba(59,130,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16,185,129,0.1) 0%, transparent 40%)' }}></div>
        
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', zIndex: 1 }}><Users size={32} color="#60a5fa" /></div>
        
        <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1.5rem 0', letterSpacing: '-0.5px', zIndex: 1 }}>O que isso agrega à saúde de Volta Redonda?</h2>
        
        <div style={{ maxWidth: '800px', zIndex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.8, margin: '0 0 1.5rem 0' }}>
            Pela primeira vez, a Central de Regulação da Secretaria Municipal de Saúde de Volta Redonda (SMSVR) passa a operar de forma integrada e orientada por dados, deixando um modelo predominantemente reativo para um fluxo mais estruturado e proativo.
          </p>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.8, margin: '0 0 1.5rem 0' }}>
            Com a implantação da CIRA (Central Inteligente de Regulação Automatizada), é estabelecida uma rede digital de comunicação entre os principais pontos assistenciais do município...
          </p>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.8, margin: '0 0 1.5rem 0' }}>
            Essa integração permite maior visibilidade do fluxo assistencial, facilitando a identificação de disponibilidade de leitos e agilizando o encaminhamento de pacientes de forma mais organizada e eficiente. Como resultado, há redução de retrabalho, melhor uso dos recursos hospitalares e maior previsibilidade no processo de regulação.
          </p>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.8, margin: '0 0 1.5rem 0' }}>
            A equipe de regulação passa a contar com apoio de ferramentas digitais e inteligência de apoio à decisão (Cirila), reduzindo a dependência de processos manuais e melhorando a organização das demandas.
          </p>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.8, margin: 0 }}>
            Na prática, isso significa mais eficiência operacional, melhor coordenação entre unidades de saúde e maior capacidade de resposta do sistema, contribuindo diretamente para a qualificação do atendimento ao cidadão.
          </p>
        </div>
      </div>

    </div>
  )
}
