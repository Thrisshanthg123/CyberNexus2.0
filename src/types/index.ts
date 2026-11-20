export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ThreatCategory = 
  | 'Ransomware'
  | 'Zero-Day'
  | 'Data Exfiltration'
  | 'Supply Chain'
  | 'Phishing'
  | 'Botnet'
  | 'Privilege Escalation';

export type ThreatSource = 'NVD' | 'GitHub' | 'Reddit' | 'X/Twitter';

export interface Threat {
  id: string; // THR-XXXXXX (e.g. THR-004217)
  cveId: string; // CVE-2024-XXXX or CVE-2025-XXXX
  title: string;
  description: string;
  severity: Severity;
  category: ThreatCategory;
  source: ThreatSource;
  status: 'active' | 'investigating' | 'mitigated' | 'archived';
  timestamp: string; // ISO 8601
  confidence: number; // 0 to 100
  affectedSystems: string[];
  iocs: string[]; // List of IOC IDs
  ttp: string; // MITRE ATT&CK technique (e.g. T1059.001)
  tags: string[];
  actor: string;
  mitigation: string;
  isSimulated?: boolean;
}

export interface RadarBlip {
  id: string;
  threatId: string;
  title: string;
  cveId: string;
  severity: Severity;
  category: ThreatCategory;
  confidence: number;
  radius: number; // 0 to 1 (normalized distance from center based on severity)
  angle: number; // 0 to 360 deg based on category
  isPulse: boolean; // Pulsing for critical blips
  timestamp: string;
}

export interface SeverityStat {
  severity: Severity;
  count: number;
  percentage: number;
  color: string;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface Campaign {
  id: string;
  name: string;
  actor: string;
  threatIds: string[];
  status: 'Active' | 'Dormant' | 'Mitigated';
  firstSeen: string;
  lastSeen: string;
  targetSectors: string[];
  ttps: string[];
  severity: Severity;
}

export interface IOC {
  id: string;
  threatId: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'cve';
  value: string;
  defangedValue: string;
  reputation: 'Malicious' | 'Suspicious' | 'Unknown' | 'Clean';
  firstSeen: string;
  lastSeen: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  source: ThreatSource;
  timestamp: string;
  read: boolean;
  threatId?: string;
  message: string;
}

export interface Prediction {
  id: string;
  threatId: string;
  cveId: string;
  predictedCategory: ThreatCategory;
  confidence: number;
  model: string;
  timestamp: string;
  features: {
    textLength: number;
    iocCount: number;
    keywordScore: number;
    sentimentScore: number;
  };
}

export interface SourceStatus {
  id: string;
  name: ThreatSource;
  status: 'Active' | 'Degraded' | 'Planned';
  eventCount: number;
  lastSync: string;
  latencyMs: number;
  description: string;
}

export interface ModelMetrics {
  modelName: string;
  version: string;
  evaluationNote: string;
  accuracy: number;
  f1Score: number;
  precision: number;
  recall: number;
  latencyP95Ms: number;
  lastTrained: string;
  sampleCount: number;
}

export interface ApiResult<T> {
  data: T;
  error?: string | null;
  simulated: boolean;
}
