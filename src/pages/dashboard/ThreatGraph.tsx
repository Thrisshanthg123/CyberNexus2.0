import React, { useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ExternalLink
} from 'lucide-react';
import { Badge, Button, Drawer } from '../../components/ui';
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

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    threat: true,
    cve: true,
    ioc: true,
    actor: true
  });

  const rawData = graphAsync.data || { nodes: [], links: [] };

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
    setFilterTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getNodeColor = (node: GraphNode) => {
    switch (node.type) {
      case 'threat':
        return node.severity === 'critical' ? '#F43F5E' : '#3B82F6';
      case 'cve':
        return '#22D3EE';
      case 'ioc':
        return '#F59E0B';
      case 'actor':
        return '#34D399';
      default:
        return '#E2E8F0';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: '1440px', margin: '0 auto', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Interactive Threat Topology Graph</h1>
            <Badge variant="simulated">Simulated data</Badge>
          </div>
          <p style={{ color: 'var(--color-text-small)', fontSize: 'var(--text-sm)', marginTop: '2px' }}>
            Multi-relational bipartite graph linking threat incidents, CVEs, defanged IOCs, and adversary clusters.
          </p>
        </div>

        {/* Graph Controls: Zoom & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            onClick={() => fgRef.current?.zoom(1.4, 400)}
            aria-label="Zoom in graph"
            icon={<ZoomIn size={14} />}
          >
            Zoom In
          </Button>
          <Button
            variant="outline"
            onClick={() => fgRef.current?.zoom(0.7, 400)}
            aria-label="Zoom out graph"
            icon={<ZoomOut size={14} />}
          >
            Zoom Out
          </Button>
          <Button
            variant="outline"
            onClick={() => fgRef.current?.zoomToFit(400, 20)}
            aria-label="Reset zoom and center graph"
            icon={<Maximize2 size={14} />}
          >
            Center
          </Button>
        </div>
      </div>

      {/* Main Graph Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: 'var(--color-panel)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-panel)',
          overflow: 'hidden'
        }}
      >
        {/* Floating Filter Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            left: 'var(--space-3)',
            zIndex: 10,
            background: 'var(--color-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-chip)',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <Filter size={14} color="var(--color-text-small)" />
          <span style={{ fontSize: '11px', color: 'var(--color-text-small)' }}>Filter:</span>
          {Object.entries(filterTypes).map(([type, enabled]) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              style={{
                background: enabled ? 'var(--color-panel)' : 'transparent',
                color: enabled ? 'var(--accent-cyan)' : 'var(--color-text-muted)',
                border: '1px solid',
                borderColor: enabled ? 'var(--accent-cyan)' : 'var(--color-border)',
                borderRadius: 'var(--radius-chip)',
                padding: '2px 6px',
                fontSize: '10px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Floating Legend Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-3)',
            left: 'var(--space-3)',
            zIndex: 10,
            background: 'var(--color-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-chip)',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            fontSize: '11px',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <span style={{ color: '#F43F5E', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ■ Threat Incident
          </span>
          <span style={{ color: '#22D3EE', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ● Target CVE
          </span>
          <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ◆ Indicator (IOC)
          </span>
          <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ▲ Threat Actor
          </span>
        </div>

        {/* 2D Canvas Force Graph */}
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredData}
          backgroundColor="#0C1422"
          nodeId="id"
          nodeVal="val"
          nodeLabel={n => `${(n as GraphNode).type.toUpperCase()}: ${(n as GraphNode).name}`}
          linkColor={() => '#1B2740'}
          linkWidth={1.5}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          cooldownTicks={reducedMotion ? 0 : 100}
          onNodeClick={node => setSelectedNode(node as GraphNode)}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode;
            const size = Math.max(3, (n.val || 10) / (globalScale * 0.4));
            const color = getNodeColor(n);
            const x = n.x || 0;
            const y = n.y || 0;

            ctx.fillStyle = color;
            ctx.strokeStyle = '#060B14';
            ctx.lineWidth = 1.5;

            // Render shape per type
            if (n.type === 'threat') {
              // Square
              ctx.fillRect(x - size, y - size, size * 2, size * 2);
              ctx.strokeRect(x - size, y - size, size * 2, size * 2);
            } else if (n.type === 'cve') {
              // Circle
              ctx.beginPath();
              ctx.arc(x, y, size, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.stroke();
            } else if (n.type === 'ioc') {
              // Diamond
              ctx.beginPath();
              ctx.moveTo(x, y - size * 1.2);
              ctx.lineTo(x + size * 1.2, y);
              ctx.lineTo(x, y + size * 1.2);
              ctx.lineTo(x - size * 1.2, y);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Actor: Triangle
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
              ctx.font = '10px Space Grotesk, sans-serif';
              ctx.fillStyle = '#E2E8F0';
              ctx.fillText(label, x + size + 2, y + 3);
            }
          }}
        />
      </div>

      {/* Node Detail Drawer on Click */}
      <Drawer
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={
          selectedNode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                {selectedNode.type.toUpperCase()}
              </span>
              <span style={{ fontSize: 'var(--text-sm)' }}>{selectedNode.name}</span>
            </div>
          )
        }
      >
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-small)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Topology Entity
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
