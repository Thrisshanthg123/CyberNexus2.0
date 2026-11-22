export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ThreatCategory = 
  | 'Ransomware'
  | 'Zero-Day'
  | 'Data Exfiltration'
  | 'Supply Chain'
  | 'Phishing'
  | 'Botnet'
  | 'Privilege Escalation'
  | 'Vulnerability-Disclosure'
  | 'Exploit-in-Wild';

export type ThreatSource = 'NVD' | 'GitHub' | 'Reddit' | 'X/Twitter';

export interface Threat {
  id: string; // THR-XXXXXX or string ID
  cveId: string; // CVE-XXXX-XXXX
  cve?: string; // Alias for cveId matching Flask contract
  title: string;
  description: string;
  severity: Severity;
  category: ThreatCategory | string;
  source: ThreatSource | string;
  status: string;
  timestamp: string; // ISO 8601
  published?: string;
  lastModified?: string;
  collectedAt?: string | null; // When ingested into CyberNexus
  // Field requirements from Condition 1:
  // Fields the API doesn't return stay null and render as "Not yet analysed".
  mlClassification: string | null;
  confidence: number | null; // null if unanalysed
  riskScore: number | null; // null if unanalysed
  cvssScore?: number | null;
  isProvisionalScore?: boolean; // Set true when derived from CVSS
  iocs: string[] | null; // null if unextracted
  affectedSystems?: string[];
  ttp?: string | null; // MITRE ATT&CK technique
  tags?: string[];
  actor?: string | null;
  mitigation?: string | null;
  isSimulated?: boolean;
}

export interface RadarBlip {
  id: string;
  threatId: string;
  title: string;
  cveId: string;
  severity: Severity;
  category: ThreatCategory | string;
  confidence: number | null;
  riskScore: number | null;
  radius: number; // 0 to 1 (normalized distance from center based on risk)
  angle: number; // 0 to 360 deg based on category sector
  isPulse: boolean; // Pulsing for recent detections
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
  source: ThreatSource | string;
  timestamp: string;
  read: boolean;
  threatId?: string;
  message: string;
}

export interface Prediction {
  id: string;
  threatId: string;
  cveId: string;
  predictedCategory: ThreatCategory | string;
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
  name: ThreatSource | string;
  status: 'Active' | 'Degraded' | 'Planned';
  eventCount: number;
  lastSync: string;
  latencyMs: number;
  description: string;
  isPlanned?: boolean;
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
