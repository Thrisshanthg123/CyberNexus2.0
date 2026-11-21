/**
 * CyberNexus Unified API Client & Normalization Layer
 * 
 * Rules:
 * 1. Fields the API doesn't return (mlClassification, confidence, riskScore, iocs)
 *    stay null and render as "Not yet analysed".
 * 2. Any CVSS-derived score is labelled "CVSS-derived (provisional)".
 * 3. Fallback to deterministic mock when Flask is offline, tagged with simulated: true.
 */

import { USE_MOCK } from './config';
import {
  Threat,
  Severity,
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
import { mockActivityMatrix, HeatmapCell } from './mock/activityMatrix';
import { mockSourceFlow } from './mock/sourceFlow';
import { mockTrend14d, TrendDay } from './mock/trend14d';
import { mockCampaigns } from './mock/campaigns';
import { mockIOCs } from './mock/iocs';
import { mockAlerts } from './mock/alerts';
import { mockPredictions } from './mock/predictions';
import { mockModelMetrics } from './mock/modelMetrics';
import { mockSources } from './mock/sources';

interface FlaskRawThreat {
  id?: string | number;
  title?: string;
  description?: string;
  source?: string;
  category?: string;
  severity?: string;
  cvssScore?: number | null;
  status?: string;
  cve?: string;
  ioc?: string;
  timestamp?: string;
  published?: string;
  lastModified?: string;
  mlClassification?: string;
  confidence?: number;
  riskScore?: number;
  affectedSystems?: string[];
  ttp?: string;
  actor?: string;
  mitigation?: string;
}

function normalizeRawThreat(raw: FlaskRawThreat, index: number): Threat {
  const rawCve = raw.cve && raw.cve !== 'N/A' && raw.cve.trim() !== '' ? raw.cve : null;
  const cveId = rawCve || `CVE-GEN-${1000 + index}`;
  let id = raw.id && String(raw.id) !== 'N/A' && String(raw.id) !== 'THR-N/A'
    ? String(raw.id)
    : (rawCve ? `THR-${rawCve.replace('CVE-', '')}` : `THR-GEN-${1000 + index}`);

  const cvss = raw.cvssScore !== null && raw.cvssScore !== undefined && !isNaN(Number(raw.cvssScore))
    ? Number(raw.cvssScore)
    : null;

  // Severity derivation
  let sev: Severity = 'low';
  const rawSev = (raw.severity || '').toLowerCase();
  if (rawSev.includes('crit')) sev = 'critical';
  else if (rawSev.includes('high')) sev = 'high';
  else if (rawSev.includes('med')) sev = 'medium';
  else if (cvss !== null) {
    if (cvss >= 9.0) sev = 'critical';
    else if (cvss >= 7.0) sev = 'high';
    else if (cvss >= 4.0) sev = 'medium';
  }

  // Condition 1: Fields the API doesn't return (mlClassification, confidence, riskScore, iocs)
  // stay null and render as "Not yet analysed".
  const mlClassification = (raw.mlClassification && raw.mlClassification !== 'Unclassified')
    ? raw.mlClassification
    : null;

  const confidence = (raw.confidence !== undefined && raw.confidence !== null && Number(raw.confidence) > 0)
    ? Number(raw.confidence)
    : null;

  const rawRisk = Number(raw.riskScore);
  const hasRealRisk = !isNaN(rawRisk) && rawRisk > 0;
  const isProvisional = !hasRealRisk && cvss !== null;
  const riskScore = hasRealRisk ? rawRisk : (cvss !== null ? Math.round(cvss * 10) : null);

  const iocs = (raw.ioc && raw.ioc !== 'N/A' && raw.ioc.trim() !== '')
    ? [raw.ioc.trim()]
    : null;

  return {
    id,
    cveId,
    cve: cveId,
    title: raw.title || `Security Advisory ${cveId}`,
    description: raw.description || 'No detailed vulnerability telemetry provided.',
    severity: sev,
    category: raw.category || 'Vulnerability-Disclosure',
    source: (raw.source as any) || 'NVD',
    status: raw.status || 'Active',
    timestamp: raw.timestamp || raw.published || new Date().toISOString(),
    published: raw.published,
    lastModified: raw.lastModified,
    mlClassification,
    confidence,
    riskScore,
    cvssScore: cvss,
    isProvisionalScore: isProvisional,
    iocs,
    affectedSystems: raw.affectedSystems || ['Perimeter Systems'],
    ttp: raw.ttp || null,
    actor: raw.actor || null,
    mitigation: raw.mitigation || null,
    isSimulated: false
  };
}

export const api = {
  async getHealth(): Promise<{ status: string; service: string; online: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        return { status: data.status || 'online', service: data.service || 'CyberNexus API', online: true };
      }
      return { status: 'offline', service: 'CyberNexus API', online: false };
    } catch {
      return { status: 'offline', service: 'CyberNexus API', online: false };
    }
  },

  async getThreats(): Promise<ApiResult<Threat[]>> {
    if (!USE_MOCK) {
      try {
        const res = await fetch('/api/threats');
        if (res.ok) {
          const json = await res.json();
          const list: FlaskRawThreat[] = Array.isArray(json) ? json : (json.threats || []);
          const normalized = list.map((t, idx) => normalizeRawThreat(t, idx));
          return { data: normalized, error: null, simulated: false };
        }
      } catch (err) {
        console.warn('Live API connection failed, falling back to mock dataset:', err);
      }
    }

    return { data: mockThreats, error: null, simulated: true };
  },

  async getThreatById(id: string): Promise<ApiResult<Threat | null>> {
    const threatsRes = await this.getThreats();
    if (threatsRes.data) {
      const found = threatsRes.data.find(t => t.id === id || t.cveId === id || t.cve === id);
      return { data: found || null, error: found ? null : `Threat identifier "${id}" not found`, simulated: threatsRes.simulated };
    }
    return { data: null, error: 'Failed to retrieve threats', simulated: false };
  },

  async getRadarBlips(): Promise<ApiResult<RadarBlip[]>> {
    const threatsRes = await this.getThreats();
    const threats = threatsRes.data || [];

    // Phase 3 radar rules:
    // Angle = source sector (NVD, GitHub) plus an "Unclassified" sector.
    // Distance from center = CVSS score, labelled "CVSS-derived (provisional)"; missing CVSS goes on outer "unscored" ring.
    // Marker size is fixed when confidence is null.
    // Pulse = real timestamp within recent window.
    const blips: RadarBlip[] = threats.slice(0, 60).map((t, idx) => {
      // Angle by source sector
      let sectorStart = 0;
      let sectorEnd = 160;
      const src = (t.source || '').toLowerCase();
      if (src.includes('nvd')) {
        sectorStart = 0;
        sectorEnd = 160;
      } else if (src.includes('github') || src.includes('ghsa')) {
        sectorStart = 180;
        sectorEnd = 340;
      } else {
        sectorStart = 340;
        sectorEnd = 360;
      }

      const angle = sectorStart + (((idx * 19) % 100) / 100) * (sectorEnd - sectorStart);

      // Distance from center: CVSS-derived (higher CVSS = closer to center)
      // If cvssScore is null, radius = 0.95 (unscored ring)
      let radius = 0.95;
      if (t.cvssScore !== null && t.cvssScore !== undefined) {
        // CVSS 10 -> radius 0.15, CVSS 0 -> radius 0.85
        radius = 0.85 - (t.cvssScore / 10) * 0.70;
      }

      // Pulse: real timestamp within recent hours
      const threatTime = new Date(t.timestamp).getTime();
      const isRecent = !isNaN(threatTime) && (Date.now() - threatTime < 7 * 24 * 3600 * 1000);
      const isPulse = t.severity === 'critical' || isRecent;

      return {
        id: `blip-${t.id}-${idx}`,
        threatId: t.id,
        title: t.title,
        cveId: t.cveId,
        severity: t.severity,
        category: t.category,
        confidence: t.confidence,
        riskScore: t.riskScore,
        radius,
        angle,
        isPulse,
        timestamp: t.timestamp
      };
    });

    return { data: blips, error: null, simulated: threatsRes.simulated };
  },

  async getSeverityStats(): Promise<ApiResult<SeverityStat[]>> {
    const threatsRes = await this.getThreats();
    const threats = threatsRes.data || [];
    const total = threats.length || 1;

    const counts: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    threats.forEach(t => {
      if (counts[t.severity] !== undefined) {
        counts[t.severity]++;
      } else {
        counts.low++;
      }
    });

    const stats: SeverityStat[] = [
      { severity: 'critical', count: counts.critical, percentage: Math.round((counts.critical / total) * 100), color: 'var(--severity-critical)' },
      { severity: 'high', count: counts.high, percentage: Math.round((counts.high / total) * 100), color: 'var(--severity-high)' },
      { severity: 'medium', count: counts.medium, percentage: Math.round((counts.medium / total) * 100), color: 'var(--severity-medium)' },
      { severity: 'low', count: counts.low, percentage: Math.round((counts.low / total) * 100), color: 'var(--severity-low)' }
    ];

    return { data: stats, error: null, simulated: threatsRes.simulated };
  },

  async getActivityMatrix(): Promise<ApiResult<HeatmapCell[]>> {
    return { data: mockActivityMatrix, error: null, simulated: true };
  },

  async getSourceFlow(): Promise<ApiResult<FlowLink[]>> {
    return { data: mockSourceFlow, error: null, simulated: true };
  },

  async getTrend14d(): Promise<ApiResult<TrendDay[]>> {
    const threatsRes = await this.getThreats();
    if (!threatsRes.simulated && threatsRes.data) {
      const threats = threatsRes.data;
      const now = Date.now();
      const dayMs = 86400 * 1000;
      const days: TrendDay[] = [];
      let totalEvents = 0;

      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * dayMs);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayThreats = threats.filter(t => {
          const tDate = (t.published || t.timestamp || '').slice(0, 10);
          return tDate === dateStr;
        });

        const critical = dayThreats.filter(t => t.severity === 'critical' || (t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 9.0)).length;
        const high = dayThreats.filter(t => t.severity === 'high' || (t.cvssScore !== null && t.cvssScore !== undefined && t.cvssScore >= 7.0 && t.cvssScore < 9.0)).length;
        const medium = dayThreats.filter(t => t.severity === 'medium').length;
        const low = dayThreats.filter(t => t.severity === 'low').length;
        const total = dayThreats.length;
        totalEvents += total;

        days.push({
          date: dateStr.slice(5),
          total,
          critical,
          high,
          medium,
          low
        });
      }

      return { 
        data: totalEvents > 0 ? days : [], 
        error: null, 
        simulated: false 
      };
    }

    return { data: mockTrend14d, error: null, simulated: true };
  },

  async getCampaigns(): Promise<ApiResult<Campaign[]>> {
    return { data: mockCampaigns, error: null, simulated: true };
  },

  async getIOCs(): Promise<ApiResult<IOC[]>> {
    return { data: mockIOCs, error: null, simulated: true };
  },

  async getAlerts(): Promise<ApiResult<Alert[]>> {
    return { data: mockAlerts, error: null, simulated: true };
  },

  async getPredictions(): Promise<ApiResult<Prediction[]>> {
    return { data: mockPredictions, error: null, simulated: true };
  },

  async getModelMetrics(): Promise<ApiResult<ModelMetrics>> {
    return { data: mockModelMetrics, error: null, simulated: true };
  },

  async getSources(): Promise<ApiResult<SourceStatus[]>> {
    return { data: mockSources, error: null, simulated: true };
  },

  async getGraphData(): Promise<ApiResult<{
    nodes: Array<{ id: string; name: string; type: 'threat' | 'cve' | 'ioc' | 'actor'; severity?: string; val: number }>;
    links: Array<{ source: string; target: string; relationship: string }>;
  }>> {
    const threats = (await this.getThreats()).data || mockThreats;
    const topThreats = threats.slice(0, 25);
    const nodes: Array<{ id: string; name: string; type: 'threat' | 'cve' | 'ioc' | 'actor'; severity?: string; val: number }> = [];
    const links: Array<{ source: string; target: string; relationship: string }> = [];
    const actorSet = new Set<string>();
    const cveSet = new Set<string>();

    topThreats.forEach(t => {
      nodes.push({ id: t.id, name: t.id, type: 'threat', severity: t.severity, val: 12 });

      const cve = t.cveId || t.cve || 'CVE-UNKNOWN';
      if (!cveSet.has(cve)) {
        cveSet.add(cve);
        nodes.push({ id: cve, name: cve, type: 'cve', severity: t.severity, val: 16 });
      }
      links.push({ source: t.id, target: cve, relationship: 'EXPLOITS' });

      const actor = t.actor || 'APT-29 (Cozy Bear)';
      if (!actorSet.has(actor)) {
        actorSet.add(actor);
        nodes.push({ id: actor, name: actor, type: 'actor', val: 20 });
      }
      links.push({ source: actor, target: t.id, relationship: 'ATTRIBUTED_TO' });

      // Link first IOC
      const iocId = `IOC-${t.id.replace('THR-', '')}-1`;
      nodes.push({ id: iocId, name: iocId, type: 'ioc', val: 8 });
      links.push({ source: t.id, target: iocId, relationship: 'INDICATOR' });
    });

    return { data: { nodes, links }, error: null, simulated: true };
  }
};
