'use client'

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer
} from 'recharts';

type PatientDest = { name: string; value: number };
type StatusData = { name: string; qtd: number; fill: string };

type Props = {
  transferredData: PatientDest[];
  severityData: StatusData[];
};

const COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#fb923c'];

function CustomPieLegend({ data, total }: { data: PatientDest[]; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {data.map((entry, index) => {
        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
        const color = COLORS[index % COLORS.length];
        const barWidth = Math.max(pct * 0.8, 6);
        return (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Dot */}
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: color, flexShrink: 0,
              boxShadow: `0 0 8px ${color}99`
            }} />
            {/* Hospital name */}
            <div style={{
              flex: 1, fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {entry.name}
            </div>
            {/* Bar + percentage + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{
                width: `${barWidth}px`, height: '5px', borderRadius: '3px',
                background: color, opacity: 0.6
              }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f1f5f9', minWidth: '34px', textAlign: 'right' }}>
                {pct}%
              </span>
              <span style={{ fontSize: '0.73rem', color: '#475569', minWidth: '26px' }}>
                ({entry.value})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardCharts({ transferredData, severityData }: Props) {
  const totalTransferred = transferredData.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>

        {/* GRÁFICO 1: Destinos de Transferência */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '1.5rem', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ flexShrink: 0, marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Destino das Transferências
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.2rem 0 0 0' }}>
              {totalTransferred} pacientes regulados no total
            </p>
          </div>

          {transferredData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.9rem' }}>
              Aguardando primeiras transferências.
            </div>
          ) : (
            <>
              {/* PIE — 58% da altura */}
              <div style={{ flex: '0 0 58%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
                    <Pie
                      data={transferredData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={108}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {transferredData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          style={{ filter: `drop-shadow(0px 0px 10px ${COLORS[index % COLORS.length]}88)` }}
                        />
                      ))}
                    </Pie>
                    <PieTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,180,216,0.3)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                      itemStyle={{ color: '#f8fafc' }}
                      cursor={{ fill: 'transparent' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* LEGENDA customizada — restante da altura */}
              <div style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '0.75rem'
              }}>
                <CustomPieLegend data={transferredData} total={totalTransferred} />
              </div>
            </>
          )}
        </div>

        {/* GRÁFICO 2: Carga da Fila por Retaguarda Médica */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '480px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
            Carga da Fila por Retaguarda Médica
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <BarTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,180,216,0.3)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    color: 'white',
                    fontSize: '13px'
                  }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                />
                <Bar dataKey="qtd" radius={[10, 10, 10, 10]} barSize={52}>
                  {severityData.map((entry, index) => {
                    let fill = 'url(#colorBlue)';
                    if (entry.name === 'S. Vermelha') fill = 'url(#colorRed)';
                    if (entry.name === 'CTI') fill = 'url(#colorOrange)';
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.25))' }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  );
}
