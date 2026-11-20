import React, { useState } from 'react';
import { ThreatRadar, SeverityRings, ActivityHeatmap, SourceFlow, GlowTrend } from '../components/charts/CyberCharts';
import { Panel, Button, Badge } from '../components/ui';
import { useAsync } from '../hooks';
import { api } from '../services/api';

export const DevChartsPage: React.FC = () => {
  const [forcedState, setForcedState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal');

  const radarAsync = useAsync(() => api.getRadarBlips());
  const severityAsync = useAsync(() => api.getSeverityStats());
  const heatmapAsync = useAsync(() => api.getActivityMatrix());
  const flowAsync = useAsync(() => api.getSourceFlow());
  const trendAsync = useAsync(() => api.getTrend14d());

  const isLoading = forcedState === 'loading';
  const isEmpty = forcedState === 'empty';
  const isError = forcedState === 'error';
  const errorMessage = isError ? 'Network simulation failure: 503 Service Unavailable' : null;

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>CyberCharts Verification Suite</h1>
          <p style={{ color: 'var(--color-text-small)' }}>Phase 1 Scratch Test Route: All 5 charts in all 3 states (loading, empty, error) + live mock.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant={forcedState === 'normal' ? 'primary' : 'outline'} onClick={() => setForcedState('normal')}>Normal</Button>
          <Button variant={forcedState === 'loading' ? 'primary' : 'outline'} onClick={() => setForcedState('loading')}>Loading</Button>
          <Button variant={forcedState === 'empty' ? 'primary' : 'outline'} onClick={() => setForcedState('empty')}>Empty</Button>
          <Button variant={forcedState === 'error' ? 'primary' : 'outline'} onClick={() => setForcedState('error')}>Error</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-5)' }}>
        {/* 1. ThreatRadar */}
        <Panel title={<span>1. ThreatRadar <Badge variant="simulated">Simulated data</Badge></span>}>
          <ThreatRadar
            data={isEmpty ? [] : radarAsync.data}
            loading={isLoading || (forcedState === 'normal' && radarAsync.loading)}
            error={errorMessage || (forcedState === 'normal' ? radarAsync.error : null)}
            onRetry={radarAsync.refetch}
            onBlipClick={id => alert(`Clicked blip: ${id}`)}
          />
        </Panel>

        {/* 2. SeverityRings */}
        <Panel title={<span>2. SeverityRings <Badge variant="simulated">Simulated data</Badge></span>}>
          <SeverityRings
            data={isEmpty ? [] : severityAsync.data}
            loading={isLoading || (forcedState === 'normal' && severityAsync.loading)}
            error={errorMessage || (forcedState === 'normal' ? severityAsync.error : null)}
            onRetry={severityAsync.refetch}
          />
        </Panel>

        {/* 3. ActivityHeatmap */}
        <Panel title={<span>3. ActivityHeatmap (7x24) <Badge variant="simulated">Simulated data</Badge></span>}>
          <ActivityHeatmap
            data={isEmpty ? [] : heatmapAsync.data}
            loading={isLoading || (forcedState === 'normal' && heatmapAsync.loading)}
            error={errorMessage || (forcedState === 'normal' ? heatmapAsync.error : null)}
            onRetry={heatmapAsync.refetch}
          />
        </Panel>

        {/* 4. SourceFlow */}
        <Panel title={<span>4. SourceFlow <Badge variant="simulated">Simulated data</Badge></span>}>
          <SourceFlow
            data={isEmpty ? [] : flowAsync.data}
            loading={isLoading || (forcedState === 'normal' && flowAsync.loading)}
            error={errorMessage || (forcedState === 'normal' ? flowAsync.error : null)}
            onRetry={flowAsync.refetch}
          />
        </Panel>

        {/* 5. GlowTrend */}
        <Panel title={<span>5. GlowTrend (14 Days) <Badge variant="simulated">Simulated data</Badge></span>} style={{ gridColumn: '1 / -1' }}>
          <GlowTrend
            data={isEmpty ? [] : trendAsync.data}
            loading={isLoading || (forcedState === 'normal' && trendAsync.loading)}
            error={errorMessage || (forcedState === 'normal' ? trendAsync.error : null)}
            onRetry={trendAsync.refetch}
          />
        </Panel>
      </div>
    </div>
  );
};
