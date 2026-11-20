import { Campaign } from '../../types';

export const mockCampaigns: Campaign[] = [
  {
    id: 'CMP-2024-01',
    name: 'Operation Arctic Fog',
    actor: 'Midnight Blizzard (APT29)',
    threatIds: ['THR-000001', 'THR-000004', 'THR-000012', 'THR-000028'],
    status: 'Active',
    firstSeen: '2026-10-14T08:30:00Z',
    lastSeen: '2026-11-20T11:15:00Z',
    targetSectors: ['Government', 'Defense', 'Cloud Service Providers'],
    ttps: ['T1078 Valid Accounts', 'T1190 Exploit Public-Facing Application', 'T1550.002 Pass the Hash'],
    severity: 'critical'
  },
  {
    id: 'CMP-2024-02',
    name: 'Volt Substation Sabotage',
    actor: 'Volt Typhoon',
    threatIds: ['THR-000002', 'THR-000006', 'THR-000018', 'THR-000045'],
    status: 'Active',
    firstSeen: '2026-09-02T14:20:00Z',
    lastSeen: '2026-11-19T18:40:00Z',
    targetSectors: ['Critical Infrastructure', 'Energy', 'Telecommunications'],
    ttps: ['T1059 Command Scripting', 'T1068 Privilege Escalation', 'T1078.002 Domain Accounts'],
    severity: 'critical'
  },
  {
    id: 'CMP-2024-03',
    name: 'BlackCat FinDrain Surge',
    actor: 'BlackCat / ALPHV',
    threatIds: ['THR-000003', 'THR-000008', 'THR-000022'],
    status: 'Active',
    firstSeen: '2026-11-01T04:12:00Z',
    lastSeen: '2026-11-20T09:05:00Z',
    targetSectors: ['Healthcare', 'Financial Services', 'Retail'],
    ttps: ['T1486 Data Encrypted for Impact', 'T1567 Exfiltration Over Web Service'],
    severity: 'high'
  },
  {
    id: 'CMP-2024-04',
    name: 'Phantom Lure Phishnet',
    actor: 'Scattered Spider',
    threatIds: ['THR-000005', 'THR-000015', 'THR-000032'],
    status: 'Dormant',
    firstSeen: '2026-08-15T10:00:00Z',
    lastSeen: '2026-11-05T12:00:00Z',
    targetSectors: ['Hospitality', 'Gaming', 'Financial Exchanges'],
    ttps: ['T1566 Phishing', 'T1621 Multi-Factor Authentication Request Generation'],
    severity: 'medium'
  },
  {
    id: 'CMP-2024-05',
    name: 'Kite Runner Supply Chain',
    actor: 'Lazarus Group',
    threatIds: ['THR-000007', 'THR-000019', 'THR-000039'],
    status: 'Mitigated',
    firstSeen: '2026-07-20T06:00:00Z',
    lastSeen: '2026-10-30T17:30:00Z',
    targetSectors: ['Cryptocurrency', 'Software Development', 'Fintech'],
    ttps: ['T1195 Supply Chain Compromise', 'T1059.001 PowerShell'],
    severity: 'high'
  }
];
