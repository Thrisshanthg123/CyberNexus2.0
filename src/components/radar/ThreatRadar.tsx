import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RadarBlip } from '../../types';
import { useRadarLayout, LayoutBlip } from './useRadarLayout';
import { Drawer, Button, SeverityBadge, CodeText, Skeleton, EmptyState, ErrorState } from '../ui';
import './ThreatRadar.css';

export interface ThreatRadarProps {
  data: RadarBlip[] | null | undefined;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBlipClick?: (threatId: string) => void;
  className?: string;
  showLegend?: boolean;
  showCaption?: boolean;
}

// React.memo marker component for high performance rendering without sweep re-renders
interface RadarMarkerProps {
  blip: LayoutBlip;
  onHover: (blip: LayoutBlip | null, e: React.MouseEvent | React.FocusEvent) => void;
  onClick: (blip: LayoutBlip) => void;
}

const RadarMarker = memo<RadarMarkerProps>(({ blip, onHover, onClick }) => {
  const r = blip.markerRadius;
  return (
    <g
      className="radar-marker"
      tabIndex={0}
      role="button"
      aria-label={`Threat ${blip.threatId}: ${blip.title}, Severity: ${blip.severity}`}
      onClick={() => onClick(blip)}
      onMouseEnter={e => onHover(blip, e)}
      onMouseLeave={e => onHover(null, e)}
      onFocus={e => onHover(blip, e)}
      onBlur={e => onHover(null, e)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(blip);
        }
      }}
      transform={`translate(${blip.x}, ${blip.y})`}
    >
      {blip.isPulse && (
        <circle
          cx={0}
          cy={0}
          className="radar-blip-pulse-circle"
          stroke={blip.color}
          fill="none"
        />
      )}
      {/* Dual visual encoding: shape + color cue per severity tier */}
      {blip.severity === 'critical' && (
        <polygon
          points={`0,${-r * 1.3} ${r * 1.3},0 0,${r * 1.3} ${-r * 1.3},0`}
          fill={blip.color}
          stroke="var(--radar-blip-stroke)"
          strokeWidth={1.5}
          className="radar-marker-dot"
        />
      )}
      {blip.severity === 'high' && (
        <polygon
          points={`0,${-r * 1.3} ${r * 1.15},${r * 0.9} ${-r * 1.15},${r * 0.9}`}
          fill={blip.color}
          stroke="var(--radar-blip-stroke)"
          strokeWidth={1.5}
          className="radar-marker-dot"
        />
      )}
      {blip.severity === 'medium' && (
        <rect
          x={-r * 0.9}
          y={-r * 0.9}
          width={r * 1.8}
          height={r * 1.8}
          rx={1.5}
          fill={blip.color}
          stroke="var(--severity-medium-outline)"
          strokeWidth={1}
          className="radar-marker-dot"
        />
      )}
      {blip.severity === 'low' && (
        <circle
          cx={0}
          cy={0}
          r={r}
          fill={blip.color}
          stroke="var(--radar-blip-stroke)"
          strokeWidth={1.5}
          className="radar-marker-dot"
        />
      )}
    </g>
  );
});

RadarMarker.displayName = 'RadarMarker';

