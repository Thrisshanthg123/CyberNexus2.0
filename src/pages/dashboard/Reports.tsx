import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Table
} from 'lucide-react';
import { Panel, Badge, Button, Tabs, Tooltip } from '../../components/ui';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { Severity, ThreatSource } from '../../types';

export const ReportsPage: React.FC = () => {
  const threatsAsync = useAsync(() => api.getThreats());
  const threats = threatsAsync.data || [];

  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<ThreatSource | 'all'>('all');
  const [reportTitle, setReportTitle] = useState('CyberNexus Operational Intel Briefing');
  const [previewTab, setPreviewTab] = useState<'preview' | 'rawJson' | 'rawCsv'>('preview');

  const filteredThreats = useMemo(() => {
    return threats.filter(t => {
      const matchSev = severityFilter === 'all' || t.severity === severityFilter;
      const matchSrc = sourceFilter === 'all' || t.source === sourceFilter;
      return matchSev && matchSrc;
    });
  }, [threats, severityFilter, sourceFilter]);

  const generateJsonContent = () => {
    const reportObj = {
      meta: {
        title: reportTitle,
        generatedAt: new Date().toISOString(),
        framework: 'CyberNexus v1.0',
        filtersApplied: { severity: severityFilter, source: sourceFilter },
        totalRecords: filteredThreats.length
      },
      summary: {
        critical: filteredThreats.filter(t => t.severity === 'critical').length,
        high: filteredThreats.filter(t => t.severity === 'high').length,
        medium: filteredThreats.filter(t => t.severity === 'medium').length,
        low: filteredThreats.filter(t => t.severity === 'low').length
      },
      threats: filteredThreats
    };
    return JSON.stringify(reportObj, null, 2);
  };

  const generateCsvContent = () => {
    const header = 'ID,CVE,Title,Severity,Category,Source,Actor,TTP,Confidence,Timestamp\n';
    const rows = filteredThreats.map(t => 
      `"${t.id}","${t.cveId}","${t.title.replace(/"/g, '""')}","${t.severity}","${t.category}","${t.source}","${t.actor}","${t.ttp}","${t.confidence}","${t.timestamp}"`
    ).join('\n');
    return header + rows;
  };

  const handleDownload = (format: 'json' | 'csv') => {
    const isJson = format === 'json';
    const content = isJson ? generateJsonContent() : generateCsvContent();
    const mime = isJson ? 'application/json' : 'text/csv';
    const filename = `${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.${format}`;

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Security Intelligence Reports & Exports</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Generate structured export artifacts in real CSV and JSON formats from active threat intelligence data.
          </p>
        </div>

        {/* Download Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Tooltip
            content={
              filteredThreats.length === 0
                ? 'No matching records in selected scope to export'
                : `Export ${filteredThreats.length} threat records as CSV.`
            }
          >
            <div>
              <Button
                variant="primary"
                onClick={() => handleDownload('csv')}
                disabled={filteredThreats.length === 0}
                aria-disabled={filteredThreats.length === 0 ? 'true' : undefined}
                icon={<Download size={14} />}
              >
                Export Real CSV ({filteredThreats.length})
              </Button>
            </div>
          </Tooltip>

          <Tooltip
            content={
              filteredThreats.length === 0
                ? 'No matching records in selected scope to export'
                : `Export ${filteredThreats.length} threat records as JSON.`
            }
          >
            <div>
              <Button
                variant="secondary"
                onClick={() => handleDownload('json')}
                disabled={filteredThreats.length === 0}
                aria-disabled={filteredThreats.length === 0 ? 'true' : undefined}
                icon={<Download size={14} />}
              >
                Export Real JSON ({filteredThreats.length})
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Report Configuration & Filters */}
      <Panel title="Report Configuration & Scope">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-12)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Report Document Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle-color)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-14)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-12)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Severity Scope
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    background: severityFilter === sev ? 'var(--bg-raised)' : 'transparent',
                    color: severityFilter === sev ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: severityFilter === sev ? 'var(--accent-emerald)' : 'var(--border-subtle-color)',
                    borderRadius: 'var(--radius-chip)',
                    padding: 'var(--space-1) var(--space-2)',
                    fontSize: 'var(--text-12)',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-12)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Source Ingestion Filter
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {(['all', 'NVD', 'GitHub', 'Reddit', 'X/Twitter'] as const).map(src => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  style={{
                    background: sourceFilter === src ? 'var(--bg-raised)' : 'transparent',
                    color: sourceFilter === src ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: sourceFilter === src ? 'var(--accent-emerald)' : 'var(--border-subtle-color)',
                    borderRadius: 'var(--radius-chip)',
                    padding: 'var(--space-1) var(--space-2)',
                    fontSize: 'var(--text-12)',
                    cursor: 'pointer'
                  }}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Live Preview Tabs */}
      <Tabs
        activeId={previewTab}
        onChange={id => setPreviewTab(id as 'preview' | 'rawJson' | 'rawCsv')}
        tabs={[
          { id: 'preview', label: 'Executive Preview', icon: <Eye size={16} /> },
          { id: 'rawCsv', label: 'CSV Output Preview', icon: <Table size={16} /> },
          { id: 'rawJson', label: 'JSON Schema Preview', icon: <FileText size={16} /> }
        ]}
      />

      {previewTab === 'preview' && (
        <Panel title="Report Summary & Included Findings Preview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--bg-raised)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--accent-emerald)', marginBottom: 'var(--space-1)' }}>
                {reportTitle}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Scope: {severityFilter.toUpperCase()} severity • {sourceFilter} sources • {filteredThreats.length} correlated records
              </div>
            </div>

            <div className="ui-table-container">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Threat ID</th>
                    <th>CVE</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Source</th>
                    <th>Adversary</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThreats.slice(0, 8).map(threat => (
                    <tr key={threat.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{threat.id}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{threat.cveId}</td>
                      <td>{threat.title}</td>
                      <td><Badge variant={threat.severity}>{threat.severity}</Badge></td>
                      <td>{threat.source}</td>
                      <td>{threat.actor}</td>
                      <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{threat.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredThreats.length > 8 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Showing first 8 of {filteredThreats.length} total rows in report preview.
              </div>
            )}
          </div>
        </Panel>
      )}

      {previewTab === 'rawCsv' && (
        <Panel title="Raw CSV Data Output">
          <div style={{ background: 'var(--bg-app)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', maxHeight: '350px', overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}>{generateCsvContent()}</pre>
          </div>
        </Panel>
      )}

      {previewTab === 'rawJson' && (
        <Panel title="Raw JSON Data Output">
          <div style={{ background: 'var(--bg-app)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle-color)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', maxHeight: '350px', overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}>{generateJsonContent()}</pre>
          </div>
        </Panel>
      )}
    </div>
  );
};
