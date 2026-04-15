import PatientForm from '@/components/PatientForm'

export default function NewPatientPage() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cadastrar Paciente</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Insira os dados do paciente para entrada na fila de regulação.
        </p>
      </div>

      <div className="card">
        <PatientForm />
      </div>
    </div>
  )
}
