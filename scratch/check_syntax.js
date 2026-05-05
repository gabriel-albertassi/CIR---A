
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Gabriel\\.gemini\\antigravity\\scratch\\health-regulation-system\\src\\components\\LayoutClientWrapper.tsx', 'utf8');

let braces = 0;
let parens = 0;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineNum++;
    if (content[i] === '{') braces++;
    if (content[i] === '}') braces--;
    if (content[i] === '(') parens++;
    if (content[i] === ')') parens--;
    
    if (braces < 0) console.log(`Extra } at line ${lineNum}`);
    if (parens < 0) console.log(`Extra ) at line ${lineNum}`);
}

console.log(`Braces: ${braces}`);
console.log(`Parens: ${parens}`);
