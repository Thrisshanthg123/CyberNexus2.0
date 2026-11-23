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
import { cvssToRadius } from '../components/radar/useRadarLayout';

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
  collectedAt?: string;
  collected?: string;
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
    collectedAt: raw.collectedAt || raw.collected || null,
    mlClassification,
    confidence,
    riskScore,
    riskScoreProvisional: isProvisional,
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

const BACKOFF_STORAGE_KEY = 'cybernexus_api_backoff';
const BASE_BACKOFF_MS = 15000;
const MAX_BACKOFF_MS = 120000;

interface BackoffState {
  failures: number;
  nextRetryAt: number;
}

function getBackoffState(): BackoffState {
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(BACKOFF_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        failures: Number(parsed.failures) || 0,
        nextRetryAt: Number(parsed.nextRetryAt) || 0
      };
    }
  } catch {
    // ignore storage errors
  }
  return { failures: 0, nextRetryAt: 0 };
}

function recordApiFailure(): number {
  const prev = getBackoffState();
  const failures = prev.failures + 1;
  const delayMs = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, failures - 1));
  const nextRetryAt = Date.now() + delayMs;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(BACKOFF_STORAGE_KEY, JSON.stringify({ failures, nextRetryAt }));
    }
  } catch {
    // ignore storage errors
  }
  return delayMs;
}

