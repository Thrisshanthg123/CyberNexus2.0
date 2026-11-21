function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relLuminance(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relLuminance(hex1);
  const l2 = relLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

const pairs = [
  { name: 'Critical text (#B91C1C) on white (#FFFFFF)', fg: '#B91C1C', bg: '#FFFFFF', min: 4.5 },
  { name: 'Critical text (#B91C1C) on critical tint (#FDECEC)', fg: '#B91C1C', bg: '#FDECEC', min: 4.5 },
  { name: 'High text (#B45309) on white (#FFFFFF)', fg: '#B45309', bg: '#FFFFFF', min: 4.5 },
  { name: 'High text (#B45309) on high tint (#FEF3E2)', fg: '#B45309', bg: '#FEF3E2', min: 4.5 },
  { name: 'Medium text (#A16207) on white (#FFFFFF)', fg: '#A16207', bg: '#FFFFFF', min: 4.5 },
  { name: 'Medium text (#A16207) on medium tint (#FEF7D6)', fg: '#A16207', bg: '#FEF7D6', min: 4.5 },
  { name: 'Low text (#15803D) on white (#FFFFFF)', fg: '#15803D', bg: '#FFFFFF', min: 4.5 },
  { name: 'Low text (#15803D) on low tint (#E7F6EF)', fg: '#15803D', bg: '#E7F6EF', min: 4.5 },
  { name: 'Primary text (#0F172A) on white (#FFFFFF)', fg: '#0F172A', bg: '#FFFFFF', min: 4.5 },
  { name: 'Primary text (#0F172A) on app bg (#F7F9FB)', fg: '#0F172A', bg: '#F7F9FB', min: 4.5 },
  { name: 'Muted text (#5B6779) on white (#FFFFFF)', fg: '#5B6779', bg: '#FFFFFF', min: 4.5 },
  { name: 'Emerald text (#047857) on white (#FFFFFF)', fg: '#047857', bg: '#FFFFFF', min: 4.5 },
  { name: 'Critical chart mark (#DC2626) on white (#FFFFFF)', fg: '#DC2626', bg: '#FFFFFF', min: 3.0 },
  { name: 'High chart mark (#D97706) on white (#FFFFFF)', fg: '#D97706', bg: '#FFFFFF', min: 3.0 },
  { name: 'Medium chart mark (#B45309) on white (#FFFFFF)', fg: '#B45309', bg: '#FFFFFF', min: 3.0 },
  { name: 'Low chart mark (#16A34A) on white (#FFFFFF)', fg: '#16A34A', bg: '#FFFFFF', min: 3.0 },
];

pairs.forEach(p => {
  const r = contrastRatio(p.fg, p.bg);
  const pass = parseFloat(r) >= p.min ? 'PASS' : 'FAIL';
  console.log(`${p.name}: ${r}:1 [${pass}] (required >= ${p.min}:1)`);
});
