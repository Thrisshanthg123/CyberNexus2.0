import { SourceStatus } from '../../types';

export const mockSources: SourceStatus[] = [
  {
    id: 'src-nvd',
    name: 'NVD',
    status: 'Active',
    eventCount: 42390,
    lastSync: '2026-11-20T11:45:00Z',
    latencyMs: 120,
    description: 'National Vulnerability Database 2.0 REST API sync and CVE enrichment pipeline.'
  },
  {
    id: 'src-github',
    name: 'GitHub',
    status: 'Active',
    eventCount: 18450,
    lastSync: '2026-11-20T11:30:00Z',
    latencyMs: 95,
    description: 'GitHub Security Advisories GraphQL feed, exploit PoC commits, and advisory database.'
  },
  {
    id: 'src-reddit',
    name: 'Reddit',
    status: 'Active',
    eventCount: 8920,
    lastSync: '2026-11-20T11:10:00Z',
    latencyMs: 310,
    description: 'Subreddit crawlers (r/netsec, r/cybersecurity) with NLP keyword extraction.'
  },
  {
    id: 'src-twitter',
    name: 'X/Twitter',
    status: 'Planned',
    eventCount: 0,
    lastSync: 'Never',
    latencyMs: 0,
    description: 'Planned enterprise streaming ingestion connector for security researcher microblogs and OSINT drops.'
  }
];