function clearApiBackoff(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(BACKOFF_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function isInBackoffWindow(): boolean {
  const state = getBackoffState();
  return state.failures > 0 && Date.now() < state.nextRetryAt;
}

let inFlightHealth: Promise<{ status: string; service: string; online: boolean }> | null = null;
let inFlightThreats: Promise<ApiResult<Threat[]>> | null = null;

export const api = {
  resetBackoff(): void {
    clearApiBackoff();
  },

  getBackoffDelayMs(): number {
    const state = getBackoffState();
    if (state.failures === 0) return 30000;
    return Math.min(MAX_BACKOFF_MS, 30000 * Math.pow(2, state.failures));
  },

  async getHealth(): Promise<{ status: string; service: string; online: boolean }> {
    if (isInBackoffWindow()) {
      return { status: 'offline', service: 'CyberNexus API', online: false };
    }
    if (inFlightHealth) {
      return inFlightHealth;
    }

    inFlightHealth = (async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          clearApiBackoff();
          const data = await res.json();
          return { status: data.status || 'online', service: data.service || 'CyberNexus API', online: true };
        }
        recordApiFailure();
        return { status: 'offline', service: 'CyberNexus API', online: false };
      } catch {
        recordApiFailure();
        return { status: 'offline', service: 'CyberNexus API', online: false };
      } finally {
        inFlightHealth = null;
      }
    })();

    return inFlightHealth;
  },

  async getThreats(): Promise<ApiResult<Threat[]>> {
    if (!USE_MOCK) {
      if (isInBackoffWindow()) {
        return { data: mockThreats, error: null, simulated: true };
      }
      if (inFlightThreats) {
        return inFlightThreats;
      }

      inFlightThreats = (async () => {
        try {
          const res = await fetch('/api/threats');
          if (res.ok) {
            clearApiBackoff();
            const json = await res.json();
            const list: FlaskRawThreat[] = Array.isArray(json) ? json : (json.threats || []);
            const normalized = list.map((t, idx) => normalizeRawThreat(t, idx));
            return { data: normalized, error: null, simulated: false };
          }
          recordApiFailure();
        } catch {
          recordApiFailure();
        } finally {
          inFlightThreats = null;
        }
        return { data: mockThreats, error: null, simulated: true };
      })();

      return inFlightThreats;
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
      // Uses shared cvssToRadius so plotted positions align exactly with concentric ring radii
      const radius = cvssToRadius(t.cvssScore);

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
        riskScoreProvisional: t.riskScoreProvisional,
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

  async getTrend14d(by: 'collected' | 'published' = 'collected'): Promise<ApiResult<TrendDay[]>> {
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
        
        // Bucket strictly by collectedAt (when we ingested it), or published if explicitly selected
        const dayThreats = threats.filter(t => {
          const rawDate = by === 'collected' ? (t.collectedAt || null) : (t.published || t.timestamp || null);
          if (!rawDate) return false;
          return rawDate.slice(0, 10) === dateStr;
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
  },

  /**
   * Capture baseline count and latest timestamp from /api/threats for before/after timeout comparison.
   */
  async getThreatsSnapshot(sourceKey?: string): Promise<{ count: number; latestTimestamp: number; ok: boolean }> {
    try {
      const res = await fetch('/api/threats');
      if (!res.ok) return { count: 0, latestTimestamp: 0, ok: false };
      const list = await res.json();
      const records: FlaskRawThreat[] = Array.isArray(list) ? list : (list.threats || []);
      const filtered = sourceKey
        ? records.filter(r => (r.source || '').toLowerCase().includes(sourceKey.toLowerCase()))
        : records;
      let latestTimestamp = 0;
      filtered.forEach(r => {
        const rawTs = r.collectedAt || r.collected || r.timestamp || r.published || '';
        const parsed = rawTs ? new Date(rawTs).getTime() : 0;
        if (!isNaN(parsed) && parsed > latestTimestamp) {
          latestTimestamp = parsed;
        }
      });
      return { count: filtered.length, latestTimestamp, ok: true };
    } catch {
      return { count: 0, latestTimestamp: 0, ok: false };
    }
  },

  /**
   * Trigger telemetry collection from NVD backend collector endpoint (POST /api/collect/nvd).
   * Includes 90-second timeout (60-120s range) and compares /api/threats count & latest timestamp before and after on timeout.
   */
  async collectNvd(timeoutMs = 90000): Promise<{ success: boolean; unconfirmed?: boolean; count?: number; message?: string }> {
    const beforeSnap = await this.getThreatsSnapshot('nvd');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('/api/collect/nvd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`NVD collector returned HTTP ${res.status} (${res.statusText || 'Server Error'})`);
      }
      const data = await res.json();
      return { success: true, count: data.count || 0 };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const afterSnap = await this.getThreatsSnapshot('nvd');
        if (
          beforeSnap.ok &&
          afterSnap.ok &&
          (afterSnap.count > beforeSnap.count || afterSnap.latestTimestamp > beforeSnap.latestTimestamp)
        ) {
          const delta = Math.max(0, afterSnap.count - beforeSnap.count);
          return {
            success: true,
            count: delta,
            message: `NVD request reached ${timeoutMs / 1000}s timeout, but backend ingestion was confirmed (${delta} new records / updated timestamp).`
          };
        }
        return {
          success: false,
          unconfirmed: true,
          message: `Collection status unconfirmed: NVD request timed out after ${timeoutMs / 1000}s with no new record count or newer timestamp detected.`
        };
      }
      return { success: false, message: err?.message || 'NVD ingestion request failed (backend unreachable).' };
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Trigger telemetry collection from GitHub backend collector endpoint (POST /api/collect/github).
   * Includes 90-second timeout (60-120s range) and compares /api/threats count & latest timestamp before and after on timeout.
   */
  async collectGithub(timeoutMs = 90000): Promise<{ success: boolean; unconfirmed?: boolean; count?: number; message?: string }> {
    const beforeSnap = await this.getThreatsSnapshot('github');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch('/api/collect/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`GitHub collector returned HTTP ${res.status} (${res.statusText || 'Server Error'})`);
      }
      const data = await res.json();
      return { success: true, count: data.count || 0 };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const afterSnap = await this.getThreatsSnapshot('github');
        if (
          beforeSnap.ok &&
          afterSnap.ok &&
          (afterSnap.count > beforeSnap.count || afterSnap.latestTimestamp > beforeSnap.latestTimestamp)
        ) {
          const delta = Math.max(0, afterSnap.count - beforeSnap.count);
          return {
            success: true,
            count: delta,
            message: `GitHub request reached ${timeoutMs / 1000}s timeout, but backend ingestion was confirmed (${delta} new records / updated timestamp).`
          };
        }
        return {
          success: false,
          unconfirmed: true,
          message: `Collection status unconfirmed: GitHub request timed out after ${timeoutMs / 1000}s with no new record count or newer timestamp detected.`
        };
      }
      return { success: false, message: err?.message || 'GitHub ingestion request failed (backend unreachable).' };
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * Trigger telemetry collection from both live backend sources (/api/collect/nvd and /api/collect/github).
   * Aggregates counts and captures individual errors without failing the full sequence.
   */
  async triggerFullCollection(timeoutMs = 90000): Promise<{
    nvd: { success: boolean; unconfirmed?: boolean; count?: number; message?: string };
    github: { success: boolean; unconfirmed?: boolean; count?: number; message?: string };
    errors: string[];
    unconfirmed: boolean;
    totalCollected: number;
  }> {
    const [nvdRes, githubRes] = await Promise.allSettled([
      this.collectNvd(timeoutMs),
      this.collectGithub(timeoutMs)
    ]);

    const nvd = nvdRes.status === 'fulfilled' ? nvdRes.value : { success: false, message: 'NVD request rejected' };
    const github = githubRes.status === 'fulfilled' ? githubRes.value : { success: false, message: 'GitHub request rejected' };
    const errors: string[] = [];
    if (!nvd.success) errors.push(`NVD: ${nvd.message || 'Error'}`);
    if (!github.success) errors.push(`GitHub: ${github.message || 'Error'}`);
    const unconfirmed = Boolean(nvd.unconfirmed || github.unconfirmed);

    const totalCollected = (nvd.count || 0) + (github.count || 0);
    return { nvd, github, errors, unconfirmed, totalCollected };
  }
};
