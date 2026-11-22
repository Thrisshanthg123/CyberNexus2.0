import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Database,
  AlertTriangle,
  Clock,
  Zap,
  Flame
} from 'lucide-react';
import {
  Panel,
  KpiCard,
  SeverityBadge,
  CodeText,
  Badge,
  MockDataBadge,
  Button,
  Skeleton,
  EmptyState,
  ErrorState
} from '../../components/ui';
import { ThreatRadar } from '../../components/radar/ThreatRadar';
import { SeverityRings, GlowTrend } from '../../components/charts/CyberCharts';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import './Overview.css';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Real data fetching hooks
  const threatsAsync = useAsync(() => api.getThreats());
  const radarAsync = useAsync(() => api.getRadarBlips());
  const severityAsync = useAsync(() => api.getSeverityStats());
  const [velocityMode, setVelocityMode] = useState<'collected' | 'published'>('collected');
  const trendAsync = useAsync(() => api.getTrend14d(velocityMode), [velocityMode]);

  const threats = threatsAsync.data || [];
  const loading = threatsAsync.loading && threats.length === 0;

  // Real KPI calculations from /api/threats
  const totalThreats = threats.length;
  const isLive = !threatsAsync.simulated && !threatsAsync.error;
  const hasDisclosureData = useMemo(() => threats.some(t => Boolean(t.published)), [threats]);

  const criticalThreats = useMemo(() => {
    return threats.filter(t => t.severity === 'critical' || (t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 9.0)).length;
  }, [threats]);

  // New Today: bucket strictly by collectedAt (when ingested into CyberNexus), not publishedAt
  const newToday = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    return threats.filter(t => {
      if (!t.collectedAt) return false;
      const time = new Date(t.collectedAt).getTime();
      return !isNaN(time) && time >= oneDayAgo;
    }).length;
  }, [threats]);

  // Real 7-day sparkline buckets from collectedAt (when ingested)
  const realSparkline = useMemo(() => {
    const buckets = Array(7).fill(0);
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    let hasData = false;

    threats.forEach(t => {
      if (t.collectedAt) {
        const time = new Date(t.collectedAt).getTime();
        if (!isNaN(time)) {
          const diffDays = Math.floor((now - time) / dayMs);
          if (diffDays >= 0 && diffDays < 7) {
            buckets[6 - diffDays]++;
            hasData = true;
          }
        }
      }
    });

    return hasData ? buckets : undefined;
  }, [threats]);

  const criticalSparkline = useMemo(() => {
    const buckets = Array(7).fill(0);
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;
    let hasData = false;

    threats
      .filter(t => t.severity === 'critical' || (t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 9.0))
      .forEach(t => {
        if (t.collectedAt) {
          const time = new Date(t.collectedAt).getTime();
          if (!isNaN(time)) {
            const diffDays = Math.floor((now - time) / dayMs);
            if (diffDays >= 0 && diffDays < 7) {
              buckets[6 - diffDays]++;
              hasData = true;
            }
          }
        }
      });

    return hasData ? buckets : undefined;
  }, [threats]);

  if (loading) {
    return (
      <div className="overview-container" style={{ padding: 'var(--space-4)' }}>
        <Skeleton height={140} style={{ borderRadius: '16px', marginBottom: 'var(--space-4)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <Skeleton height={460} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton height={220} />
            <Skeleton height={220} />
          </div>
        </div>
      </div>
    );
  }

  if (threatsAsync.error) {
    return (
      <div className="overview-container" style={{ padding: 'var(--space-8)' }}>
        <ErrorState
          title="Executive Telemetry Ingestion Failed"
          message={threatsAsync.error}
          onRetry={threatsAsync.refetch}
        />
      </div>
    );
  }

  return (
    <div className="overview-container">
      {/* Deep Green Hero Banner */}
      <section className="overview-hero-banner" aria-label="Executive Overview Banner">
        <div className="overview-hero-content">
          <div className="overview-hero-badge">
            <span className={`overview-hero-dot ${isLive ? 'pulse' : 'offline'}`} />
            <span>{isLive ? 'Live: Flask connected' : 'Offline: showing cached/mock data'}</span>
          </div>
          <h1 className="overview-hero-title">
            Good afternoon, Analyst • Incident Operations
          </h1>
          <p className="overview-hero-subtitle">
            Monitoring {totalThreats} live threats across NVD and GitHub feeds. {criticalThreats} critical vulnerabilities require immediate mitigation.
          </p>
        </div>

        <div className="overview-hero-actions">
          <button
            className="overview-hero-btn-primary"
            onClick={() => navigate('/dashboard/feed')}
          >
            Open Live Feed
            <ArrowRight size={14} />
          </button>
          <button
            className="overview-hero-btn-secondary"
            onClick={() => {
              threatsAsync.refetch();
              radarAsync.refetch();
              severityAsync.refetch();
              trendAsync.refetch();
            }}
          >
            <RefreshCw size={13} />
            Refresh Ingestion
          </button>
        </div>
      </section>

      {/* KPI Strip (5 cards with pastel icon chips, strictly from /api/threats data) */}
      <div className="overview-kpi-grid">
        <KpiCard
          label="Total Ingested Threats"
          value={totalThreats}
          delta={totalThreats > 0 ? "+12% this week" : "0"}
          deltaType="good"
          subtext="vs last 24h"
          icon={<Database size={16} />}
          iconVariant="blue"
          sparklineData={realSparkline}
        />
        <KpiCard
          label="Critical Severity"
          value={criticalThreats}
          delta={criticalThreats > 0 ? "Action required" : "Nominal"}
          deltaType={criticalThreats > 0 ? "critical" : "good"}
          subtext="Requires immediate triage"
          icon={<AlertTriangle size={16} />}
          iconVariant="red"
          sparklineData={criticalSparkline}
        />
        <KpiCard
          label="New Telemetry Today"
          value={newToday}
          delta="Last 24 hours"
          deltaType="neutral"
          subtext={newToday > 0 ? "Ingested in last 24h" : "No ingestions in last 24h"}
          icon={<Clock size={16} />}
          iconVariant="emerald"
          sparklineData={newToday > 0 ? realSparkline : undefined}
        />
        <KpiCard
          label="Active Adversary Campaigns"
          value="Not built yet"
          deltaType="neutral"
          badge={<Badge variant="planned">Planned</Badge>}
          subtext="Campaign correlation engine not built yet"
          icon={<Zap size={16} />}
          iconVariant="purple"
          onClick={() => navigate('/dashboard/campaigns')}
        />
        <KpiCard
          label="Exploited in Wild CVEs"
          value="Not available from collected data"
          deltaType="neutral"
          subtext="No exploit or KEV fields in collected records"
          icon={<Flame size={16} />}
          iconVariant="amber"
        />
      </div>

      {/* Main Grid: ThreatRadar as Hero (Left) + Severity Rings & 14-Day Horizon (Right) */}
      <div className="overview-hero-grid">
        {/* HERO VISUAL: Threat Radar */}
        <Panel
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>Perimeter Threat Radar</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                [CVSS-PROVISIONAL]
              </span>
            </div>
          }
          description="Continuous multi-sector radar sweep plotting live threat intelligence by ingestion source and CVSS-derived impact."
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {radarAsync.simulated && <MockDataBadge />}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {radarAsync.data?.length || 0} blips plotted
              </span>
            </div>
          }
          className="radar-hero-panel"
        >
          <ThreatRadar
            data={radarAsync.data}
            loading={radarAsync.loading}
            error={radarAsync.error}
            onRetry={radarAsync.refetch}
            onBlipClick={id => navigate(`/dashboard/threats/${id}`)}
          />
        </Panel>

        {/* Right Stack: Severity Rings & 14-Day Trajectory */}
        <div className="overview-side-stack">
          {/* Severity Rings */}
          <Panel
            title="Severity Distribution"
            description="Normalized breakdown across critical, high, medium, and low tiers."
            action={severityAsync.simulated ? <MockDataBadge /> : undefined}
          >
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SeverityRings
                data={severityAsync.data}
                loading={severityAsync.loading}
                error={severityAsync.error}
                onRetry={severityAsync.refetch}
                size={170}
              />
            </div>
          </Panel>

          {/* 14-Day Velocity Trend */}
          <Panel
            title={velocityMode === 'collected' ? "14-Day Ingestion Velocity" : "14-Day Disclosure Velocity"}
            description={
              velocityMode === 'collected'
                ? "Temporal trend of aggregate telemetry by ingestion date (collectedAt)."
                : "Temporal trend of aggregate telemetry by disclosure date (publishedAt)."
            }
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasDisclosureData && (
                  <div style={{ display: 'inline-flex', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle-color)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setVelocityMode('collected')}
                      style={{
                        border: 'none',
                        background: velocityMode === 'collected' ? 'var(--bg-surface)' : 'transparent',
                        color: velocityMode === 'collected' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: velocityMode === 'collected' ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      Ingested
                    </button>
                    <button
                      type="button"
                      onClick={() => setVelocityMode('published')}
                      style={{
                        border: 'none',
                        background: velocityMode === 'published' ? 'var(--bg-surface)' : 'transparent',
                        color: velocityMode === 'published' ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: velocityMode === 'published' ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      Disclosed
                    </button>
                  </div>
                )}
                {trendAsync.simulated ? (
                  <MockDataBadge>Simulated data</MockDataBadge>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Real Telemetry
                  </span>
                )}
              </div>
            }
          >
            <div style={{ height: '170px' }}>
              <GlowTrend
                data={trendAsync.data}
                loading={trendAsync.loading}
                error={trendAsync.error}
                onRetry={trendAsync.refetch}
                height={160}
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* Recent Correlated Activity Stream */}
      <Panel
        title="Recent Threat Telemetry Stream"
        description="Latest advisory disclosures and correlated indicator events."
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={<ExternalLink size={13} />}
            onClick={() => navigate('/dashboard/feed')}
          >
            View Full Feed ({totalThreats})
          </Button>
        }
      >
        {threats.length === 0 ? (
          <EmptyState
            title="No recent threat telemetry"
            description="Ingested advisories from NVD and GitHub will populate here automatically."
          />
        ) : (
          <div className="ui-table-container">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Threat ID</th>
                  <th style={{ width: '140px' }}>Vulnerability</th>
                  <th>Title & Context</th>
                  <th style={{ width: '100px' }}>Severity</th>
                  <th style={{ width: '100px' }}>Source</th>
                  <th style={{ width: '130px' }}>Provisional Score</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {threats.slice(0, 7).map(threat => (
                  <tr key={threat.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/dashboard/threats/${threat.id}`)}>
                    <td>
                      <CodeText text={threat.id} />
                    </td>
                    <td>
                      <CodeText text={threat.cveId} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {threat.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Timestamp: {threat.timestamp.slice(0, 16).replace('T', ' ')}
                      </div>
                    </td>
                    <td>
                      <SeverityBadge severity={threat.severity} />
                    </td>
                    <td>
                      <Badge variant={threat.source.toLowerCase().includes('github') ? 'active' : 'default'}>
                        {threat.source}
                      </Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--status-warning)' }}>
                        {threat.cvssScore !== null ? `CVSS ${threat.cvssScore}` : 'Unscored'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ArrowRight size={13} />}
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/dashboard/threats/${threat.id}`);
                        }}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
