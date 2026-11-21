import { RadarBlip, Threat, Severity } from '../../types';
import { mockThreats } from './threats';

const categoryAngleMap: Record<string, { start: number; end: number }> = {
  'Zero-Day': { start: 0, end: 45 },
  'Ransomware': { start: 46, end: 90 },
  'Supply Chain': { start: 91, end: 135 },
  'Data Exfiltration': { start: 136, end: 180 },
  'Privilege Escalation': { start: 181, end: 225 },
  'Botnet': { start: 226, end: 270 },
  'Phishing': { start: 271, end: 315 },
  'Vulnerability-Disclosure': { start: 316, end: 335 },
  'Exploit-in-Wild': { start: 336, end: 359 }
};

const severityRadiusMap: Record<Severity, { min: number; max: number }> = {
  critical: { min: 0.15, max: 0.35 },
  high: { min: 0.38, max: 0.58 },
  medium: { min: 0.62, max: 0.78 },
  low: { min: 0.82, max: 0.95 }
};

export function deriveRadarBlips(threats: Threat[] = mockThreats): RadarBlip[] {
  // Use first 50 threats for radar so it is readable and not oversaturated
  return threats.slice(0, 50).map((t, idx) => {
    const angleRange = categoryAngleMap[t.category] || { start: 0, end: 350 };
    const radiusRange = severityRadiusMap[t.severity] || severityRadiusMap.medium;
    
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
      riskScore: t.riskScore ?? 75,
      radius,
      angle,
      isPulse: t.severity === 'critical',
      timestamp: t.timestamp
    };
  });
}

export const mockRadarBlips = deriveRadarBlips();
