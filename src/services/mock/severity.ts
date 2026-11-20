import { SeverityStat, Severity } from '../../types';
import { mockThreats } from './threats';

export function getSeverityStats(): SeverityStat[] {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  mockThreats.forEach(t => {
    counts[t.severity]++;
  });

  const total = mockThreats.length;

  const colorMap: Record<Severity, string> = {
    critical: 'var(--severity-critical)',
    high: 'var(--severity-high)',
    medium: 'var(--severity-medium)',
    low: 'var(--severity-low)'
  };

  return (['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => ({
    severity: sev,
    count: counts[sev],
    percentage: Math.round((counts[sev] / total) * 100),
    color: colorMap[sev]
  }));
}

export const mockSeverityStats = getSeverityStats();
