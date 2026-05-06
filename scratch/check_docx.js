const docx = require('docx');
console.log('Exports from docx:', Object.keys(docx).filter(k => k.includes('Underline')));
