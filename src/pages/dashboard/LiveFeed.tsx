import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Search,
  ExternalLink,
  PlusCircle,
  Check
} from 'lucide-react';
import { Panel, Badge, Button, Drawer } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { Threat, Severity, ThreatSource } from '../../types';
import { investigationStore } from '../../services/investigationStore';

export const LiveFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const threatsAsync = useAsync(() => api.getThreats());

  const [isPaused, setIsPaused] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ThreatSource | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  // Simulated streaming items
  const [streamIndex, setStreamIndex] = useState(25);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setStreamIndex(prev => {
        const max = threatsAsync.data?.length || 100;
        return prev < max ? prev + 1 : prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, threatsAsync.data]);

  const visibleThreats = useMemo(() => {
    const list = (threatsAsync.data || []).slice(0, streamIndex);
    return list.filter(t => {
      const matchSev = severityFilter === 'all' || t.severity === severityFilter;
      const matchSrc = sourceFilter === 'all' || t.source === sourceFilter;
      const matchQuery =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cveId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSev && matchSrc && matchQuery;
    });
  }, [threatsAsync.data, streamIndex, severityFilter, sourceFilter, searchQuery]);

  const handleAddToInvestigation = (threat: Threat) => {
    const cases = investigationStore.getCases();
    if (cases.length > 0) {
      investigationStore.addThreatToCase(cases[0].id, threat);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Real-Time Intelligence Ingestion Feed</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Streaming correlation stream capturing raw events across NVD, GitHub advisories, and darknet channels.
          </p>
        </div>

        {/* Stream Play/Pause Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: isPaused ? 'var(--severity-high)' : 'var(--accent-green)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPaused ? 'var(--severity-high)' : 'var(--accent-green)' }} />
            {isPaused ? 'FEED PAUSED' : 'LIVE STREAM ACTIVE'}
          </div>
          <Button
            variant={isPaused ? 'primary' : 'outline'}
            onClick={() => setIsPaused(prev => !prev)}
            icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
          >
            {isPaused ? 'Resume Ingestion' : 'Pause Stream'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          background: 'var(--color-panel)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-panel)',
          border: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--color-text-small)" />
          <input
            type="text"
            placeholder="Filter by title, CVE, actor or THR-ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* Severity selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Severity:</span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? 'var(--color-raised)' : 'transparent',
                  color: severityFilter === sev ? 'var(--accent-cyan)' : 'var(--color-text-small)',
                  border: '1px solid',
                  borderColor: severityFilter === sev ? 'var(--accent-cyan)' : 'var(--color-border)',
                  borderRadius: 'var(--radius-chip)',
                  padding: '2px 8px',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Source selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Source:</span>
            {(['all', 'NVD', 'GitHub', 'Reddit', 'X/Twitter'] as const).map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                style={{
                  background: sourceFilter === src ? 'var(--color-raised)' : 'transparent',
                  color: sourceFilter === src ? 'var(--accent-cyan)' : 'var(--color-text-small)',
                  border: '1px solid',
                  borderColor: sourceFilter === src ? 'var(--accent-cyan)' : 'var(--color-border)',
                  borderRadius: 'var(--radius-chip)',
                  padding: '2px 8px',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer'
                }}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stream List */}
      <Panel title={`Ingested Threat Stream (${visibleThreats.length} events)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {visibleThreats.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-small)' }}>
              No threat events match current filter parameters.
            </div>
          ) : (
            visibleThreats.map(threat => (
              <div
                key={threat.id}
                tabIndex={0}
                role="button"
                aria-label={`Open details for ${threat.id} - ${threat.title}`}
                onClick={() => setSelectedThreat(threat)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedThreat(threat);
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
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      {threat.title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                      {threat.id} • {threat.cveId} • Source: {threat.source} • {threat.actor}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0, marginLeft: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {threat.confidence}% conf
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(threat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Threat Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedThreat)}
        onClose={() => setSelectedThreat(null)}
        title={
          selectedThreat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selectedThreat.id}</span>
              <Badge variant={selectedThreat.severity}>{selectedThreat.severity}</Badge>
            </div>
          )
        }
      >
        {selectedThreat && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                {selectedThreat.title}
              </h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                CVE Reference: <strong>{selectedThreat.cveId}</strong> • Source: {selectedThreat.source}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Description & Impact
              </h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
                {selectedThreat.description}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                MITRE ATT&CK Mapping
              </h4>
              <div style={{ background: 'var(--color-raised)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)' }}>
                {selectedThreat.ttp}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Remediation & Mitigation
              </h4>
              <div style={{ background: 'rgba(34, 211, 238, 0.05)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                {selectedThreat.mitigation}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Button
                variant="primary"
                onClick={() => {
                  handleAddToInvestigation(selectedThreat);
                }}
                icon={addedToast ? <Check size={14} /> : <PlusCircle size={14} />}
              >
                {addedToast ? 'Added to Case!' : 'Add to Investigation'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/threats/${selectedThreat.id}`)}
                icon={<ExternalLink size={14} />}
              >
                Full Threat Dossier
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
