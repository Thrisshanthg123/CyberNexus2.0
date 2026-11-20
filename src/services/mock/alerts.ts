import { Alert } from '../../types';

export const mockAlerts: Alert[] = [
  {
    id: 'ALT-1092',
    title: 'Zero-Day Weaponization Alert: CVE-2024-3400',
    severity: 'critical',
    source: 'NVD',
    timestamp: '2026-11-20T11:42:00Z',
    read: false,
    threatId: 'THR-000003',
    message: 'Active in-the-wild exploitation confirmed by CISA KEV catalog update. Immediate perimeter mitigation required.'
  },
  {
    id: 'ALT-1091',
    title: 'Public PoC Published on GitHub',
    severity: 'high',
    source: 'GitHub',
    timestamp: '2026-11-20T10:15:00Z',
    read: false,
    threatId: 'THR-000007',
    message: 'Functional exploit repository detected with over 450 forks within 3 hours. Potential automated mass scanning.'
  },
  {
    id: 'ALT-1090',
    title: 'Underground Chatter on Dark Subreddit',
    severity: 'medium',
    source: 'Reddit',
    timestamp: '2026-11-20T08:30:00Z',
    read: true,
    threatId: 'THR-000014',
    message: 'Credential broker claiming access to Fortune 500 edge routers. Matching telemetry flagged for surveillance.'
  },
  {
    id: 'ALT-1089',
    title: 'New Ransomware Variant Telemetry Spike',
    severity: 'critical',
    source: 'NVD',
    timestamp: '2026-11-19T22:10:00Z',
    read: true,
    threatId: 'THR-000002',
    message: 'BlackCat payload signatures observed probing cloud object store endpoints across multiple regions.'
  },
  {
    id: 'ALT-1088',
    title: 'Feed Ingestion Degraded: Social Feeds',
    severity: 'low',
    source: 'X/Twitter',
    timestamp: '2026-11-19T16:00:00Z',
    read: true,
    message: 'Upstream connector rate-limited. Feed flagged as planned integration.'
  }
];
