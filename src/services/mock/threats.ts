import { Threat, ThreatCategory, ThreatSource, Severity } from '../../types';
import { createRNG } from './rng';

const rng = createRNG(424242);

const categories: ThreatCategory[] = [
  'Zero-Day',
  'Ransomware',
  'Data Exfiltration',
  'Supply Chain',
  'Phishing',
  'Botnet',
  'Privilege Escalation'
];

const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
const sources: ThreatSource[] = ['NVD', 'GitHub', 'Reddit', 'X/Twitter'];

const actors = [
  'APT28 (Fancy Bear)',
  'APT29 (Cozy Bear)',
  'Volt Typhoon',
  'Lazarus Group',
  'LockBit Supporter Group',
  'Sandworm',
  'FIN7',
  'Scattered Spider',
  'Midnight Blizzard',
  'BlackCat / ALPHV',
  'Unknown Adversary',
  'CL0P Ransomware Gang'
];

const vendorsAndProducts = [
  { vendor: 'Ivanti', product: 'Connect Secure VPN', cvePrefix: 'CVE-2024-21887', ttp: 'T1190 Exploit Public-Facing Application' },
  { vendor: 'Fortinet', product: 'FortiOS SSL-VPN', cvePrefix: 'CVE-2024-21762', ttp: 'T1059 Command and Scripting Interpreter' },
  { vendor: 'Palo Alto Networks', product: 'PAN-OS GlobalProtect', cvePrefix: 'CVE-2024-3400', ttp: 'T1068 Exploitation for Privilege Escalation' },
  { vendor: 'Microsoft', product: 'Windows Kernel', cvePrefix: 'CVE-2024-30078', ttp: 'T1550.002 Pass the Hash' },
  { vendor: 'Apache', product: 'ActiveMQ Broker', cvePrefix: 'CVE-2023-46604', ttp: 'T1203 Exploitation for Client Execution' },
  { vendor: 'Cisco', product: 'IOS XE Web UI', cvePrefix: 'CVE-2023-20198', ttp: 'T1078 Valid Accounts' },
  { vendor: 'Linux Kernel', product: 'Netfilter Subsystem', cvePrefix: 'CVE-2024-1086', ttp: 'T1068 Exploitation for Privilege Escalation' },
  { vendor: 'Atlassian', product: 'Confluence Data Center', cvePrefix: 'CVE-2023-22518', ttp: 'T1190 Exploit Public-Facing Application' },
  { vendor: 'VMware', product: 'vCenter Server', cvePrefix: 'CVE-2024-37085', ttp: 'T1078.002 Domain Accounts' },
  { vendor: 'GitLab', product: 'Community and Enterprise Edition', cvePrefix: 'CVE-2024-0402', ttp: 'T1059.001 PowerShell' },
  { vendor: 'F5', product: 'BIG-IP Configuration Utility', cvePrefix: 'CVE-2023-46747', ttp: 'T1190 Exploit Public-Facing Application' },
  { vendor: 'Juniper Networks', product: 'Junos OS SRX Series', cvePrefix: 'CVE-2024-21591', ttp: 'T1210 Exploitation of Remote Services' }
];

const mitigations = [
  'Apply official emergency patch or hotfix immediately. Restrict administrative access to VPN/management ports.',
  'Implement ingress filtering at firewall perimeter; verify integrity of system binaries via SHA256 checksums.',
  'Rotate service account credentials, disable insecure SSL/TLS ciphers, and isolate impacted VLAN segments.',
  'Enable strict MFA enforcement across all external ingress points and monitor endpoint telemetry for unusual process spawns.',
  'Deploy custom Suricata/Snort signatures for exploit payloads; terminate active unauthenticated sessions.',
  'Revert vulnerable package to signed release build; enforce immutable infrastructure container policies.'
];

export function generateMockThreats(): Threat[] {
  const threats: Threat[] = [];
  const baseDate = new Date('2026-11-20T12:00:00Z').getTime();

  for (let i = 1; i <= 135; i++) {
    const padId = String(i).padStart(6, '0');
    const id = `THR-${padId}`;
    const vp = vendorsAndProducts[i % vendorsAndProducts.length];
    const category = categories[Math.floor(rng() * categories.length)];
    const severity = i <= 22 ? 'critical' : severities[Math.floor(rng() * severities.length)];
    const source = sources[Math.floor(rng() * sources.length)];
    const actor = actors[Math.floor(rng() * actors.length)];
    const cveYear = 2024 + (i % 2);
    const cveNum = 1000 + (i * 37) % 8999;
    const cveId = `CVE-${cveYear}-${cveNum}`;
    
    // Time dispersed over last 14 days
    const hoursAgo = Math.floor(rng() * (14 * 24));
    const timestamp = new Date(baseDate - hoursAgo * 3600 * 1000).toISOString();
    
    const confidence = Math.floor(65 + rng() * 34); // 65% to 99%
    const status = (['active', 'investigating', 'mitigated', 'archived'] as const)[Math.floor(rng() * 4)];

    threats.push({
      id,
      cveId,
      title: `${vp.vendor} ${vp.product} Remote Code Execution & ${category}`,
      description: `Discovered active exploitation in the wild targeting ${vp.vendor} ${vp.product}. Attackers leverage weaponized payloads matching ${vp.ttp} to bypass authentication controls and achieve initial access. Observed correlation across multiple intelligence feeds.`,
      severity,
      category,
      source,
      status,
      timestamp,
      confidence,
      affectedSystems: [
        `${vp.vendor} ${vp.product} v4.2 - v5.8`,
        'Enterprise Edge Gateways',
        'Cloud VPC Gateways'
      ],
      iocs: [
        `IOC-${padId}-1`,
        `IOC-${padId}-2`,
        `IOC-${padId}-3`
      ],
      ttp: vp.ttp,
      tags: ['CISA-KEV', 'Exploited-Wild', 'Zero-Day', vp.vendor.toLowerCase()],
      actor,
      mitigation: mitigations[i % mitigations.length],
      isSimulated: true
    });
  }

  return threats;
}

export const mockThreats = generateMockThreats();
