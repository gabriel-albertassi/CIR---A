import DispararButton from "@/components/DispararButton";

export default function Page() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: '#f1f5f9' }}>Teste de Disparo (Padrão Server Action)</h1>
      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Este é um exemplo de implementação robusta de Server Actions, garantindo tipagem correta e tratamento de erros sem <code>undefined</code>.
        </p>
        <DispararButton />
      </div>
    </div>
  );
}
