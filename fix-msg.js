const fs = require('fs');
const path = 'src/app/api/cirilaActions.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Line 144 (0-indexed: 143) contains the protocol 2 message
// Replace the entire line
const newLine = "        text: `Certo chefe, agora todas as Tomografias vão ser direcionadas para o **Hospital do Retiro**.\\n\\n*Para voltar ao padrão, digite: \\\"protocolo 1\\\" ou \\\"protocolo normal\\\".*`,";

lines[143] = newLine;
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Mensagem do Protocolo 2 atualizada com sucesso!');