export const ThreatRadar: React.FC<ThreatRadarProps> = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onBlipClick,
  className = '',
  showLegend = true,
  showCaption = true,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 440, height: 440 });
  const [hoveredBlip, setHoveredBlip] = useState<LayoutBlip | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedBlip, setSelectedBlip] = useState<LayoutBlip | null>(null);

  // ResizeObserver for responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const size = Math.min(entry.contentRect.width, 520);
        if (size > 100) {
          setDimensions({ width: size, height: size });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { layoutBlips, cx, cy, maxRadius, ringRadii } = useRadarLayout(data, {
    width: dimensions.width,
    height: dimensions.height
  });

  const handleMarkerHover = (blip: LayoutBlip | null, _e: React.MouseEvent | React.FocusEvent) => {
    if (!blip) {
      setHoveredBlip(null);
      setTooltipPos(null);
      return;
    }
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      // Relative positioning inside container
      setTooltipPos({
        x: (blip.x / dimensions.width) * containerRect.width,
        y: (blip.y / dimensions.height) * containerRect.height
      });
    }
    setHoveredBlip(blip);
  };

  const handleMarkerClick = (blip: LayoutBlip) => {
    setSelectedBlip(blip);
    onBlipClick?.(blip.threatId);
  };

  if (loading) {
    return (
      <div className={`threat-radar-wrapper ${className}`} ref={containerRef}>
        <div className="threat-radar-container">
          <Skeleton height="100%" width="100%" borderRadius="50%" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`threat-radar-wrapper ${className}`} ref={containerRef}>
        <ErrorState
          title="Threat Radar Offline"
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`threat-radar-wrapper ${className}`} ref={containerRef}>
        <EmptyState
          title="Sector Clear"
          description="No telemetry markers currently detected in the operational field."
        />
      </div>
    );
  }

  // Create conic sweep wedge in SVG
  const sweepAngle = 45; // 45-degree beam
  const sweepRadius = maxRadius;
  const rad = (sweepAngle * Math.PI) / 180;
  const sweepX = cx + sweepRadius * Math.sin(rad);
  const sweepY = cy - sweepRadius * Math.cos(rad);

  return (
    <div className={`threat-radar-wrapper ${className}`}>
      <div className="threat-radar-container" ref={containerRef}>
        <svg
          className="threat-radar-svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          role="img"
          aria-label="Threat Radar: Graphical distribution of active security threats"
        >
          <defs>
            {/* Radar Sweep Gradient */}
            <radialGradient id="radarCenterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="sweepBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx={cx} cy={cy} r={maxRadius} fill="var(--radar-surface)" />
          <circle cx={cx} cy={cy} r={maxRadius * 0.3} fill="url(#radarCenterGlow)" />

          {/* Range rings */}
          {ringRadii.map((ring, idx) => (
            <circle
              key={ring.label}
              cx={cx}
              cy={cy}
              r={ring.r}
              className={`radar-ring ${idx === ringRadii.length - 1 ? 'radar-ring-unscored' : ''}`}
            />
          ))}

          {/* Crosshair axes */}
          <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} className="radar-axis" />
          <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} className="radar-axis" />
          {/* Diagonal axes */}
          <line
            x1={cx - maxRadius * 0.707}
            y1={cy - maxRadius * 0.707}
            x2={cx + maxRadius * 0.707}
            y2={cy + maxRadius * 0.707}
            className="radar-axis"
          />
          <line
            x1={cx - maxRadius * 0.707}
            y1={cy + maxRadius * 0.707}
            x2={cx + maxRadius * 0.707}
            y2={cy - maxRadius * 0.707}
            className="radar-axis"
          />

          {/* Range ring distance labels */}
          <text x={cx + 6} y={cy - maxRadius * 0.22 - 4} className="radar-ring-label">CVSS 9.0</text>
          <text x={cx + 6} y={cy - maxRadius * 0.45 - 4} className="radar-ring-label">CVSS 7.0</text>
          <text x={cx + 6} y={cy - maxRadius * 0.68 - 4} className="radar-ring-label">CVSS 4.0</text>
          <text x={cx + 6} y={cy - maxRadius * 0.95 - 4} className="radar-ring-label">UNSCORED</text>

          {/* Sector annotations */}
          <text x={cx + maxRadius * 0.55} y={cy - maxRadius * 0.55} className="radar-sector-label">
            NVD SECTOR
          </text>
          <text x={cx - maxRadius * 0.55} y={cy + maxRadius * 0.55} className="radar-sector-label">
            GITHUB SECTOR
          </text>
          <text x={cx} y={cy + maxRadius - 8} className="radar-sector-label">
            UNCLASSIFIED
          </text>

          {/* Pure CSS rotating sweep beam */}
          <g className="radar-sweep">
            <path
              d={`M ${cx} ${cy} L ${cx} ${cy - sweepRadius} A ${sweepRadius} ${sweepRadius} 0 0 1 ${sweepX} ${sweepY} Z`}
              fill="url(#sweepBeamGradient)"
            />
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - sweepRadius}
              stroke="var(--accent-cyan)"
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          </g>

          {/* Telemetry Markers (React.memo) */}
          {layoutBlips.map(blip => (
            <RadarMarker
              key={blip.id}
              blip={blip}
              onHover={handleMarkerHover}
              onClick={handleMarkerClick}
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredBlip && tooltipPos && (
          <div
            className="radar-tooltip-box"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{hoveredBlip.threatId}</span>
              <SeverityBadge severity={hoveredBlip.severity} />
            </div>
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {hoveredBlip.cveId}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Source: <strong>{hoveredBlip.category || 'NVD'}</strong>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {hoveredBlip.riskScore !== null
                ? `Provisional Score: ${hoveredBlip.riskScore}/100`
                : 'CVSS-derived (provisional)'}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Abstract Layout Disclaimer */}
      {(showLegend || showCaption) && (
        <div className="radar-legend">
          {showLegend && (
            <div className="radar-legend-items">
              <div className="radar-legend-item">
                <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <polygon points="0,-5 5,0 0,5 -5,0" fill="var(--severity-critical)" stroke="var(--radar-blip-stroke)" strokeWidth="1" />
                </svg>
                <span>Critical (CVSS 9.0+)</span>
              </div>
              <div className="radar-legend-item">
                <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <polygon points="0,-5 5,4 -5,4" fill="var(--severity-high)" stroke="var(--radar-blip-stroke)" strokeWidth="1" />
                </svg>
                <span>High (7.0 - 8.9)</span>
              </div>
              <div className="radar-legend-item">
                <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <rect x="-4" y="-4" width="8" height="8" rx="1" fill="var(--severity-medium)" stroke="var(--radar-blip-stroke)" strokeWidth="1" />
                </svg>
                <span>Medium (4.0 - 6.9)</span>
              </div>
              <div className="radar-legend-item">
                <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="0" cy="0" r="4.5" fill="var(--severity-low)" stroke="var(--radar-blip-stroke)" strokeWidth="1" />
                </svg>
                <span>Low (0.1 - 3.9)</span>
              </div>
              <div className="radar-legend-item">
                <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="0" cy="0" r="4.5" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
                <span>Unscored</span>
              </div>
            </div>
          )}

          {showCaption && (
            <p className="radar-abstract-disclaimer">
              <strong>Abstract layout</strong> — non-spatial intelligence projection. Angle indicates ingestion sector (NVD / GitHub / Unclassified). Radial distance is CVSS-derived (provisional); missing CVSS is mapped to the unscored outer ring.
            </p>
          )}
        </div>
      )}

      {/* Blip Investigation Drawer */}
      <Drawer
        isOpen={Boolean(selectedBlip)}
        onClose={() => setSelectedBlip(null)}
        title={selectedBlip?.threatId || 'Threat Telemetry'}
        subtitle={`Correlated Advisory: ${selectedBlip?.cveId}`}
      >
        {selectedBlip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 'var(--text-13)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <SeverityBadge severity={selectedBlip.severity} />
              <CodeText text={selectedBlip.cveId} />
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 'var(--text-14)', color: 'var(--text-primary)' }}>
                {selectedBlip.title}
              </h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-12)', lineHeight: 1.5 }}>
                Vulnerability identified across telemetry feeds. Evaluated under standard correlation parameters.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
              <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source Feed</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedBlip.category || 'NVD'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Provisional Score</span>
                <div style={{ fontWeight: 600, color: 'var(--status-warning)', marginTop: '2px' }}>
                  {selectedBlip.riskScore !== null ? `${selectedBlip.riskScore} / 100` : 'CVSS-derived (provisional)'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ML Classification</span>
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                  Not yet analysed
                </div>
              </div>

              <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Model Confidence</span>
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                  {selectedBlip.confidence !== null ? `${selectedBlip.confidence}%` : 'Not yet analysed'}
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Indicators of Compromise (IOCs)</span>
              <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Not yet analysed
              </div>
            </div>

            <Button
              variant="primary"
              icon={<ArrowRight size={14} />}
              onClick={() => {
                const threatId = selectedBlip.threatId;
                setSelectedBlip(null);
                navigate(`/dashboard/threats/${threatId}`);
              }}
              style={{ marginTop: 'var(--space-2)' }}
            >
              View Full Threat Details
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};
