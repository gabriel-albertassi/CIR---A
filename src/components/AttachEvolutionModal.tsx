'use client';

import React, { useState } from 'react';
import { X, Paperclip, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { attachMedicalEvolution } from '../app/patients/actions';

interface AttachEvolutionModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export default function AttachEvolutionModal({ patientId, patientName, onClose }: AttachEvolutionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const res = await attachMedicalEvolution(patientId, file);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(res.error || 'Erro desconhecido ao enviar arquivo.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', margin: 'auto', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
            <Paperclip size={20} color="#60a5fa" />
            Anexar Evolução
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Paciente</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>{patientName}</div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0' }}>Anexo enviado com sucesso!</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>O histórico do paciente foi atualizado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div 
              style={{ padding: '2rem', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: file ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {file ? (
                <div style={{ color: '#60a5fa', fontWeight: 700 }}>
                  <Upload size={32} style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '0.9rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Clique para trocar o arquivo</div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>
                  <Upload size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Selecionar Documento</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>PDF, Laudos ou Imagens</div>
                </div>
              )}
              <input 
                id="file-input" 
                type="file" 
                hidden 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ background: !file || uploading ? '#1e293b' : 'linear-gradient(90deg, #2563eb, #3b82f6)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: !file || uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
              {uploading ? 'Enviando documento...' : 'Anexar ao Prontuário'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
