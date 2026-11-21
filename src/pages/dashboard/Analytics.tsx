import React, { useState, useMemo } from 'react';
import { Calendar, Filter, ArrowUpDown } from 'lucide-react';
import { Panel, Badge, Button } from '../../components/ui';
import { ActivityHeatmap, SourceFlow } from '../../components/charts/CyberCharts';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { Threat } from '../../types';

export const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<'24h' | '3d' | '7d' | '14d'>('14d');
  const [actorSortOrder, setActorSortOrder] = useState<'desc' | 'asc'>('desc');
  const [cveSortOrder, setCveSortOrder] = useState<'desc' | 'asc'>('desc');

  const threatsAsync = useAsync(() => api.getThreats());
  const heatmapAsync = useAsync(() => api.getActivityMatrix());
  const flowAsync = useAsync(() => api.getSourceFlow());

  // Genuine Date Range Filtering
  const filteredThreats = useMemo(() => {
    const list = threatsAsync.data || [];
    if (dateRange === '14d') return list;

    const hours = dateRange === '24h' ? 24 : dateRange === '3d' ? 72 : 168;
    const cutoff = new Date('2026-11-20T12:00:00Z').getTime() - hours * 3600 * 1000;

    return list.filter(t => new Date(t.timestamp).getTime() >= cutoff);
  }, [threatsAsync.data, dateRange]);

  // Aggregate Top CVEs
  const topCves = useMemo(() => {
    const map = new Map<string, { cveId: string; count: number; critical: number; threats: Threat[] }>();
    filteredThreats.forEach(t => {
      const entry = map.get(t.cveId) || { cveId: t.cveId, count: 0, critical: 0, threats: [] };
      entry.count++;
      if (t.severity === 'critical') entry.critical++;
      entry.threats.push(t);
      map.set(t.cveId, entry);
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => (cveSortOrder === 'desc' ? b.count - a.count : a.count - b.count));
    return arr.slice(0, 7);
  }, [filteredThreats, cveSortOrder]);

  // Aggregate Top Actors
  const topActors = useMemo(() => {
    const map = new Map<string, { actor: string; count: number; criticalCount: number }>();
    filteredThreats.forEach(t => {
      const actor = t.actor || 'Unknown Adversary';
      const entry = map.get(actor) || { actor, count: 0, criticalCount: 0 };
      entry.count++;
      if (t.severity === 'critical') entry.criticalCount++;
      map.set(actor, entry);
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => (actorSortOrder === 'desc' ? b.count - a.count : a.count - b.count));
    return arr.slice(0, 7);
  }, [filteredThreats, actorSortOrder]);

  // Aggregate Top Malware & Threat Vectors
  const topMalware = useMemo(() => {
    const map = new Map<string, number>();
    filteredThreats.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredThreats]);

  const maxCveCount = Math.max(...topCves.map(c => c.count), 1);
  const maxActorCount = Math.max(...topActors.map(a => a.count), 1);
  const maxMalwareCount = Math.max(...topMalware.map(m => m.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header & Date Range Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Telemetry Analytics & Ingestion Flows</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Multi-dimensional correlation analysis, temporal heatmaps, and threat vector distributions.
          </p>
        </div>

        {/* Real Date Range Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-panel)', padding: 'var(--space-1)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', overflowX: 'auto', maxWidth: '100%' }}>
          <Calendar size={14} style={{ color: 'var(--color-text-small)', marginLeft: 'var(--space-2)' }} />
          <Button
            variant={dateRange === '24h' ? 'primary' : 'outline'}
            style={{ minHeight: '28px', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
            onClick={() => setDateRange('24h')}
          >
            Last 24h
          </Button>
          <Button
            variant={dateRange === '3d' ? 'primary' : 'outline'}
            style={{ minHeight: '28px', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
            onClick={() => setDateRange('3d')}
          >
            Last 3d
          </Button>
          <Button
            variant={dateRange === '7d' ? 'primary' : 'outline'}
            style={{ minHeight: '28px', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
            onClick={() => setDateRange('7d')}
          >
            Last 7d
          </Button>
          <Button
            variant={dateRange === '14d' ? 'primary' : 'outline'}
            style={{ minHeight: '28px', padding: '2px 8px', fontSize: 'var(--text-xs)' }}
            onClick={() => setDateRange('14d')}
          >
            Full 14d
          </Button>
        </div>
      </div>

      {/* Date filter active feedback badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--color-raised)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
        <Filter size={14} color="var(--accent-cyan)" />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
          Active Range Filter: <strong>{dateRange.toUpperCase()}</strong> — Showing <strong>{filteredThreats.length}</strong> correlated events of {threatsAsync.data?.length || 0} total.
        </span>
      </div>

      {/* Temporal Heatmap & Source Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Heatmap */}
        <Panel
          title="7-Day × 24-Hour Incident Matrix"
          action={<span style={{ fontSize: '11px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>Hour (UTC)</span>}
        >
          <ActivityHeatmap
            data={heatmapAsync.data}
            loading={heatmapAsync.loading}
            error={heatmapAsync.error}
            onRetry={heatmapAsync.refetch}
          />
        </Panel>

        {/* Source Flow */}
        <Panel
          title="Ingestion Flow: Source → Attack Vector → Impact"
          action={<span style={{ fontSize: '11px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>Cross-feed correlation</span>}
        >
          <SourceFlow
            data={flowAsync.data}
            loading={flowAsync.loading}
            error={flowAsync.error}
            onRetry={flowAsync.refetch}
            height={220}
          />
        </Panel>
      </div>

      {/* Breakdown Tables with Proportional Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Top CVEs */}
        <Panel
          title="Top Target CVEs"
          action={
            <Button
              variant="outline"
              onClick={() => setCveSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              style={{ fontSize: '11px', minHeight: '26px', padding: '2px 6px' }}
              icon={<ArrowUpDown size={12} />}
            >
              Sort ({cveSortOrder.toUpperCase()})
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {topCves.map(item => (
              <div key={item.cveId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {item.cveId}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                    {item.count} detections ({item.critical} crit)
                  </span>
                </div>
                {/* Inline proportional bar */}
                <div style={{ height: '6px', background: 'var(--color-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(item.count / maxCveCount) * 100}%`,
                      background: item.critical > 0 ? 'var(--severity-critical)' : 'var(--accent-blue)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Top Threat Actors */}
        <Panel
          title="Top Adversary Groups"
          action={
            <Button
              variant="outline"
              onClick={() => setActorSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              style={{ fontSize: '11px', minHeight: '26px', padding: '2px 6px' }}
              icon={<ArrowUpDown size={12} />}
            >
              Sort ({actorSortOrder.toUpperCase()})
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {topActors.map(item => (
              <div key={item.actor} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    {item.actor}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                    {item.count} attacks
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(item.count / maxActorCount) * 100}%`,
                      background: 'var(--accent-cyan)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Attack Vectors & Malware Categories */}
        <Panel title="Attack Vector Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {topMalware.map(item => (
              <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                    {item.name}
                  </span>
                  <span className="tabular-nums" style={{ color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                    {item.count} incidents
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(item.count / maxMalwareCount) * 100}%`,
                      background: 'var(--accent-green)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
