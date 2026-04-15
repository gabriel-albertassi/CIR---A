'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as BarTooltip, Cell } from 'recharts';
import { Printer, FileBarChart2 } from 'lucide-react';
import Link from 'next/link';

export default function PrivateHospitalsChart({ data, totals }: { data: any[], totals: Record<string, number> | undefined }) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sempre mostramos o card para que o usuário possa ver o título e o botão de relatório
  const safeTotals = totals || {};

  // Transformar os totais para o formato de colunas do gráfico
  const chartData = [
    { name: 'H.FOA', value: safeTotals['Hospital H.FOA'] || 0, fill: '#f59e0b' },
    { name: 'Santa Cecília', value: safeTotals['Hospital Santa Cecília (HSC)'] || 0, fill: '#8b5cf6' },
    { name: 'Viver Mais', value: safeTotals['Hospital Viver Mais'] || 0, fill: '#10b981' }
  ];

  const hasData = chartData.some(d => d.value > 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '320px', padding: '1.5rem', marginTop: '1.5rem', breakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Distribuição por Contrato Privado
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {chartData.map((item) => (
              <div key={item.name} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 700, color: item.fill }}>{item.value}</span> {item.name}
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link 
            href="/relatorio-privados" 
            className="btn btn-outline no-print"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.5rem 0.8rem', background: 'rgba(0,180,216,0.1)', color: '#00b4d8', borderColor: 'rgba(0,180,216,0.3)' }}
          >
            <FileBarChart2 size={14} /> Relatório Completo
          </Link>
          <button 
            className="btn btn-outline no-print" 
            onClick={() => window.print()} 
            style={{ padding: '0.4rem', border: 'none', background: '#f8fafc', color: '#64748b', borderRadius: '8px' }}
            title="Imprimir Este Gráfico"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, width: '100%', height: '220px', minHeight: '220px', position: 'relative' }}>
        {!mounted ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Carregando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis 
                dataKey="name" 
                axisLine={{stroke: 'rgba(255,255,255,0.1)'}} 
                tickLine={false} 
                tick={{ fontSize: 13, fill: '#f1f5f9', fontWeight: 600 }} 
                dy={15} 
              />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
              <BarTooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: 'white' }}
                itemStyle={{ fontWeight: 700 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              />
              <Bar 
                dataKey="value" 
                name="Pacientes" 
                radius={[6, 6, 0, 0]} 
                barSize={65}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>

              {!hasData && (
                <text x="50%" y="45%" textAnchor="middle" fill="#64748b" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Aguardando registros de transferências...
                </text>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
