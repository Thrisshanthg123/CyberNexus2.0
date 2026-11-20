/**
 * CyberNexus Unified API Client
 * 
 * ============================================================================
 * README: BACKEND INTEGRATION & CORS SETUP
 * ============================================================================
 * When connecting to the live Flask backend (setting USE_MOCK = false in config.ts),
 * the Flask server must have CORS configured for the Vite client origin:
 * 
 *   from flask_cors import CORS
 *   app = Flask(__name__)
 *   CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
 * 
 * When USE_MOCK is true, all responses are deterministically generated and
 * marked with `simulated: true`.
 * ============================================================================
 */

import { API_BASE, USE_MOCK } from './config';
import {
  Threat,
  RadarBlip,
  SeverityStat,
  FlowLink,
  Campaign,
  IOC,
  Alert,
  Prediction,
  ModelMetrics,
  SourceStatus,
  ApiResult
} from '../types';

import { mockThreats } from './mock/threats';
import { mockRadarBlips } from './mock/radar';
import { mockSeverityStats } from './mock/severity';
import { mockActivityMatrix, HeatmapCell } from './mock/activityMatrix';
import { mockSourceFlow } from './mock/sourceFlow';
import { mockTrend14d, TrendDay } from './mock/trend14d';
import { mockCampaigns } from './mock/campaigns';
import { mockIOCs } from './mock/iocs';
import { mockAlerts } from './mock/alerts';
import { mockPredictions } from './mock/predictions';
import { mockModelMetrics } from './mock/modelMetrics';
import { mockSources } from './mock/sources';

async function fetchFromBackend<T>(endpoint: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      return {
        data: null as unknown as T,
        error: `Server error: HTTP ${res.status} ${res.statusText}`,
        simulated: false
      };
    }
    const data = await res.json();
    return { data, error: null, simulated: false };
  } catch (err) {
    return {
      data: null as unknown as T,
      error: `Network error connecting to Flask at ${API_BASE}. Ensure server is running and CORS is enabled. Details: ${err instanceof Error ? err.message : String(err)}`,
      simulated: false
    };
  }
}

export const api = {
  async getThreats(): Promise<ApiResult<Threat[]>> {
    if (USE_MOCK) {
      return { data: mockThreats, error: null, simulated: true };
    }
    return fetchFromBackend<Threat[]>('/api/threats');
  },

  async getThreatById(id: string): Promise<ApiResult<Threat | null>> {
    if (USE_MOCK) {
      const match = mockThreats.find(t => t.id === id) || null;
      return { data: match, error: match ? null : 'Threat ID not found', simulated: true };
    }
    return fetchFromBackend<Threat | null>(`/api/threats/${id}`);
  },

  async getRadarBlips(): Promise<ApiResult<RadarBlip[]>> {
    if (USE_MOCK) {
      return { data: mockRadarBlips, error: null, simulated: true };
    }
    return fetchFromBackend<RadarBlip[]>('/api/radar');
  },

  async getSeverityStats(): Promise<ApiResult<SeverityStat[]>> {
    if (USE_MOCK) {
      return { data: mockSeverityStats, error: null, simulated: true };
    }
    return fetchFromBackend<SeverityStat[]>('/api/severity');
  },

  async getActivityMatrix(): Promise<ApiResult<HeatmapCell[]>> {
    if (USE_MOCK) {
      return { data: mockActivityMatrix, error: null, simulated: true };
    }
    return fetchFromBackend<HeatmapCell[]>('/api/activity-matrix');
  },

  async getSourceFlow(): Promise<ApiResult<FlowLink[]>> {
    if (USE_MOCK) {
      return { data: mockSourceFlow, error: null, simulated: true };
    }
    return fetchFromBackend<FlowLink[]>('/api/source-flow');
  },

  async getTrend14d(): Promise<ApiResult<TrendDay[]>> {
    if (USE_MOCK) {
      return { data: mockTrend14d, error: null, simulated: true };
    }
    return fetchFromBackend<TrendDay[]>('/api/trend-14d');
  },

  async getCampaigns(): Promise<ApiResult<Campaign[]>> {
    if (USE_MOCK) {
      return { data: mockCampaigns, error: null, simulated: true };
    }
    return fetchFromBackend<Campaign[]>('/api/campaigns');
  },

  async getIOCs(): Promise<ApiResult<IOC[]>> {
    if (USE_MOCK) {
      return { data: mockIOCs, error: null, simulated: true };
    }
    return fetchFromBackend<IOC[]>('/api/iocs');
  },

  async getAlerts(): Promise<ApiResult<Alert[]>> {
    if (USE_MOCK) {
      return { data: mockAlerts, error: null, simulated: true };
    }
    return fetchFromBackend<Alert[]>('/api/alerts');
  },

  async getPredictions(): Promise<ApiResult<Prediction[]>> {
    if (USE_MOCK) {
      return { data: mockPredictions, error: null, simulated: true };
    }
    return fetchFromBackend<Prediction[]>('/api/predictions');
  },

  async getModelMetrics(): Promise<ApiResult<ModelMetrics>> {
    if (USE_MOCK) {
      return { data: mockModelMetrics, error: null, simulated: true };
    }
    return fetchFromBackend<ModelMetrics>('/api/model-metrics');
  },

  async getSources(): Promise<ApiResult<SourceStatus[]>> {
    if (USE_MOCK) {
      return { data: mockSources, error: null, simulated: true };
    }
    return fetchFromBackend<SourceStatus[]>('/api/sources');
  },

  async getGraphData(): Promise<ApiResult<{
    nodes: Array<{ id: string; name: string; type: 'threat' | 'cve' | 'ioc' | 'actor'; severity?: string; val: number }>;
    links: Array<{ source: string; target: string; relationship: string }>;
  }>> {
    if (USE_MOCK) {
      const topThreats = mockThreats.slice(0, 25);
      const nodes: Array<{ id: string; name: string; type: 'threat' | 'cve' | 'ioc' | 'actor'; severity?: string; val: number }> = [];
      const links: Array<{ source: string; target: string; relationship: string }> = [];
      const actorSet = new Set<string>();
      const cveSet = new Set<string>();

      topThreats.forEach(t => {
        nodes.push({ id: t.id, name: t.id, type: 'threat', severity: t.severity, val: 12 });

        if (!cveSet.has(t.cveId)) {
          cveSet.add(t.cveId);
          nodes.push({ id: t.cveId, name: t.cveId, type: 'cve', severity: t.severity, val: 16 });
        }
        links.push({ source: t.id, target: t.cveId, relationship: 'EXPLOITS' });

        if (!actorSet.has(t.actor)) {
          actorSet.add(t.actor);
          nodes.push({ id: t.actor, name: t.actor, type: 'actor', val: 20 });
        }
        links.push({ source: t.actor, target: t.id, relationship: 'ATTRIBUTED_TO' });

        // Link first IOC
        const iocId = `IOC-${t.id.replace('THR-', '')}-1`;
        nodes.push({ id: iocId, name: iocId, type: 'ioc', val: 8 });
        links.push({ source: t.id, target: iocId, relationship: 'INDICATOR' });
      });

      return { data: { nodes, links }, error: null, simulated: true };
    }
    return fetchFromBackend('/api/graph');
  }
};
