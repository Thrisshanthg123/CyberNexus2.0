import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(path.resolve('src'));
const hexRegex = /#[0-9A-Fa-f]{3,8}\b/g;
const rgbaRegex = /\brgba?\s*\([^)]+\)/gi;
const hslaRegex = /\bhsla?\s*\([^)]+\)/gi;
let count = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if (rel === 'src/design/tokens.css') continue;

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
    const matches = [
      ...(line.match(hexRegex) || []),
      ...(line.match(rgbaRegex) || []),
      ...(line.match(hslaRegex) || [])
    ];
    if (matches.length > 0) {
      count += matches.length;
      console.log(`${rel}:${idx + 1}: ${matches.join(', ')} | ${line.trim()}`);
    }
  });
}

console.log(`\nTotal non-comment hardcoded hex/rgb/rgba/hsl/hsla matches outside tokens.css: ${count}`);
