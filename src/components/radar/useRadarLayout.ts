import { useMemo } from 'react';
import { RadarBlip, Severity } from '../../types';

export interface LayoutBlip extends RadarBlip {
  x: number;
  y: number;
  markerRadius: number;
  color: string;
}

interface RadarLayoutOptions {
  width: number;
  height: number;
  colourBy?: 'severity' | 'source';
}

const SEVERITY_COLOR_MAP: Record<Severity, string> = {
  critical: 'var(--severity-critical)',
  high: 'var(--severity-high)',
  medium: 'var(--severity-medium)',
  low: 'var(--severity-low)'
};

/**
 * Shared function mapping CVSS score (0.0 - 10.0) to normalized radar radius (0.15 - 0.95).
 * Higher CVSS scores plot closer to the radar center (10 -> 0.15, 0 -> 0.85).
 * null or undefined returns 0.95 (unscored periphery ring).
 */
export function cvssToRadius(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) {
    return 0.95;
  }
  const clamped = Math.max(0, Math.min(10, score));
  return 0.85 - (clamped / 10) * 0.70;
}

export function useRadarLayout(
  blips: RadarBlip[] | null | undefined,
  options: RadarLayoutOptions
): {
  layoutBlips: LayoutBlip[];
  cx: number;
  cy: number;
  maxRadius: number;
  ringRadii: { label: string; r: number; score: string }[];
} {
  const { width, height } = options;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.max(20, Math.min(cx, cy) - 24);

  // Concentric range rings: Critical (10-9), High (8-7), Medium (6-4), Low (3-1), Unscored ring at periphery
  const ringRadii = useMemo(() => {
    return [
      { label: 'CVSS 9.0 - 10.0 (Critical)', r: maxRadius * cvssToRadius(9.0), score: 'Critical' },
      { label: 'CVSS 7.0 - 8.9 (High)', r: maxRadius * cvssToRadius(7.0), score: 'High' },
      { label: 'CVSS 4.0 - 6.9 (Medium)', r: maxRadius * cvssToRadius(4.0), score: 'Medium' },
      { label: 'CVSS 0.1 - 3.9 (Low)', r: maxRadius * cvssToRadius(0.0), score: 'Low' },
      { label: 'Unscored (Periphery)', r: maxRadius * cvssToRadius(null), score: 'Unscored' }
    ];
  }, [maxRadius]);

  const layoutBlips = useMemo(() => {
    if (!blips || blips.length === 0) return [];

    return blips.map(blip => {
      // Map angle to radians (0 deg is top, rotate clockwise)
      const rad = ((blip.angle - 90) * Math.PI) / 180;
      const r = blip.radius * maxRadius;

      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);

      // Condition: Marker size is fixed when confidence is null (e.g. 5px radius)
      let markerRadius = 5;
      if (blip.confidence !== null && blip.confidence !== undefined) {
        markerRadius = 4 + (blip.confidence / 100) * 4; // 4px to 8px
      }

      const color = SEVERITY_COLOR_MAP[blip.severity] || 'var(--accent-cyan)';

      return {
        ...blip,
        x,
        y,
        markerRadius,
        color
      };
    });
  }, [blips, cx, cy, maxRadius]);

  return {
    layoutBlips,
    cx,
    cy,
    maxRadius,
    ringRadii
  };
}
