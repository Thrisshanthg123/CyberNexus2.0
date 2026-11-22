import React, { useState } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { Panel, Badge, Button, Tooltip, Modal } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { SourceStatus } from '../../types';

export const SourcesPage: React.FC = () => {
  const sourcesAsync = useAsync(() => api.getSources());
  const sources = sourcesAsync.data || [];

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [confirmSource, setConfirmSource] = useState<SourceStatus | null>(null);
  const [sourceError, setSourceError] = useState<{ source: string; message: string } | null>(null);

  const executeSync = async () => {
    if (!confirmSource) return;
    const src = confirmSource;
    setConfirmSource(null);
    setSyncingId(src.id);
    setSourceError(null);
    api.resetBackoff();
    try {
      let res: { success: boolean; unconfirmed?: boolean; count?: number; message?: string };
      if (src.id === 'src-nvd') {
        res = await api.collectNvd(90000);
      } else if (src.id === 'src-github') {
        res = await api.collectGithub(90000);
      } else {
        res = { success: false, message: `${src.name} connector not built yet.` };
      }

      if (!res.success) {
        setSourceError({
          source: src.name,
          message: res.unconfirmed
            ? `Collection status unconfirmed (${res.message || 'No new count or newer timestamp detected after timeout'})`
            : (res.message || 'Collection failed.')
        });
      } else {
        await sourcesAsync.refetch();
      }
    } catch (err: any) {
      setSourceError({ source: src.name, message: err?.message || 'Collection failed.' });
    } finally {
      setTimeout(() => {
        setSyncingId(null);
      }, 1000);
    }
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
                  <Database size={18} color={isPlanned ? 'var(--text-muted)' : 'var(--accent-emerald)'} />
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
                <p style={{ fontSize: 'var(--text-12)', color: 'var(--text-secondary)', minHeight: '36px', margin: 0 }}>
                  {src.description}
                </p>

                <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: 'var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', fontSize: 'var(--text-12)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Ingested Events:</span>
                    <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {src.eventCount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>API Latency:</span>
                    <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      {src.latencyMs ? `${src.latencyMs}ms` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', borderTop: 'var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Last Synchronization:</span>
                    <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {src.lastSync}
                    </div>
                  </div>
                </div>

                {/* Connector Actions */}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  {isPlanned ? (
                    <Tooltip content={src.name === 'Reddit' ? 'Reddit connector not built yet' : 'X/Twitter connector not built yet'}>
                      <div className="ui-planned-chip-container">
                        <Badge variant="planned">Planned</Badge>
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip content={isSyncing ? 'Disabled: Pipeline synchronization in progress.' : `Poll ${src.name} API endpoint now`}>
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => setConfirmSource(src)}
                          style={{ width: '100%', fontSize: 'var(--text-12)' }}
                          disabled={isSyncing}
                          icon={<RefreshCw size={12} className={isSyncing ? 'spin' : ''} />}
                        >
                          {isSyncing ? 'Synchronizing Pipeline...' : 'Poll Immediate Feed'}
                        </Button>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Confirm Source Poll Modal */}
      <Modal
        isOpen={Boolean(confirmSource)}
        onClose={() => setConfirmSource(null)}
        title={confirmSource ? `Confirm Poll: ${confirmSource.name}` : 'Confirm Telemetry Ingestion'}
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmSource(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={executeSync}>
              Confirm & Poll Feed
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-13)', color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Trigger real-time telemetry polling from <strong>{confirmSource?.name}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-12)', color: 'var(--text-muted)' }}>
            Collector will query the external upstream API endpoint with a 90-second timeout. Incoming advisories will be normalized and deduplicated into the CyberNexus feed.
          </p>
        </div>
      </Modal>

      {/* Source Poll Error Modal */}
      <Modal
        isOpen={Boolean(sourceError)}
        onClose={() => setSourceError(null)}
        title="Collector Polling Failed"
        footer={
          <Button variant="primary" size="sm" onClick={() => setSourceError(null)}>
            Dismiss
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--severity-critical-text)', fontWeight: 600 }}>
            <AlertCircle size={18} color="var(--severity-critical)" />
            <span>Error querying {sourceError?.source}</span>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--severity-critical-tint)', border: '1px solid var(--severity-critical)', borderRadius: 'var(--radius-sm)', color: 'var(--severity-critical-text)', fontSize: 'var(--text-13)', fontFamily: 'var(--font-mono)' }}>
            {sourceError?.message}
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-12)', color: 'var(--text-secondary)' }}>
            Verify that your network connection is active and that the Flask backend service is running on port 5000.
          </p>
        </div>
      </Modal>
    </div>
  );
};
