import React from 'react';
import { Cpu, AlertTriangle, Layers } from 'lucide-react';
import { Panel, Badge, DataTable, Column } from '../../components/ui';
import { ThreatRadar } from '../../components/charts/CyberCharts';
import { useAsync } from '../../hooks';
import { api } from '../../services/api';
import { Prediction, ThreatCategory } from '../../types';

export const MLIntelligencePage: React.FC = () => {
  const radarAsync = useAsync(() => api.getRadarBlips());
  const predictionsAsync = useAsync(() => api.getPredictions());
  const metricsAsync = useAsync(() => api.getModelMetrics());

  const predictions = predictionsAsync.data || [];
  const metrics = metricsAsync.data;

  // Category counts
  const categoryCounts = predictions.reduce((acc, curr) => {
    acc[curr.predictedCategory] = (acc[curr.predictedCategory] || 0) + 1;
    return acc;
  }, {} as Record<ThreatCategory, number>);

  const columns: Column<Prediction>[] = [
    {
      header: 'Prediction ID',
      key: 'id',
      sortable: true,
      render: p => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{p.id}</span>
    },
    {
      header: 'Threat & CVE',
      key: 'threatId',
      sortable: true,
      render: p => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.threatId}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>{p.cveId}</div>
        </div>
      )
    },
    {
      header: 'Predicted Category',
      key: 'predictedCategory',
      sortable: true,
      render: p => <Badge variant="medium">{p.predictedCategory}</Badge>
    },
    {
      header: 'Model Confidence',
      key: 'confidence',
      sortable: true,
      render: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '60px', height: '6px', background: 'var(--color-raised)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${p.confidence}%`,
                height: '100%',
                background: p.confidence >= 80 ? 'var(--accent-green)' : 'var(--severity-high)'
              }}
            />
          </div>
          <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
            {p.confidence}%
          </span>
        </div>
      )
    },
    {
      header: 'Classifier Engine',
      key: 'model',
      sortable: true,
      render: p => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>{p.model}</span>
    },
    {
      header: 'Key Feature Vector',
      key: 'features',
      render: p => (
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          IOCs: {p.features.iocCount} • Len: {p.features.textLength} • Score: {p.features.keywordScore}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>ML Threat Classification & Inference</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Transformer-based multi-label threat categorisation and automated MITRE TTP correlation.
          </p>
        </div>
      </div>

      {/* Mandatory Honesty & Research Disclaimer Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid var(--severity-high)',
          borderRadius: 'var(--radius-panel)',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)'
        }}
      >
        <AlertTriangle size={18} color="var(--severity-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
          <strong style={{ color: 'var(--severity-high)' }}>Academic Research Simulation Notice: </strong>
          All model performance scores, F1 ratings, and predictions shown in this module are generated mock benchmarks.
          As specified in the project requirements, these values serve as UI placeholders until formal cross-validation
          evaluation in the research paper is finalized. No metrics here represent live-measured ground truth.
        </div>
      </div>

      {/* Hero: Category Colored Radar & Model Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-5)' }}>
        {/* Radar Coloured by Predicted Category */}
        <Panel
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Layers size={18} color="var(--accent-cyan)" />
              Perimeter Threats Categorised by ML Classifier
              <Badge variant="simulated">Simulated data</Badge>
            </span>
          }
          action={<span style={{ fontSize: '11px', color: 'var(--color-text-small)' }}>Colour: Attack Category</span>}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-2) 0' }}>
            <ThreatRadar
              data={radarAsync.data}
              loading={radarAsync.loading}
              error={radarAsync.error}
              onRetry={radarAsync.refetch}
              colourBy="category"
            />
          </div>
          {/* Category Legend */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: '11px', color: 'var(--severity-critical)' }}>● Zero-Day</span>
            <span style={{ fontSize: '11px', color: 'var(--severity-high)' }}>● Ransomware</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>● Supply Chain</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>● Data Exfiltration</span>
            <span style={{ fontSize: '11px', color: 'var(--severity-low)' }}>● Botnet</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>● Phishing</span>
          </div>
        </Panel>

        {/* Model Metrics & Architecture Panel */}
        <Panel
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Cpu size={18} color="var(--accent-cyan)" />
              Model Architecture & Experimental Benchmarks
              <Badge variant="simulated">Simulated data</Badge>
            </span>
          }
        >
          {metrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 'var(--text-base)' }}>
                  {metrics.modelName}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', fontFamily: 'var(--font-mono)' }}>
                  Version: {metrics.version} • Latency P95: {metrics.latencyP95Ms}ms • Samples: {metrics.sampleCount.toLocaleString()}
                </div>
              </div>

              {/* Metric KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Target Accuracy</div>
                  <div className="tabular-nums" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {(metrics.accuracy * 100).toFixed(1)}%
                  </div>
                  <Badge variant="simulated" style={{ marginTop: '4px' }}>Placeholder</Badge>
                </div>
                <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Weighted F1-Score</div>
                  <div className="tabular-nums" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                    {metrics.f1Score.toFixed(3)}
                  </div>
                  <Badge variant="simulated" style={{ marginTop: '4px' }}>Placeholder</Badge>
                </div>
                <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Macro Precision</div>
                  <div className="tabular-nums" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--severity-high)', fontFamily: 'var(--font-mono)' }}>
                    {metrics.precision.toFixed(3)}
                  </div>
                  <Badge variant="simulated" style={{ marginTop: '4px' }}>Placeholder</Badge>
                </div>
                <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)' }}>Macro Recall</div>
                  <div className="tabular-nums" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                    {metrics.recall.toFixed(3)}
                  </div>
                  <Badge variant="simulated" style={{ marginTop: '4px' }}>Placeholder</Badge>
                </div>
              </div>

              {/* Distribution of predicted categories */}
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                  Predicted Attack Category Distribution:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-small)' }}>
                      <span>{cat}</span>
                      <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{count} predictions</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Prediction History Table */}
      <Panel
        title="Recent Machine Learning Classification Inferences"
        action={<Badge variant="simulated">Simulated data</Badge>}
      >
        <DataTable
          columns={columns}
          data={predictions}
          keyField="id"
          emptyMessage="No model predictions available."
        />
      </Panel>
    </div>
  );
};
