import { IOC } from '../../types';
import { mockThreats } from './threats';

export function generateMockIOCs(): IOC[] {
  const iocs: IOC[] = [];

  mockThreats.forEach((t, i) => {
    const pad = String(i + 1).padStart(6, '0');
    
    // IP IOC
    const ipLast = 10 + (i * 7) % 240;
    const ipVal = `194.26.29.${ipLast}`;
    iocs.push({
      id: `IOC-${pad}-1`,
      threatId: t.id,
      type: 'ip',
      value: ipVal,
      defangedValue: `194[.]26[.]29[.]${ipLast}`,
      reputation: t.severity === 'critical' || t.severity === 'high' ? 'Malicious' : 'Suspicious',
      firstSeen: t.timestamp,
      lastSeen: new Date().toISOString()
    });

    // Domain / URL IOC
    const domName = `c2-gateway-${(i % 12) + 1}.dark-infra.org`;
    iocs.push({
      id: `IOC-${pad}-2`,
      threatId: t.id,
      type: 'domain',
      value: domName,
      defangedValue: domName.replace('.', '[.]'),
      reputation: 'Malicious',
      firstSeen: t.timestamp,
      lastSeen: new Date().toISOString()
    });

    // Hash IOC (SHA256)
    const hash = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
      .split('')
      .reverse()
      .join('')
      .slice(0, 64);
    iocs.push({
      id: `IOC-${pad}-3`,
      threatId: t.id,
      type: 'hash',
      value: hash,
      defangedValue: hash,
      reputation: 'Malicious',
      firstSeen: t.timestamp,
      lastSeen: new Date().toISOString()
    });
  });

  return iocs;
}

export const mockIOCs = generateMockIOCs();
