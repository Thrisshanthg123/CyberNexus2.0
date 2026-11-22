import React, { useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ExternalLink,
  Share2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Badge, MockDataBadge, Button, Drawer, EmptyState, ErrorState, Tooltip } from '../../components/ui';
import { useAsync, useReducedMotion } from '../../hooks';
import { api } from '../../services/api';

interface GraphNode {
  id: string;
  name: string;
  type: 'threat' | 'cve' | 'ioc' | 'actor';
  severity?: string;
  val: number;
  x?: number;
  y?: number;
}

export const ThreatGraphPage: React.FC = () => {
  const graphAsync = useAsync(() => api.getGraphData());
  const reducedMotion = useReducedMotion();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  const [showSimulated, setShowSimulated] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    threat: true,
    cve: true,
    ioc: true,
    actor: true
  });

  const rawData = useMemo(() => {
    if (!showSimulated) {
      return { nodes: [], links: [] };
    }
    return graphAsync.data || { nodes: [], links: [] };
  }, [showSimulated, graphAsync.data]);

  const filteredData = useMemo(() => {
    const activeNodes = rawData.nodes.filter(n => filterTypes[n.type]);
    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    const activeLinks = rawData.links.filter(l => {
      const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      return activeNodeIds.has(s) && activeNodeIds.has(t);
    });

    return {
      nodes: activeNodes,
      links: activeLinks
    };
  }, [rawData, filterTypes]);

  const toggleFilter = (type: string) => {
    if (!showSimulated) return;
    setFilterTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const readToken = (name: string) =>
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      : '';

  const getNodeColor = (node: GraphNode) => {
    switch (node.type) {
      case 'threat':
        return node.severity === 'critical'
          ? readToken('--severity-critical')
          : readToken('--accent-blue');
      case 'cve':
        return readToken('--accent-blue-hover');
      case 'ioc':
        return readToken('--severity-medium');
      case 'actor':
        return readToken('--accent-purple');
      default:
        return readToken('--text-muted');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '1440px', margin: '0 auto', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Interactive Threat Topology Graph</h1>
            {showSimulated ? (
              <MockDataBadge>Simulated data</MockDataBadge>
            ) : (
              <Badge variant="planned">Awaiting Extraction</Badge>
            )}
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Multi-relational bipartite graph linking threat incidents, CVEs, defanged IOCs, and adversary clusters.
          </p>
        </div>

        {/* View Toggle & Graph Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button
            variant={showSimulated ? 'primary' : 'outline'}
            onClick={() => setShowSimulated(!showSimulated)}
            icon={<Eye size={14} />}
          >
            {showSimulated ? 'Exit Simulated Preview' : 'Preview Simulated Topology'}
          </Button>

          <Tooltip content={!showSimulated ? 'Graph topology not built yet' : 'Zoom into graph'}>
            <div>
              <Button
                variant="outline"
                onClick={() => fgRef.current?.zoom(1.4, 400)}
                aria-label="Zoom in graph"
                disabled={!showSimulated}
                icon={<ZoomIn size={14} />}
              >
                Zoom In
              </Button>
            </div>
          </Tooltip>

          <Tooltip content={!showSimulated ? 'Graph topology not built yet' : 'Zoom out of graph'}>
            <div>
              <Button
                variant="outline"
                onClick={() => fgRef.current?.zoom(0.7, 400)}
                aria-label="Zoom out graph"
                disabled={!showSimulated}
                icon={<ZoomOut size={14} />}
              >
                Zoom Out
              </Button>
            </div>
          </Tooltip>

          <Tooltip content={!showSimulated ? 'Graph topology not built yet' : 'Reset zoom and center graph'}>
            <div>
              <Button
                variant="outline"
                onClick={() => fgRef.current?.zoomToFit(400, 20)}
                aria-label="Reset zoom and center graph"
                disabled={!showSimulated}
                icon={<Maximize2 size={14} />}
              >
                Center
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Backend Pipeline Notice */}
      <div
        style={{
          background: showSimulated ? 'var(--severity-medium-tint)' : 'var(--bg-raised)',
          border: '1px solid',
          borderColor: showSimulated ? 'var(--severity-medium)' : 'var(--border-card-color)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--text-12)',
          color: showSimulated ? 'var(--severity-medium-text)' : 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)'
        }}
      >
        <div>
          <strong>Backend Topology Pipeline: </strong>
          {showSimulated
            ? 'Displaying synthetic bipartite graph topology for UI/UX interaction verification.'
            : 'Entity extraction and graph correlation not built yet. Showing honest empty state.'}
        </div>
        {showSimulated && <MockDataBadge>Synthetic Network</MockDataBadge>}
      </div>

      {/* Main Graph Viewport */}
      <div
        style={{
          flex: 1,
          minHeight: '520px',
          position: 'relative',
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-panel)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Floating Filter Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            left: 'var(--space-3)',
            zIndex: 10,
            background: 'var(--bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-chip)',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            boxShadow: 'var(--shadow-subtle)',
            opacity: showSimulated ? 1 : 0.6
          }}
        >
          <Filter size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
          {Object.entries(filterTypes).map(([type, enabled]) => (
            <Tooltip
              key={type}
              content={!showSimulated ? 'Entity extraction not built yet' : `Toggle ${type} nodes`}
            >
              <div>
                <button
                  onClick={() => toggleFilter(type)}
                  disabled={!showSimulated}
                  style={{
                    background: enabled && showSimulated ? 'var(--accent-blue-tint)' : 'transparent',
                    color: enabled && showSimulated ? 'var(--accent-blue-text)' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: enabled && showSimulated ? 'var(--accent-blue)' : 'var(--border-subtle-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: showSimulated ? 'pointer' : 'not-allowed',
                    textTransform: 'uppercase'
                  }}
                >
                  {type}
                </button>
              </div>
            </Tooltip>
          ))}
        </div>

        {/* Floating Legend Overlay */}
        {showSimulated && (
          <div
            style={{
              position: 'absolute',
              bottom: 'var(--space-3)',
              left: 'var(--space-3)',
              zIndex: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-chip)',
              padding: 'var(--space-2) var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              fontSize: '11px',
              fontWeight: 500,
              boxShadow: 'var(--shadow-subtle)'
            }}
          >
            <span style={{ color: 'var(--severity-critical)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ■ Threat Incident
            </span>
            <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Target CVE
            </span>
            <span style={{ color: 'var(--severity-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ◆ Indicator (IOC)
            </span>
            <span style={{ color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ▲ Threat Actor
            </span>
            <MockDataBadge style={{ marginLeft: 'var(--space-2)' }}>Simulated Topology</MockDataBadge>
          </div>
        )}

        {/* State Rendering */}
        {graphAsync.loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
            <RefreshCw size={20} className="animate-spin" color="var(--accent-blue)" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-small)' }}>Loading graph topology...</span>
          </div>
        )}

        {graphAsync.error && !showSimulated && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
            <ErrorState
              title="Graph Service Offline"
              message={graphAsync.error || 'Failed to query graph correlation service.'}
              onRetry={graphAsync.refetch}
            />
          </div>
        )}

        {!graphAsync.loading && !showSimulated && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <EmptyState
              icon={<Share2 size={36} color="var(--text-muted)" />}
              title="Awaiting entity extraction"
              description="Entity extraction and correlation not built yet. Live telemetry records currently contain raw advisory descriptions without extracted topology nodes."
              action={
                <Button variant="outline" onClick={() => setShowSimulated(true)} icon={<Eye size={14} />}>
                  Preview Simulated Topology
                </Button>
              }
            />
          </div>
        )}

        {showSimulated && (
          <div style={{ flex: 1, position: 'relative' }}>
            <ForceGraph2D
              ref={fgRef}
              graphData={filteredData}
              backgroundColor={readToken('--bg-surface')}
              nodeId="id"
              nodeVal="val"
              nodeLabel={n => `${(n as GraphNode).type.toUpperCase()}: ${(n as GraphNode).name}`}
              linkColor={() => readToken('--border-card-color')}
              linkWidth={1.5}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              cooldownTicks={reducedMotion ? 0 : 100}
              onNodeClick={node => setSelectedNode(node as GraphNode)}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const n = node as GraphNode;
                const size = Math.max(4, (n.val || 10) / (globalScale * 0.4));
                const color = getNodeColor(n);
                const x = n.x || 0;
                const y = n.y || 0;

                ctx.fillStyle = color;
                ctx.strokeStyle = n.type === 'ioc' ? readToken('--severity-medium-outline') : readToken('--bg-surface');
                ctx.lineWidth = 1.5;

                // Render shape per type
                if (n.type === 'threat') {
                  ctx.fillRect(x - size, y - size, size * 2, size * 2);
                  ctx.strokeRect(x - size, y - size, size * 2, size * 2);
                } else if (n.type === 'cve') {
                  ctx.beginPath();
                  ctx.arc(x, y, size, 0, 2 * Math.PI, false);
                  ctx.fill();
                  ctx.stroke();
                } else if (n.type === 'ioc') {
                  ctx.beginPath();
                  ctx.moveTo(x, y - size * 1.2);
                  ctx.lineTo(x + size * 1.2, y);
                  ctx.lineTo(x, y + size * 1.2);
                  ctx.lineTo(x - size * 1.2, y);
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
                } else {
                  ctx.beginPath();
                  ctx.moveTo(x, y - size * 1.3);
                  ctx.lineTo(x + size * 1.2, y + size);
                  ctx.lineTo(x - size * 1.2, y + size);
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
                }

                // Node Label
                if (globalScale > 1.2) {
                  const label = n.name;
                  ctx.font = '11px Inter, sans-serif';
                  ctx.fillStyle = readToken('--text-primary');
                  ctx.fillText(label, x + size + 3, y + 4);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Node Detail Drawer on Click */}
      <Drawer
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={
          selectedNode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {selectedNode.type.toUpperCase()}
              </span>
              <span style={{ fontSize: 'var(--text-sm)' }}>{selectedNode.name}</span>
              <MockDataBadge>Simulated data</MockDataBadge>
            </div>
          )
        }
      >
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase' }}>
                  Topology Entity (Simulated)
                </span>
                <MockDataBadge>Simulated Node</MockDataBadge>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{selectedNode.name}</h3>
            </div>

            <div style={{ background: 'var(--color-raised)', padding: 'var(--space-3)', borderRadius: 'var(--radius-chip)', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
              <div><strong>Entity Type:</strong> {selectedNode.type}</div>
              {selectedNode.severity && (
                <div style={{ marginTop: '4px' }}>
                  <strong>Severity:</strong> <Badge variant={selectedNode.severity as 'critical'}>{selectedNode.severity}</Badge>
                </div>
              )}
              <div style={{ marginTop: '4px' }}><strong>Relative Centrality Weight:</strong> {selectedNode.val}</div>
            </div>

            {selectedNode.type === 'threat' && (
              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = `/dashboard/threats/${selectedNode.id}`;
                }}
                icon={<ExternalLink size={14} />}
              >
                Inspect Threat Dossier
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
