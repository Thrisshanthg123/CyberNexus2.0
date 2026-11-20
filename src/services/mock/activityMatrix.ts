import { createRNG } from './rng';

export interface HeatmapCell {
  day: number; // 0 = Mon, 6 = Sun
  dayName: string;
  hour: number; // 0-23
  count: number;
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function generateActivityMatrix(): HeatmapCell[] {
  const rng = createRNG(987654);
  const matrix: HeatmapCell[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Security incident peak usually during business hours 8-18 and late night scan spikes 1-4
      let base = 2;
      if (hour >= 9 && hour <= 17) {
        base = 14;
      } else if (hour >= 1 && hour <= 4) {
        base = 8;
      }
      
      // Weekends slightly quieter
      if (day >= 5) {
        base = Math.max(1, Math.floor(base * 0.4));
      }

      const count = Math.floor(base + rng() * 12);
      matrix.push({
        day,
        dayName: dayNames[day],
        hour,
        count
      });
    }
  }

  return matrix;
}

export const mockActivityMatrix = generateActivityMatrix();
