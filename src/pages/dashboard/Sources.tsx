import React, { useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Panel, Badge, Button, Tooltip } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { SourceStatus } from '../../types';

export const SourcesPage: React.FC = () => {
  const sourcesAsync = useAsync(() => api.getSources());
  const sources = sourcesAsync.data || [];

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = (src: SourceStatus) => {
    if (src.status === 'Planned') return;
    setSyncingId(src.id);
    setTimeout(() => {
      setSyncingId(null);
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Telemetry Ingestion Connectors & Status</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Health monitoring, API polling rates, and sync latencies for external intelligence sources.
          </p>
        </div>
      </div>

      {/* Sources Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {sources.map(src => {
          const isPlanned = src.status === 'Planned';
          const isSyncing = syncingId === src.id;

          return (
            <Panel
              key={src.id}
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Database size={18} color={isPlanned ? 'var(--color-text-muted)' : 'var(--accent-cyan)'} />
                  {src.name}
                </span>
              }
              action={
                isPlanned ? (
                  <Badge variant="planned">Planned</Badge>
                ) : (
                  <Badge variant="active">Active</Badge>
                )
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', minHeight: '36px' }}>
                  {src.description}
                </p>

                <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Ingested Events:</span>
                    <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                      {src.eventCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>API Latency:</span>
                    <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                      {src.latencyMs ? `${src.latencyMs}ms` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Last Synchronization:</span>
                    <div style={{ color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                      {src.lastSync}
                    </div>
                  </div>
                </div>

                {/* Connector Actions */}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  {isPlanned ? (
                    <Tooltip content="Connector planned for Phase 4 integration; Twitter Enterprise API agreement pending.">
                      <div>
                        <Button variant="outline" disabled style={{ width: '100%', fontSize: 'var(--text-xs)' }}>
                          Integration Planned
                        </Button>
                      </div>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleSync(src)}
                      style={{ width: '100%', fontSize: 'var(--text-xs)' }}
                      disabled={isSyncing}
                      icon={<RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />}
                    >
                      {isSyncing ? 'Synchronizing Pipeline...' : 'Poll Immediate Feed'}
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
};
