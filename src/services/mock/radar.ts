import { RadarBlip, Threat, ThreatCategory, Severity } from '../../types';
import { mockThreats } from './threats';

const categoryAngleMap: Record<ThreatCategory, { start: number; end: number }> = {
  'Zero-Day': { start: 0, end: 50 },
  'Ransomware': { start: 51, end: 100 },
  'Supply Chain': { start: 101, end: 150 },
  'Data Exfiltration': { start: 151, end: 200 },
  'Privilege Escalation': { start: 201, end: 250 },
  'Botnet': { start: 251, end: 300 },
  'Phishing': { start: 301, end: 359 }
};

const severityRadiusMap: Record<Severity, { min: number; max: number }> = {
  critical: { min: 0.18, max: 0.35 },
  high: { min: 0.40, max: 0.58 },
  medium: { min: 0.62, max: 0.78 },
  low: { min: 0.82, max: 0.95 }
};

export function deriveRadarBlips(threats: Threat[] = mockThreats): RadarBlip[] {
  // Use first 50 threats for radar so it is readable and not oversaturated
  return threats.slice(0, 50).map((t, idx) => {
    const angleRange = categoryAngleMap[t.category] || { start: 0, end: 350 };
    const radiusRange = severityRadiusMap[t.severity];
    
    // Deterministic jitter based on index
    const angleJitter = ((idx * 17) % 40) / 40;
    const radiusJitter = ((idx * 13) % 100) / 100;
    
    const angle = angleRange.start + (angleRange.end - angleRange.start) * angleJitter;
    const radius = radiusRange.min + (radiusRange.max - radiusRange.min) * radiusJitter;

    return {
      id: `blip-${t.id}`,
      threatId: t.id,
      title: t.title,
      cveId: t.cveId,
      severity: t.severity,
      category: t.category,
      confidence: t.confidence,
      radius,
      angle,
      isPulse: t.severity === 'critical',
      timestamp: t.timestamp
    };
  });
}

export const mockRadarBlips = deriveRadarBlips();
