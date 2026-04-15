export function calculatePatientScore(patient: {
  created_at: Date;
  severity: string;
  attempts_count: number;
}): number {
  if (patient.severity === "SALA_VERMELHA") {
    // Sala vermelha recebe -1 (Vaga Zero)
    return -1;
  }

  const hoursWaiting =
    (new Date().getTime() - new Date(patient.created_at).getTime()) /
    (1000 * 60 * 60);

  let severityScore = 0;
  if (patient.severity === "CTI") severityScore = 20;
  if (patient.severity === "CLINICA_MEDICA") severityScore = 10;

  // Formula: Horas em espera + (Gravidade) + (N de Recusas * 5)
  // Pacientes com mais recusas vão ganhando prioridade ao longo do tempo.
  return Math.floor(hoursWaiting + severityScore + patient.attempts_count * 5);
}
