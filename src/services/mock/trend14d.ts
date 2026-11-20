import { createRNG } from './rng';

export interface TrendDay {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function generate14DayTrend(): TrendDay[] {
  const rng = createRNG(771234);
  const trend: TrendDay[] = [];
  const now = new Date('2026-11-20T00:00:00Z');

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    
    // Gradual upward trend with some spikes
    const dayFactor = (14 - i) / 14;
    const critical = Math.floor(2 + rng() * 4 + dayFactor * 2);
    const high = Math.floor(4 + rng() * 6 + dayFactor * 3);
    const medium = Math.floor(6 + rng() * 7);
    const low = Math.floor(3 + rng() * 4);
    const total = critical + high + medium + low;

    trend.push({
      date: dateStr,
      total,
      critical,
      high,
      medium,
      low
    });
  }

  return trend;
}

export const mockTrend14d = generate14DayTrend();
