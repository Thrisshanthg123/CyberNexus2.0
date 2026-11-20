import React, { useState, useEffect, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton, EmptyState, ErrorState } from '../ui';
import { RadarBlip, SeverityStat, FlowLink, Severity, ThreatCategory } from '../../types';
import { HeatmapCell } from '../../services/mock/activityMatrix';
import { TrendDay } from '../../services/mock/trend14d';
import './CyberCharts.css';

// Helper to get CSS variable dynamically from the DOM
function useCssVar(varName: string, fallback: string): string {
  const [val, setVal] = useState(fallback);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (computed) {
        setVal(computed);
      }
    }
  }, [varName]);

  return val;
}

// ----------------------------------------------------------------------------
// 1. THREAT RADAR
// ----------------------------------------------------------------------------
export interface ThreatRadarProps {
  data?: RadarBlip[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBlipClick?: (threatId: string) => void;
  colourBy?: 'severity' | 'category';
  width?: number;
  height?: number;
}

export const ThreatRadar: React.FC<ThreatRadarProps> = ({
  data,
  loading,
  error,
  onRetry,
  onBlipClick,
  colourBy = 'severity',
  width = 400,
  height = 400
}) => {
  const [hoveredBlip, setHoveredBlip] = useState<RadarBlip | null>(null);
  const chartId = useId();

  const colorCritical = useCssVar('--severity-critical', '#F43F5E');
  const colorHigh = useCssVar('--severity-high', '#F59E0B');
  const colorMedium = useCssVar('--severity-medium', '#3B82F6');
  const colorLow = useCssVar('--severity-low', '#34D399');
  const colorCyan = useCssVar('--accent-cyan', '#22D3EE');
  const colorBorder = useCssVar('--color-border', '#1B2740');
  const colorMuted = useCssVar('--color-text-muted', '#64748B');

  if (loading) {
    return <Skeleton width={width} height={height} borderRadius="50%" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="Radar Offline" description="No active radar blips detected in the current sector." />;
  }

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(cx, cy) - 20;

  const getBlipColor = (blip: RadarBlip) => {
    if (colourBy === 'category') {
      const catColors: Record<ThreatCategory, string> = {
        'Zero-Day': colorCritical,
        'Ransomware': colorHigh,
        'Supply Chain': colorCyan,
        'Data Exfiltration': colorMedium,
        'Privilege Escalation': colorHigh,
        'Botnet': colorLow,
        'Phishing': colorMuted
      };
      return catColors[blip.category] || colorCyan;
    }

    const sevColors: Record<Severity, string> = {
      critical: colorCritical,
      high: colorHigh,
      medium: colorMedium,
      low: colorLow
    };
    return sevColors[blip.severity] || colorCyan;
  };

  const criticalCount = data.filter(b => b.severity === 'critical').length;
  const totalCount = data.length;

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label={`Threat Radar showing ${totalCount} active correlated threats, including ${criticalCount} critical blips in the central perimeter ring.`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ maxWidth: `${width}px`, aspectRatio: '1/1', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`radar-grad-${chartId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colorCyan} stopOpacity="0.08" />
            <stop offset="60%" stopColor={colorCyan} stopOpacity="0.02" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`radar-sweep-grad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorCyan} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colorCyan} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Radar Background Glow */}
        <circle cx={cx} cy={cy} r={maxRadius} fill={`url(#radar-grad-${chartId})`} />

        {/* Concentric Severity Rings */}
        {[0.25, 0.5, 0.75, 1.0].map((fraction, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={maxRadius * fraction}
            fill="none"
            stroke={colorBorder}
            strokeWidth={1}
            strokeDasharray={fraction === 1.0 ? 'none' : '3 3'}
          />
        ))}

        {/* Ring Labels */}
        <text x={cx + 6} y={cy - maxRadius * 0.25 + 12} fill={colorCritical} fontSize="9" fontFamily="var(--font-mono)">CRIT</text>
        <text x={cx + 6} y={cy - maxRadius * 0.50 + 12} fill={colorHigh} fontSize="9" fontFamily="var(--font-mono)">HIGH</text>
        <text x={cx + 6} y={cy - maxRadius * 0.75 + 12} fill={colorMedium} fontSize="9" fontFamily="var(--font-mono)">MED</text>
        <text x={cx + 6} y={cy - maxRadius * 1.0 + 12} fill={colorLow} fontSize="9" fontFamily="var(--font-mono)">LOW</text>

        {/* Crosshair Axes */}
        <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} stroke={colorBorder} strokeWidth={1} />
        <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} stroke={colorBorder} strokeWidth={1} />

        {/* 45 degree diagonals */}
        <line
          x1={cx - maxRadius * 0.707}
          y1={cy - maxRadius * 0.707}
          x2={cx + maxRadius * 0.707}
          y2={cy + maxRadius * 0.707}
          stroke={colorBorder}
          strokeWidth={0.5}
          strokeDasharray="2 4"
        />
        <line
          x1={cx - maxRadius * 0.707}
          y1={cy + maxRadius * 0.707}
          x2={cx + maxRadius * 0.707}
          y2={cy - maxRadius * 0.707}
          stroke={colorBorder}
          strokeWidth={0.5}
          strokeDasharray="2 4"
        />

        {/* Rotating Radar Sweep */}
        <g className="radar-sweep-arm" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - maxRadius} A ${maxRadius} ${maxRadius} 0 0 1 ${cx + maxRadius * 0.7} ${cy - maxRadius * 0.7} Z`}
            fill={`url(#radar-sweep-grad-${chartId})`}
          />
          <line x1={cx} y1={cy} x2={cx} y2={cy - maxRadius} stroke={colorCyan} strokeWidth={1.5} />
        </g>

        {/* Threat Blips */}
        {data.map(blip => {
          const rad = (blip.angle * Math.PI) / 180;
          const r = blip.radius * maxRadius;
          const bx = cx + r * Math.cos(rad);
          const by = cy + r * Math.sin(rad);
          const blipColor = getBlipColor(blip);

          return (
            <g
              key={blip.id}
              className="radar-blip-node"
              tabIndex={0}
              role="button"
              aria-label={`Threat ${blip.threatId}: ${blip.title}, Severity ${blip.severity}, Category ${blip.category}`}
              onClick={() => onBlipClick && onBlipClick(blip.threatId)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBlipClick && onBlipClick(blip.threatId);
                }
              }}
              onMouseEnter={() => setHoveredBlip(blip)}
              onMouseLeave={() => setHoveredBlip(null)}
              onFocus={() => setHoveredBlip(blip)}
              onBlur={() => setHoveredBlip(null)}
            >
              {blip.isPulse && (
                <circle
                  cx={bx}
                  cy={by}
                  r={5}
                  className="blip-pulse"
                  fill="none"
                  stroke={blipColor}
                  strokeWidth={2}
                />
              )}
              <circle
                cx={bx}
                cy={by}
                r={blip.severity === 'critical' ? 5 : 4}
                fill={blipColor}
                stroke="#060B14"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {/* Hover Info Tooltip */}
      {hoveredBlip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-2)',
            background: 'var(--color-raised)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-chip)',
            fontSize: 'var(--text-xs)',
            pointerEvents: 'none',
            zIndex: 10,
            maxWidth: '300px',
            boxShadow: 'var(--shadow-overlay)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {hoveredBlip.threatId}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-small)' }}>
              {hoveredBlip.cveId}
            </span>
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hoveredBlip.title}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
            <span style={{ color: getBlipColor(hoveredBlip), textTransform: 'uppercase', fontWeight: 600 }}>
              {hoveredBlip.severity}
            </span>
            <span style={{ color: 'var(--color-text-small)' }}>•</span>
            <span style={{ color: 'var(--color-text-small)' }}>{hoveredBlip.category}</span>
            <span style={{ color: 'var(--color-text-small)' }}>•</span>
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {hoveredBlip.confidence}% conf
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 2. SEVERITY RINGS
// ----------------------------------------------------------------------------
export interface SeverityRingsProps {
  data?: SeverityStat[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  size?: number;
}

export const SeverityRings: React.FC<SeverityRingsProps> = ({
  data,
  loading,
  error,
  onRetry,
  size = 200
}) => {
  const [activeItem, setActiveItem] = useState<SeverityStat | null>(null);

  const colorCritical = useCssVar('--severity-critical', '#F43F5E');
  const colorHigh = useCssVar('--severity-high', '#F59E0B');
  const colorMedium = useCssVar('--severity-medium', '#3B82F6');
  const colorLow = useCssVar('--severity-low', '#34D399');
  const colorBorder = useCssVar('--color-border', '#1B2740');

  if (loading) return <Skeleton width={size} height={size} borderRadius="50%" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState title="No Severity Distribution" />;

  const center = size / 2;
  const strokeWidth = 8;
  const gap = 6;

  const colorMap: Record<Severity, string> = {
    critical: colorCritical,
    high: colorHigh,
    medium: colorMedium,
    low: colorLow
  };

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label={`Concentric Severity Rings: ${data.map(d => `${d.severity}: ${d.count} (${d.percentage}%)`).join(', ')}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, idx) => {
          const r = center - 16 - idx * (strokeWidth + gap);
          const circumference = 2 * Math.PI * r;
          const strokeDashoffset = circumference - (circumference * item.percentage) / 100;
          const strokeColor = colorMap[item.severity];

          return (
            <g
              key={item.severity}
              tabIndex={0}
              role="button"
              aria-label={`${item.severity}: ${item.count} threats (${item.percentage}%)`}
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
              onFocus={() => setActiveItem(item)}
              onBlur={() => setActiveItem(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={colorBorder}
                strokeWidth={strokeWidth}
              />
              {/* Progress Arc */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </g>
          );
        })}
        {/* Center Text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize="18"
          fontWeight="700"
          fontFamily="var(--font-mono)"
          className="tabular-nums"
        >
          {activeItem ? activeItem.count : total}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fill="var(--color-text-small)"
          fontSize="10"
          fontFamily="var(--font-sans)"
          style={{ textTransform: 'uppercase' }}
        >
          {activeItem ? activeItem.severity : 'TOTAL'}
        </text>
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 3. ACTIVITY HEATMAP (7x24 Matrix)
// ----------------------------------------------------------------------------
export interface ActivityHeatmapProps {
  data?: HeatmapCell[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data,
  loading,
  error,
  onRetry
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const colorBase = useCssVar('--color-raised', '#101B2E');
  const colorCyan = useCssVar('--accent-cyan', '#22D3EE');
  const colorBorder = useCssVar('--color-border', '#1B2740');

  if (loading) return <Skeleton height={180} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState title="No Activity Data" />;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getCellColor = (count: number) => {
    if (count === 0) return colorBase;
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'rgba(34, 211, 238, 0.2)';
    if (ratio < 0.5) return 'rgba(34, 211, 238, 0.45)';
    if (ratio < 0.75) return 'rgba(34, 211, 238, 0.75)';
    return colorCyan;
  };

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label="Activity Heatmap showing 7-day by 24-hour incident intensity"
      style={{ overflowX: 'auto', width: '100%' }}
    >
      <div style={{ minWidth: '580px', width: '100%' }}>
        {/* Hour Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: '2px', marginBottom: '4px' }}>
          <span />
          {Array.from({ length: 24 }).map((_, h) => (
            <span
              key={h}
              style={{
                fontSize: '9px',
                textAlign: 'center',
                color: 'var(--color-text-small)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
            </span>
          ))}
        </div>

        {/* 7 Days Grid */}
        {days.map((dayName, dayIndex) => {
          const rowCells = data.filter(d => d.day === dayIndex);
          return (
            <div
              key={dayName}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px repeat(24, 1fr)',
                gap: '2px',
                marginBottom: '3px',
                alignItems: 'center'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-small)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500
                }}
              >
                {dayName}
              </span>
              {rowCells.map(cell => (
                <div
                  key={`${cell.day}-${cell.hour}`}
                  className="heatmap-cell"
                  tabIndex={0}
                  role="button"
                  aria-label={`${cell.dayName} at ${cell.hour}:00 - ${cell.count} incidents`}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onFocus={() => setHoveredCell(cell)}
                  onBlur={() => setHoveredCell(null)}
                  style={{
                    height: '16px',
                    borderRadius: '2px',
                    background: getCellColor(cell.count),
                    border: `1px solid ${colorBorder}`
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {hoveredCell && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text)',
            background: 'var(--color-raised)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-chip)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {hoveredCell.dayName} at {String(hoveredCell.hour).padStart(2, '0')}:00 —{' '}
          <strong style={{ color: 'var(--accent-cyan)' }}>{hoveredCell.count} incidents</strong>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 4. SOURCE FLOW (Sankey-style flow links)
// ----------------------------------------------------------------------------
export interface SourceFlowProps {
  data?: FlowLink[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: number;
}

export const SourceFlow: React.FC<SourceFlowProps> = ({
  data,
  loading,
  error,
  onRetry,
  height = 240
}) => {
  const [hoveredLink, setHoveredLink] = useState<FlowLink | null>(null);

  const colorBorder = useCssVar('--color-border', '#1B2740');

  if (loading) return <Skeleton height={height} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState title="No Source Flow Data" />;

  // Unique sources and targets
  const sources = Array.from(new Set(data.map(d => d.source)));
  const targets = Array.from(new Set(data.map(d => d.target)));

  const width = 600;
  const leftX = 50;
  const rightX = 550;
  const sourceStep = height / (sources.length + 1);
  const targetStep = height / (targets.length + 1);

  const sourcePositions = Object.fromEntries(sources.map((s, idx) => [s, (idx + 1) * sourceStep]));
  const targetPositions = Object.fromEntries(targets.map((t, idx) => [t, (idx + 1) * targetStep]));

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label="Source Flow chart showing telemetry correlation flow from ingestion sources into attack categories and severities"
      style={{ overflowX: 'auto', width: '100%' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ minWidth: '500px' }}>
        {/* Links */}
        {data.map((link, i) => {
          const sy = sourcePositions[link.source];
          const ty = targetPositions[link.target];
          const strokeWidth = Math.max(2, Math.min(10, link.value / 3));

          return (
            <path
              key={i}
              d={`M ${leftX + 70} ${sy} C ${(leftX + rightX) / 2} ${sy}, ${(leftX + rightX) / 2} ${ty}, ${rightX - 70} ${ty}`}
              fill="none"
              stroke={link.color || 'var(--accent-cyan)'}
              strokeWidth={strokeWidth}
              strokeOpacity={hoveredLink === link ? 0.9 : 0.4}
              style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
              tabIndex={0}
              role="button"
              aria-label={`Flow from ${link.source} to ${link.target}: ${link.value} events`}
              onMouseEnter={() => setHoveredLink(link)}
              onMouseLeave={() => setHoveredLink(null)}
              onFocus={() => setHoveredLink(link)}
              onBlur={() => setHoveredLink(null)}
            />
          );
        })}

        {/* Source Nodes */}
        {sources.map(s => {
          const y = sourcePositions[s];
          const isPlanned = s.includes('Planned');
          return (
            <g key={s} transform={`translate(${leftX}, ${y})`}>
              <rect
                x={0}
                y={-12}
                width={80}
                height={24}
                rx={4}
                fill="var(--color-raised)"
                stroke={isPlanned ? 'var(--color-text-muted)' : colorBorder}
                strokeDasharray={isPlanned ? '2 2' : 'none'}
              />
              <text
                x={40}
                y={4}
                textAnchor="middle"
                fill={isPlanned ? 'var(--color-text-small)' : 'var(--color-text)'}
                fontSize="11"
                fontWeight="500"
              >
                {s.replace(' (Planned)', '')}
              </text>
            </g>
          );
        })}

        {/* Target Nodes */}
        {targets.map(t => {
          const y = targetPositions[t];
          return (
            <g key={t} transform={`translate(${rightX - 80}, ${y})`}>
              <rect
                x={0}
                y={-12}
                width={90}
                height={24}
                rx={4}
                fill="var(--color-raised)"
                stroke={colorBorder}
              />
              <text
                x={45}
                y={4}
                textAnchor="middle"
                fill="var(--color-text)"
                fontSize="11"
                fontWeight="500"
              >
                {t}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredLink && (
        <div
          style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text)',
            background: 'var(--color-raised)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-chip)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {hoveredLink.source} → {hoveredLink.target}:{' '}
          <strong style={{ color: 'var(--accent-cyan)' }}>{hoveredLink.value} correlated events</strong>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// 5. GLOW TREND (14-day Trend)
// ----------------------------------------------------------------------------
export interface GlowTrendProps {
  data?: TrendDay[] | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: number;
}

export const GlowTrend: React.FC<GlowTrendProps> = ({
  data,
  loading,
  error,
  onRetry,
  height = 180
}) => {
  const colorCyan = useCssVar('--accent-cyan', '#22D3EE');
  const colorCritical = useCssVar('--severity-critical', '#F43F5E');
  const colorTextSmall = useCssVar('--color-text-small', '#8A9BB4');
  const colorBorder = useCssVar('--color-border', '#1B2740');

  if (loading) return <Skeleton height={height} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState title="No Trend History" />;

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label="14-day Threat Trend Chart depicting incident trajectory over the last 14 days"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendCyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorCyan} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colorCyan} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="trendCritGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorCritical} stopOpacity={0.4} />
              <stop offset="95%" stopColor={colorCritical} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke={colorTextSmall}
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
            tickFormatter={val => val.slice(5)}
          />
          <YAxis
            stroke={colorTextSmall}
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
          />
          <RechartsTooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const day = payload[0].payload as TrendDay;
                return (
                  <div
                    style={{
                      background: 'var(--color-raised)',
                      border: `1px solid ${colorBorder}`,
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-chip)',
                      fontSize: 'var(--text-xs)',
                      boxShadow: 'var(--shadow-overlay)'
                    }}
                  >
                    <div style={{ color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      {label}
                    </div>
                    <div style={{ color: colorCyan, fontWeight: 600 }}>
                      Total Threats: {day.total}
                    </div>
                    <div style={{ color: colorCritical }}>
                      Critical: {day.critical}
                    </div>
                    <div style={{ color: 'var(--severity-high)' }}>
                      High: {day.high}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={colorCyan}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#trendCyanGrad)"
          />
          <Area
            type="monotone"
            dataKey="critical"
            stroke={colorCritical}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#trendCritGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
