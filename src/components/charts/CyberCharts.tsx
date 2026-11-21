import React, { useState, useEffect, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton, EmptyState, ErrorState } from '../ui';
import { RadarBlip, SeverityStat, FlowLink, Severity } from '../../types';
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
  width = 440,
  height = 440
}) => {
  const [hoveredBlip, setHoveredBlip] = useState<RadarBlip | null>(null);
  const chartId = useId();

  const colorCritical = useCssVar('--severity-critical', '#DC2626');
  const colorHigh = useCssVar('--severity-high', '#D97706');
  const colorMedium = useCssVar('--severity-medium', '#CA8A04');
  const colorLow = useCssVar('--severity-low', '#16A34A');
  const colorCyan = useCssVar('--accent-cyan', '#22D3EE');

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
  const maxRadius = Math.min(cx, cy) - 16;

  const getBlipColor = (blip: RadarBlip) => {
    if (colourBy === 'category') {
      const catColors: Record<string, string> = {
        'Zero-Day': colorCritical,
        'Ransomware': colorHigh,
        'Supply Chain': colorCyan,
        'Data Exfiltration': colorMedium,
        'Privilege Escalation': colorHigh,
        'Botnet': colorLow,
        'Phishing': '#8A9BB4',
        'Vulnerability-Disclosure': colorCyan,
        'Exploit-in-Wild': colorCritical
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

  const getBlipRadius = (sev: Severity) => {
    switch (sev) {
      case 'critical': return 4.5;
      case 'high': return 3.5;
      case 'medium': return 2.5;
      case 'low': return 2;
    }
  };

  const criticalCount = data.filter(b => b.severity === 'critical').length;
  const totalCount = data.length;

  // 60-degree sweep sector: sin(60°) = 0.866, cos(60°) = 0.5
  const sweepEndX = cx + maxRadius * 0.866;
  const sweepEndY = cy - maxRadius * 0.5;

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label={`Threat Radar showing ${totalCount} active correlated threats, including ${criticalCount} critical blips in the central perimeter ring.`}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ maxWidth: `${width}px`, maxHeight: `${height}px`, aspectRatio: '1/1', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`radar-sweep-grad-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorCyan} stopOpacity="0.25" />
            <stop offset="60%" stopColor={colorCyan} stopOpacity="0.08" />
            <stop offset="100%" stopColor={colorCyan} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Concentric Severity Rings at 6% Opacity */}
        {[0.25, 0.5, 0.75, 1.0].map((fraction, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={maxRadius * fraction}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={1}
            strokeDasharray={fraction === 1.0 ? 'none' : '2 3'}
          />
        ))}

        {/* Crosshair Axes at 6% Opacity */}
        <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} stroke="rgba(255, 255, 255, 0.06)" strokeWidth={1} />
        <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} stroke="rgba(255, 255, 255, 0.06)" strokeWidth={1} />

        {/* Rotating 60-degree Radar Sweep */}
        <g className="radar-sweep-arm" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - maxRadius} A ${maxRadius} ${maxRadius} 0 0 1 ${sweepEndX} ${sweepEndY} Z`}
            fill={`url(#radar-sweep-grad-${chartId})`}
          />
          <line x1={cx} y1={cy} x2={cx} y2={cy - maxRadius} stroke={colorCyan} strokeWidth={1.5} />
        </g>

        {/* Threat Blips: 4px to 9px with Critical Pulse */}
        {data.map(blip => {
          const rad = (blip.angle * Math.PI) / 180;
          const r = blip.radius * maxRadius;
          const bx = cx + r * Math.cos(rad);
          const by = cy + r * Math.sin(rad);
          const blipColor = getBlipColor(blip);
          const blipRadius = getBlipRadius(blip.severity);

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
                  strokeWidth={1.5}
                />
              )}
              <circle
                cx={bx}
                cy={by}
                r={blipRadius}
                fill={blipColor}
                stroke="#060B14"
                strokeWidth={1.5}
              />
            </g>
          );
        })}
      </svg>

      {/* Hover Info Tooltip (Only on hover/focus) */}
      {hoveredBlip && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            background: 'var(--color-raised)',
            border: '1px solid var(--color-border)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-chip)',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 20,
            maxWidth: '300px',
            boxShadow: 'var(--shadow-overlay)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '11px' }}>
              {hoveredBlip.threatId}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-small)', fontSize: '11px' }}>
              {hoveredBlip.cveId}
            </span>
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
            {hoveredBlip.title}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px' }}>
            <span style={{ color: getBlipColor(hoveredBlip), textTransform: 'capitalize', fontWeight: 600 }}>
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

  const colorCritical = useCssVar('--severity-critical', '#DC2626');
  const colorHigh = useCssVar('--severity-high', '#D97706');
  const colorMedium = useCssVar('--severity-medium', '#CA8A04');
  const colorLow = useCssVar('--severity-low', '#16A34A');

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
        {/* Concentric Severity Rings */}
        {data.map((item, idx) => {
          const r = center - 14 - idx * (strokeWidth + gap);
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
              {/* Background Track in Light Subtle Gray */}
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="#EEF2F6"
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
          y={center + 2}
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize="24"
          fontWeight="700"
          fontFamily="var(--font-sans)"
          className="tabular-nums"
        >
          {activeItem ? activeItem.count : total}
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          fill="var(--color-text-small)"
          fontSize="11"
          fontFamily="var(--font-mono)"
          style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
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
  const colorCyan = useCssVar('--accent-cyan', '#059669');
  const colorCritical = useCssVar('--severity-critical', '#DC2626');

  if (loading) return <Skeleton height={height} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data || data.length === 0 || !data.some(d => (d.total || 0) > 0)) {
    return (
      <EmptyState
        title="No 14-Day Ingestion History"
        description="Active database records are historical advisories. No new disclosures ingested in the 14-day rolling window."
      />
    );
  }

  return (
    <div
      className="cyber-chart-wrapper"
      role="img"
      aria-label="14-day Threat Trend Chart depicting incident trajectory over the last 14 days"
      style={{ width: '100%', height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="#E8EDF2" strokeDasharray="3 3" vertical={false} />
          <defs>
            <linearGradient id="trendCyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorCyan} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorCyan} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="trendCritGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorCritical} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorCritical} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="#5B6779"
            fontSize={11}
            fontFamily="var(--font-mono)"
            tickLine={false}
            tickFormatter={val => val.slice(5)}
          />
          <YAxis
            stroke="#5B6779"
            fontSize={11}
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
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD3DD',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
                      color: '#0F172A'
                    }}
                  >
                    <div style={{ color: '#5B6779', fontFamily: 'var(--font-mono)', marginBottom: '4px', fontSize: '11px' }}>
                      {label}
                    </div>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      Total Threats: {day.total}
                    </div>
                    <div style={{ color: 'var(--severity-critical)', fontWeight: 500 }}>
                      Critical: {day.critical}
                    </div>
                    <div style={{ color: 'var(--severity-high)', fontWeight: 500 }}>
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
            strokeWidth={1.5}
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
