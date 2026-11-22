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
  return {
    ratio: ((lighter + 0.05) / (darker + 0.05)).toFixed(2),
    l1: l1.toFixed(4),
    l2: l2.toFixed(4),
    formula: `(${lighter.toFixed(4)} + 0.05) / (${darker.toFixed(4)} + 0.05)`
  };
}

const darkBg = '#0B1220';
const whiteBg = '#FFFFFF';

const pairs = [
  // Landing Page Dark Surface (#0B1220)
  { label: 'Primary text (#F8FAFC) on dark surface (#0B1220)', fg: '#F8FAFC', bg: darkBg, min: 4.5, type: 'text' },
  { label: 'Secondary text (#94A3B8) on dark surface (#0B1220)', fg: '#94A3B8', bg: darkBg, min: 4.5, type: 'text' },
  { label: 'Original muted text (#64748B) on dark surface (#0B1220)', fg: '#64748B', bg: darkBg, min: 4.5, type: 'text' },
  { label: 'Adjusted muted text (#8091A9) on dark surface (#0B1220)', fg: '#8091A9', bg: darkBg, min: 4.5, type: 'text' },
  { label: 'Cyan accent text (#22D3EE) on dark surface (#0B1220)', fg: '#22D3EE', bg: darkBg, min: 4.5, type: 'text' },
  { label: 'Primary button label (#0B1220) on cyan button (#22D3EE)', fg: '#0B1220', bg: '#22D3EE', min: 4.5, type: 'text' },

  // Severity Marks on Dark Surface (#0B1220)
  { label: 'Critical severity mark (#DC2626) on dark surface (#0B1220)', fg: '#DC2626', bg: darkBg, min: 3.0, type: 'mark' },
  { label: 'High severity mark (#D97706) on dark surface (#0B1220)', fg: '#D97706', bg: darkBg, min: 3.0, type: 'mark' },
  { label: 'Medium severity mark fill (#CA8A04) on dark surface (#0B1220)', fg: '#CA8A04', bg: darkBg, min: 3.0, type: 'mark' },
  { label: 'Low severity mark (#16A34A) on dark surface (#0B1220)', fg: '#16A34A', bg: darkBg, min: 3.0, type: 'mark' },

  // Severity Marks on White Surface (#FFFFFF - Dashboard & Chart context)
  { label: 'Critical severity mark (#DC2626) on white (#FFFFFF)', fg: '#DC2626', bg: whiteBg, min: 3.0, type: 'mark' },
  { label: 'High severity mark (#D97706) on white (#FFFFFF)', fg: '#D97706', bg: whiteBg, min: 3.0, type: 'mark' },
  { label: 'Medium severity mark fill (#CA8A04) on white (#FFFFFF)', fg: '#CA8A04', bg: whiteBg, min: 3.0, type: 'mark' },
  { label: 'Medium mark 1px outline (#854D0E) on white (#FFFFFF)', fg: '#854D0E', bg: whiteBg, min: 3.0, type: 'mark' },
  { label: 'Low severity mark (#16A34A) on white (#FFFFFF)', fg: '#16A34A', bg: whiteBg, min: 3.0, type: 'mark' },

  // Non-text boundary marks
  { label: 'Range ring divider border (#1E293B) on dark surface (#0B1220)', fg: '#1E293B', bg: darkBg, min: 3.0, type: 'boundary' },
];

console.log('=== WCAG CONTRAST FORMULA EVALUATION ===\n');
pairs.forEach(p => {
  const res = contrastRatio(p.fg, p.bg);
  const passed = parseFloat(res.ratio) >= p.min;
  console.log(`${p.label}:`);
  console.log(`  Formula: ${res.formula} = ${res.ratio}:1 [${passed ? 'PASS' : 'FAIL'}] (required >= ${p.min}:1)`);
});
