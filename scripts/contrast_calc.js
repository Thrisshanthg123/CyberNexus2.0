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
  // 1. Typography on Pure White (#FFFFFF) and Table Header/Hover (#F3F6F9)
  { name: 'Primary text (#0F172A) on White (#FFFFFF)', fg: '#0F172A', bg: '#FFFFFF', min: 4.5 },
  { name: 'Primary text (#0F172A) on Raised/Hover (#F3F6F9)', fg: '#0F172A', bg: '#F3F6F9', min: 4.5 },
  { name: 'Secondary text (#334155) on White (#FFFFFF)', fg: '#334155', bg: '#FFFFFF', min: 4.5 },
  { name: 'Secondary text (#334155) on Raised/Hover (#F3F6F9)', fg: '#334155', bg: '#F3F6F9', min: 4.5 },
  { name: 'Muted text (#475569) on White (#FFFFFF)', fg: '#475569', bg: '#FFFFFF', min: 4.5 },
  { name: 'Muted text (#475569) on Raised/Hover (#F3F6F9)', fg: '#475569', bg: '#F3F6F9', min: 4.5 },
  { name: 'Dim text (#526075) on White (#FFFFFF)', fg: '#526075', bg: '#FFFFFF', min: 4.5 },
  { name: 'Dim text (#526075) on Raised/Hover (#F3F6F9)', fg: '#526075', bg: '#F3F6F9', min: 4.5 },

  // 2. Blue Accent (#2563EB, Hover #1D4ED8, Hero #1E3A8A, Tint #EFF6FF)
  { name: 'Blue accent (#2563EB) on White (#FFFFFF)', fg: '#2563EB', bg: '#FFFFFF', min: 4.5 },
  { name: 'Blue accent (#2563EB) on Raised (#F3F6F9)', fg: '#2563EB', bg: '#F3F6F9', min: 4.5 },
  { name: 'White button text (#FFFFFF) on Blue (#2563EB)', fg: '#FFFFFF', bg: '#2563EB', min: 4.5 },
  { name: 'White button text (#FFFFFF) on Blue Hover (#1D4ED8)', fg: '#FFFFFF', bg: '#1D4ED8', min: 4.5 },
  { name: 'White text (#FFFFFF) on Overview Hero (#1E3A8A)', fg: '#FFFFFF', bg: '#1E3A8A', min: 4.5 },
  { name: 'Blue text (#1D4ED8) on Blue Tint (#EFF6FF)', fg: '#1D4ED8', bg: '#EFF6FF', min: 4.5 },
  { name: 'Blue text (#1D4ED8) on Raised (#F3F6F9)', fg: '#1D4ED8', bg: '#F3F6F9', min: 4.5 },

  // 3. Severity Badge Tokens (Text >= 4.5:1 on tint bg and white; Border >= 3.0:1 on white)
  { name: 'Critical text (#B91C1C) on Critical Bg (#FEF2F2)', fg: '#B91C1C', bg: '#FEF2F2', min: 4.5 },
  { name: 'Critical text (#B91C1C) on White (#FFFFFF)', fg: '#B91C1C', bg: '#FFFFFF', min: 4.5 },
  { name: 'Critical border (#B91C1C) on White (#FFFFFF)', fg: '#B91C1C', bg: '#FFFFFF', min: 3.0 },
  { name: 'High text (#C2410C) on High Bg (#FFF7ED)', fg: '#C2410C', bg: '#FFF7ED', min: 4.5 },
  { name: 'High text (#C2410C) on White (#FFFFFF)', fg: '#C2410C', bg: '#FFFFFF', min: 4.5 },
  { name: 'High border (#C2410C) on White (#FFFFFF)', fg: '#C2410C', bg: '#FFFFFF', min: 3.0 },
  { name: 'Medium text (#A16207) on Medium Bg (#FEFCE8)', fg: '#A16207', bg: '#FEFCE8', min: 4.5 },
  { name: 'Medium text (#A16207) on White (#FFFFFF)', fg: '#A16207', bg: '#FFFFFF', min: 4.5 },
  { name: 'Medium border (#A16207) on White (#FFFFFF)', fg: '#A16207', bg: '#FFFFFF', min: 3.0 },
  { name: 'Low text (#15803D) on Low Bg (#F0FDF4)', fg: '#15803D', bg: '#F0FDF4', min: 4.5 },
  { name: 'Low text (#15803D) on White (#FFFFFF)', fg: '#15803D', bg: '#FFFFFF', min: 4.5 },
  { name: 'Low border (#15803D) on White (#FFFFFF)', fg: '#15803D', bg: '#FFFFFF', min: 3.0 },

  // 4. Heatmap Marks & Chart Tokens (>= 3.0:1 on White; Lightest steps exempt: cell outline + tooltip carry info)
  { name: 'Heat-3 mark (#2563EB) on White (#FFFFFF)', fg: '#2563EB', bg: '#FFFFFF', min: 3.0 },
  { name: 'Heat-4 mark (#1E3A8A) on White (#FFFFFF)', fg: '#1E3A8A', bg: '#FFFFFF', min: 3.0 },

  // 5. Chart Marks, Status Dots & Control Borders (>= 3.0:1)
  { name: 'Critical mark (#DC2626) on White (#FFFFFF)', fg: '#DC2626', bg: '#FFFFFF', min: 3.0 },
  { name: 'High mark (#C2410C) on White (#FFFFFF)', fg: '#C2410C', bg: '#FFFFFF', min: 3.0 },
  { name: 'Medium mark (#A16207) on White (#FFFFFF)', fg: '#A16207', bg: '#FFFFFF', min: 3.0 },
  { name: 'Low / Online mark (#15803D) on White (#FFFFFF)', fg: '#15803D', bg: '#FFFFFF', min: 3.0 },
  { name: 'Live dot (#22C55E) on Overview Hero (#1E3A8A)', fg: '#22C55E', bg: '#1E3A8A', min: 3.0 },
  { name: 'Blue mark (#2563EB) on White (#FFFFFF)', fg: '#2563EB', bg: '#FFFFFF', min: 3.0 },
  { name: 'Purple mark (#6D28D9) on White (#FFFFFF)', fg: '#6D28D9', bg: '#FFFFFF', min: 3.0 },
  { name: 'Control border (#758499) on White (#FFFFFF)', fg: '#758499', bg: '#FFFFFF', min: 3.0 },
  { name: 'Control border (#758499) on Raised (#F3F6F9)', fg: '#758499', bg: '#F3F6F9', min: 3.0 },
  { name: 'Strong border (#64748B) on White (#FFFFFF)', fg: '#64748B', bg: '#FFFFFF', min: 3.0 },
  { name: 'Strong border (#64748B) on Raised (#F3F6F9)', fg: '#64748B', bg: '#F3F6F9', min: 3.0 },

  // 6. Deliberate Dark Radar Panel (#0B1220)
  { name: 'Radar sector label (#CBD5E1) on Radar (#0B1220)', fg: '#CBD5E1', bg: '#0B1220', min: 4.5 },
  { name: 'Radar ring label (#94A3B8) on Radar (#0B1220)', fg: '#94A3B8', bg: '#0B1220', min: 4.5 },
  { name: 'Radar sweep (#3B82F6) on Radar (#0B1220)', fg: '#3B82F6', bg: '#0B1220', min: 3.0 }
];

console.log('=== WCAG CONTRAST AUDIT (WHITE & BLUE THEME) ===');
let allPass = true;
pairs.forEach(p => {
  const r = contrastRatio(p.fg, p.bg);
  const pass = parseFloat(r) >= p.min;
  if (!pass) allPass = false;
  console.log(`${p.name.padEnd(55)}: ${r.padStart(5)}:1 [${pass ? 'PASS' : 'FAIL'}] (required >= ${p.min}:1)`);
});
console.log(`\nALL CONTRAST CHECKS PASSED: ${allPass}`);
if (!allPass) process.exit(1);
