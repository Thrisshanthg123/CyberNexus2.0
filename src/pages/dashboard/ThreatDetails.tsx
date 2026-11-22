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
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { Panel, Badge, Button, Tabs, ErrorState, Skeleton, MockDataBadge } from '../../components/ui';
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
        <Skeleton height={140} />
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

  const isRealRecord = !threat.isSimulated && !threatAsync.simulated;
  const realIndicators = (threat.iocs || []).filter(val => val && val !== 'N/A' && val.trim() !== '');
  const linkedIocs = isRealRecord
    ? []
    : (allIocsAsync.data || []).filter(ioc => ioc.threatId === threat.id);
  const iocTabCount = isRealRecord ? realIndicators.length : linkedIocs.length;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft size={14} />}>
            Back
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--severity-high-text)' }}>
              {threat.id}
            </span>
            <Badge variant={threat.severity}>{threat.severity}</Badge>
            {(threat.isSimulated || threatAsync.simulated) && <MockDataBadge />}
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
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>CVE: <strong style={{ color: 'var(--accent-emerald-text)' }}>{threat.cveId}</strong></span>
          <span>Category: <strong>{threat.category || 'Not provided by source'}</strong></span>
          <span>Source: <strong>{threat.source}</strong></span>
          <span>Ingested: <strong>{new Date(threat.timestamp).toLocaleString()}</strong></span>
        </div>
      </Panel>

      {/* Tab Selector */}
      <Tabs
        activeId={activeTab}
        onChange={id => setActiveTab(id as 'summary' | 'iocs' | 'timeline' | 'evidence')}
        tabs={[
          { id: 'summary', label: 'Summary & References', icon: <Shield size={16} /> },
          { id: 'iocs', label: 'Linked Indicators (IOCs)', count: iocTabCount, icon: <Key size={16} /> },
          { id: 'timeline', label: 'Telemetry Timeline', icon: <Clock size={16} /> },
          { id: 'evidence', label: 'Source Evidence & Telemetry', icon: <FileCheck2 size={16} /> }
        ]}
      />

      {/* Tab 1: Summary & References */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
          <Panel title="Advisory Description & References">
            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Source Advisory Description
            </h4>
            <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              {threat.description || 'Not provided by source'}
            </p>

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Official Vulnerability References
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <a
                href={`https://nvd.nist.gov/vuln/detail/${threat.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', textDecoration: 'none' }}
              >
                <ExternalLink size={13} />
                <span>NVD Advisory Record ({threat.cveId})</span>
              </a>
              <a
                href={`https://cve.org/CVERecord?id=${threat.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--accent-blue)', textDecoration: 'none' }}
              >
                <ExternalLink size={13} />
                <span>CVE Program Record ({threat.cveId})</span>
              </a>
            </div>

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              MITRE ATT&CK Classification
            </h4>
            <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-emerald-text)' }}>
              {threat.ttp || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-ui)' }}>Not provided by source</span>}
            </div>

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              Impacted Systems & Perimeters
            </h4>
            {threat.affectedSystems && threat.affectedSystems.length > 0 && threat.affectedSystems[0] !== 'Perimeter Systems' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {threat.affectedSystems.map(sys => (
                  <div key={sys} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--severity-critical)' }}>▸</span> {sys}
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Not provided by source
              </span>
            )}
          </Panel>

          <Panel title="Actionable Remediation & Defense">
            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Remediation Guidance
            </h4>
            {threat.mitigation ? (
              <div style={{ background: 'var(--accent-emerald-tint)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {threat.mitigation}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Not provided by source
              </div>
            )}

            <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Correlation Confidence Rating
            </h4>
            {threat.confidence !== null && threat.confidence !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-raised)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${threat.confidence}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                </div>
                <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent-emerald-text)' }}>
                  {threat.confidence}%
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Not yet analysed
              </span>
            )}
          </Panel>
        </div>
      )}

      {/* Tab 2: Linked IOCs */}
      {activeTab === 'iocs' && (
        <Panel
          title={`Correlated Indicators of Compromise (${iocTabCount})`}
          action={!isRealRecord ? <MockDataBadge /> : undefined}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {isRealRecord ? (
              realIndicators.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--space-4)', textAlign: 'center' }}>
                  Not yet analysed
                </div>
              ) : (
                realIndicators.map((val, idx) => (
                  <div
                    key={`${val}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-3)',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-subtle-color)',
                      borderRadius: 'var(--radius-chip)'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {val}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handleCopy(val, `real-${idx}`)}
                      style={{ minHeight: '30px', fontSize: 'var(--text-xs)' }}
                      icon={copiedIoc === `real-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                    >
                      {copiedIoc === `real-${idx}` ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                ))
              )
            ) : linkedIocs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--space-4)', textAlign: 'center' }}>
                Not yet analysed
              </div>
            ) : (
              linkedIocs.map(ioc => (
                <div
                  key={ioc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle-color)',
                    borderRadius: 'var(--radius-chip)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Badge variant={ioc.type === 'ip' ? 'high' : ioc.type === 'domain' ? 'medium' : 'default'}>
                      {ioc.type.toUpperCase()}
                    </Badge>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {ioc.defangedValue}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ID: {ioc.id} • Reputation: <strong style={{ color: 'var(--severity-critical-text)' }}>{ioc.reputation}</strong>
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
              ))
            )}
          </div>
        </Panel>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' && (
        <Panel
          title="Telemetry Timeline"
          action={<MockDataBadge>Simulated progression</MockDataBadge>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative', paddingLeft: 'var(--space-4)' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '6px', width: '2px', background: 'var(--border-subtle-color)' }} />
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-14px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date(threat.timestamp).toLocaleString()}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Initial Advisory Ingested</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Discovered via {threat.source} source index.
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-14px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--severity-critical)' }} />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date(new Date(threat.timestamp).getTime() + 1800000).toLocaleString()}
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Automated Correlation Index Generated</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Disclosed vulnerability cross-referenced with NVD and GitHub advisories.
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 4: Source Evidence */}
      {activeTab === 'evidence' && (
        <Panel title="Raw Ingestion Telemetry & Evidence Packet">
          <div style={{ background: 'var(--bg-app)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', overflowX: 'auto' }}>
            <pre style={{ margin: 0 }}>
{`{
  "event_id": "${threat.id}",
  "cve_identifier": "${threat.cveId}",
  "ingestion_source": "${threat.source}",
  "ingested_at": "${threat.timestamp}",
  "cvss_score": ${threat.cvssScore !== null ? threat.cvssScore : 'null'},
  "adversary": ${threat.actor ? `"${threat.actor}"` : '"Not provided by source"'},
  "mitre_technique": ${threat.ttp ? `"${threat.ttp}"` : '"Not provided by source"'},
  "remediation": ${threat.mitigation ? `"${threat.mitigation}"` : '"Not provided by source"'}
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
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--severity-high-text)' }}>{rel.id}</span>
                  <Badge variant={rel.severity}>{rel.severity}</Badge>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rel.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {rel.cveId} • Source: {rel.source}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};
