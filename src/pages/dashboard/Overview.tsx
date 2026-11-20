import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Clock,
  Boxes,
  Bug,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Panel, Badge, Button } from '../../components/ui';
import { ThreatRadar, SeverityRings, GlowTrend } from '../../components/charts/CyberCharts';
import { useAsync, useCountUp } from '../../hooks';
import { api } from '../../services/api';

interface KpiCardProps {
  label: string;
  value: number;
  delta: string;
  icon: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'default';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, delta, icon, variant = 'default' }) => {
  const animatedValue = useCountUp(value, 1000);

  const colorMap = {
    critical: 'var(--severity-critical)',
    high: 'var(--severity-high)',
    medium: 'var(--severity-medium)',
    low: 'var(--severity-low)',
    default: 'var(--accent-cyan)'
  };

  return (
    <div
      style={{
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-panel)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontWeight: 500 }}>
          {label}
        </span>
        <div style={{ color: colorMap[variant] }}>{icon}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <span
          className="metric-value tabular-nums"
          style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}
        >
          {animatedValue}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: delta.startsWith('+') ? 'var(--severity-critical)' : 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <TrendingUp size={12} style={{ marginRight: '2px' }} />
          {delta}
        </span>
      </div>
    </div>
  );
};

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const threatsAsync = useAsync(() => api.getThreats());
  const radarAsync = useAsync(() => api.getRadarBlips());
  const severityAsync = useAsync(() => api.getSeverityStats());
  const trendAsync = useAsync(() => api.getTrend14d());
  const campaignsAsync = useAsync(() => api.getCampaigns());

  const threats = threatsAsync.data || [];
  const totalThreats = threats.length;
  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const newToday = threats.filter(t => {
    const diffHours = (new Date().getTime() - new Date(t.timestamp).getTime()) / (1000 * 3600);
    return diffHours <= 24;
  }).length;
  const activeCampaigns = campaignsAsync.data?.filter(c => c.status === 'Active').length || 3;
  const exploitedCves = new Set(threats.map(t => t.cveId)).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Executive Ops Overview</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Real-time cross-platform correlation across NVD, GitHub, and dark-web social channels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={() => navigate('/dashboard/analytics')}>
            Detailed Analytics
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard/feed')}>
            View Live Feed
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <KpiCard label="Total Correlated Threats" value={totalThreats} delta="+14.2% vs last wk" icon={<ShieldAlert size={18} />} />
        <KpiCard label="Critical Severity Blips" value={criticalThreats} delta="+8.5% surge" icon={<Flame size={18} />} variant="critical" />
        <KpiCard label="New Ingested Today" value={newToday} delta="+21今日" icon={<Clock size={18} />} variant="high" />
        <KpiCard label="Active Adversary Campaigns" value={activeCampaigns} delta="3 Active" icon={<Boxes size={18} />} variant="medium" />
        <KpiCard label="Exploited Unique CVEs" value={exploitedCves} delta="+5 in KEV" icon={<Bug size={18} />} variant="low" />
      </div>

      {/* Hero Grid: ThreatRadar & Severity Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-5)',
          alignItems: 'stretch'
        }}
      >
        {/* Threat Radar Hero */}
        <Panel
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Activity size={18} color="var(--accent-cyan)" />
              Active Threat Perimeter Radar
              <Badge variant="simulated">Simulated data</Badge>
            </span>
          }
          action={
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
              Sweeping 360° • Click blip to inspect
            </span>
          }
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-2) 0' }}>
            <ThreatRadar
              data={radarAsync.data}
              loading={radarAsync.loading}
              error={radarAsync.error}
              onRetry={radarAsync.refetch}
              onBlipClick={threatId => navigate(`/dashboard/threats/${threatId}`)}
              colourBy="severity"
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: '11px', color: 'var(--severity-critical)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Critical (Inner)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--severity-high)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● High (Middle)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--severity-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Medium
            </span>
            <span style={{ fontSize: '11px', color: 'var(--severity-low)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Low (Outer)
            </span>
          </div>
        </Panel>

        {/* Severity Distribution & Metrics */}
        <Panel
          title="Severity Breakdown & Concentric Rings"
          action={<Badge variant="simulated">Simulated data</Badge>}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
            <SeverityRings
              data={severityAsync.data}
              loading={severityAsync.loading}
              error={severityAsync.error}
              onRetry={severityAsync.refetch}
              size={220}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
            {severityAsync.data?.map(stat => (
              <div
                key={stat.severity}
                style={{
                  background: 'var(--color-raised)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-chip)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }} />
                  <span style={{ textTransform: 'capitalize', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                    {stat.severity}
                  </span>
                </div>
                <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  {stat.count} ({stat.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* 14-Day Threat Horizon GlowTrend */}
      <Panel
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            14-Day Cross-Platform Threat Horizon
            <Badge variant="simulated">Simulated data</Badge>
          </span>
        }
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>— Total Volume</span>
            <span style={{ color: 'var(--severity-critical)' }}>— Critical Incidents</span>
          </div>
        }
      >
        <GlowTrend
          data={trendAsync.data}
          loading={trendAsync.loading}
          error={trendAsync.error}
          onRetry={trendAsync.refetch}
          height={200}
        />
      </Panel>

      {/* Recent Correlated Activity List */}
      <Panel
        title="Recent Correlated Attack Telemetry"
        action={
          <Button variant="outline" onClick={() => navigate('/dashboard/feed')} style={{ fontSize: 'var(--text-xs)', minHeight: '30px' }}>
            Full Ingestion Feed <ArrowUpRight size={14} />
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {threats.slice(0, 6).map(threat => (
            <div
              key={threat.id}
              tabIndex={0}
              role="button"
              aria-label={`Inspect ${threat.id} - ${threat.title}`}
              onClick={() => navigate(`/dashboard/threats/${threat.id}`)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/dashboard/threats/${threat.id}`);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                background: 'var(--color-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-chip)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflow: 'hidden' }}>
                <Badge variant={threat.severity}>{threat.severity}</Badge>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {threat.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                    {threat.id} • {threat.cveId} • {threat.actor} • Source: {threat.source}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {threat.confidence}% conf
                </span>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {new Date(threat.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};
