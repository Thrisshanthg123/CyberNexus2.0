import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Clock,
  Key,
  Copy,
  Check,
  PlusCircle,
  FileCheck2
} from 'lucide-react';
import { Panel, Badge, Button, Tabs, ErrorState, Skeleton } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { investigationStore } from '../../services/investigationStore';

export const ThreatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'summary' | 'iocs' | 'timeline' | 'evidence'>('summary');
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const threatAsync = useAsync(() => api.getThreatById(id || ''), [id]);
  const allThreatsAsync = useAsync(() => api.getThreats());
  const allIocsAsync = useAsync(() => api.getIOCs());

  const threat = threatAsync.data;

  if (threatAsync.loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Skeleton height={40} width={250} />
        <Skeleton height={200} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (threatAsync.error || !threat) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto' }}>
        <ErrorState
          message={threatAsync.error || `Threat ID "${id}" could not be located in current intelligence index.`}
          onRetry={threatAsync.refetch}
        />
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Button variant="outline" onClick={() => navigate('/dashboard')} icon={<ArrowLeft size={14} />}>
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  const linkedIocs = (allIocsAsync.data || []).filter(ioc => ioc.threatId === threat.id);
  const relatedThreats = (allThreatsAsync.data || [])
    .filter(t => t.id !== threat.id && (t.actor === threat.actor || t.category === threat.category))
    .slice(0, 4);

  const handleCopy = (val: string, iocId: string) => {
    navigator.clipboard.writeText(val);
    setCopiedIoc(iocId);
    setTimeout(() => setCopiedIoc(null), 2000);
  };

  const handleAddToInvestigation = () => {
    const cases = investigationStore.getCases();
    if (cases.length > 0) {
      investigationStore.addThreatToCase(cases[0].id, threat);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft size={14} />}>
            Back
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {threat.id}
            </span>
            <Badge variant={threat.severity}>{threat.severity}</Badge>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="primary"
            onClick={handleAddToInvestigation}
            icon={addedSuccess ? <Check size={14} /> : <PlusCircle size={14} />}
          >
            {addedSuccess ? 'Added to Active Case' : 'Add to Investigation'}
          </Button>
        </div>
      </div>

      {/* Main Title Banner */}
      <Panel>
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          {threat.title}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
          <span>CVE: <strong style={{ color: 'var(--accent-cyan)' }}>{threat.cveId}</strong></span>
          <span>Category: <strong>{threat.category}</strong></span>
          <span>Adversary: <strong>{threat.actor}</strong></span>
          <span>Source: <strong>{threat.source}</strong></span>
          <span>Ingested: <strong>{new Date(threat.timestamp).toLocaleString()}</strong></span>
        </div>
      </Panel>

      {/* Tab Selector */}
      <Tabs
        activeId={activeTab}
        onChange={id => setActiveTab(id as 'summary' | 'iocs' | 'timeline' | 'evidence')}
        tabs={[
          { id: 'summary', label: 'Summary & Mitigation', icon: <Shield size={16} /> },
          { id: 'iocs', label: 'Linked Indicators (IOCs)', count: linkedIocs.length, icon: <Key size={16} /> },
          { id: 'timeline', label: 'Attack Timeline', icon: <Clock size={16} /> },
          { id: 'evidence', label: 'Source Evidence & Telemetry', icon: <FileCheck2 size={16} /> }
        ]}
      />

      {/* Tab 1: Summary */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-5)' }}>
          <Panel title="Threat Description & Vector">
            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
              {threat.description}
            </p>
            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              MITRE ATT&CK Classification
            </h4>
            <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)' }}>
              {threat.ttp}
            </div>

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              Impacted Software & Perimeters
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {threat.affectedSystems.map(sys => (
                <div key={sys} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--severity-critical)' }}>▸</span> {sys}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Actionable Remediation & Defense">
            <div style={{ background: 'rgba(34, 211, 238, 0.05)', padding: 'var(--space-4)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
                {threat.mitigation}
              </div>
            </div>

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Correlation Confidence Rating
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1, height: '8px', background: 'var(--color-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${threat.confidence}%`, height: '100%', background: 'var(--accent-cyan)' }} />
              </div>
              <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {threat.confidence}%
              </span>
            </div>
          </Panel>
        </div>
      )}

      {/* Tab 2: Linked IOCs */}
      {activeTab === 'iocs' && (
        <Panel title={`Correlated Indicators of Compromise (${linkedIocs.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {linkedIocs.map(ioc => (
              <div
                key={ioc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  background: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-chip)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Badge variant={ioc.type === 'ip' ? 'high' : ioc.type === 'domain' ? 'medium' : 'default'}>
                    {ioc.type.toUpperCase()}
                  </Badge>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                      {ioc.defangedValue}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                      ID: {ioc.id} • Reputation: <strong style={{ color: 'var(--severity-critical)' }}>{ioc.reputation}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(ioc.defangedValue, ioc.id)}
                    style={{ minHeight: '30px', fontSize: 'var(--text-xs)' }}
                    icon={copiedIoc === ioc.id ? <Check size={12} /> : <Copy size={12} />}
                  >
                    {copiedIoc === ioc.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' && (
        <Panel title="Event Horizon & Cross-Feed Propagation Timeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative', paddingLeft: 'var(--space-4)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: 'var(--color-border)' }} />
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-14px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                {new Date(threat.timestamp).toLocaleString()}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Initial Cross-Platform Correlation Ingested</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>
                Discovered on {threat.source} with automated confidence rating of {threat.confidence}%.
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-14px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--severity-critical)' }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                {new Date(new Date(threat.timestamp).getTime() + 1800000).toLocaleString()}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Weaponized PoC Script Detected</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>
                Exploit code observed propagating on public repositories.
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-14px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                {new Date(new Date(threat.timestamp).getTime() + 3600000).toLocaleString()}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Defensive Advisory Generated</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>
                Automated playbook generated firewall ingress rules and patch guidance.
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 4: Source Evidence */}
      {activeTab === 'evidence' && (
        <Panel title="Raw Ingestion Telemetry & Evidence Packet">
          <div style={{ background: 'var(--color-base)', padding: 'var(--space-4)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text)', overflowX: 'auto' }}>
            <pre style={{ margin: 0 }}>
{`{
  "event_id": "${threat.id}",
  "cve_identifier": "${threat.cveId}",
  "ingestion_source": "${threat.source}",
  "ingested_at": "${threat.timestamp}",
  "adversary": "${threat.actor}",
  "mitre_technique": "${threat.ttp}",
  "parser_confidence": ${threat.confidence / 100},
  "raw_payload_indicators": [
    ${linkedIocs.map(i => `"${i.defangedValue}"`).join(',\n    ')}
  ],
  "verification_checksum": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
}`}
            </pre>
          </div>
        </Panel>
      )}

      {/* Related Threats */}
      {relatedThreats.length > 0 && (
        <Panel title="Related Correlated Threat Clusters">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
            {relatedThreats.map(rel => (
              <div
                key={rel.id}
                tabIndex={0}
                role="button"
                aria-label={`View related threat ${rel.id}`}
                onClick={() => navigate(`/dashboard/threats/${rel.id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/dashboard/threats/${rel.id}`);
                  }
                }}
                style={{
                  background: 'var(--color-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-chip)',
                  padding: 'var(--space-3)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)' }}>{rel.id}</span>
                  <Badge variant={rel.severity}>{rel.severity}</Badge>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rel.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-small)', marginTop: '4px' }}>
                  {rel.actor} • {rel.cveId}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};
