import { FlowLink } from '../../types';

export function getSourceFlowData(): FlowLink[] {
  return [
    // Ingestion from sources to categories
    { source: 'NVD', target: 'Zero-Day', value: 34, color: 'var(--accent-blue)' },
    { source: 'NVD', target: 'Privilege Escalation', value: 28, color: 'var(--accent-blue)' },
    { source: 'GitHub', target: 'Supply Chain', value: 31, color: 'var(--accent-cyan)' },
    { source: 'GitHub', target: 'Zero-Day', value: 19, color: 'var(--accent-cyan)' },
    { source: 'Reddit', target: 'Ransomware', value: 22, color: 'var(--accent-green)' },
    { source: 'Reddit', target: 'Phishing', value: 16, color: 'var(--accent-green)' },
    { source: 'X/Twitter (Planned)', target: 'Botnet', value: 8, color: 'var(--color-text-muted)' },
    { source: 'X/Twitter (Planned)', target: 'Ransomware', value: 6, color: 'var(--color-text-muted)' },

    // Categories to Severity aggregation
    { source: 'Zero-Day', target: 'Critical Impact', value: 38, color: 'var(--severity-critical)' },
    { source: 'Zero-Day', target: 'High Impact', value: 15, color: 'var(--severity-high)' },
    { source: 'Ransomware', target: 'Critical Impact', value: 20, color: 'var(--severity-critical)' },
    { source: 'Ransomware', target: 'High Impact', value: 8, color: 'var(--severity-high)' },
    { source: 'Supply Chain', target: 'High Impact', value: 24, color: 'var(--severity-high)' },
    { source: 'Supply Chain', target: 'Medium Impact', value: 7, color: 'var(--severity-medium)' },
    { source: 'Privilege Escalation', target: 'High Impact', value: 18, color: 'var(--severity-high)' },
    { source: 'Privilege Escalation', target: 'Medium Impact', value: 10, color: 'var(--severity-medium)' },
    { source: 'Phishing', target: 'Medium Impact', value: 12, color: 'var(--severity-medium)' },
    { source: 'Phishing', target: 'Low Impact', value: 4, color: 'var(--severity-low)' },
    { source: 'Botnet', target: 'Medium Impact', value: 9, color: 'var(--severity-medium)' },
    { source: 'Botnet', target: 'Low Impact', value: 5, color: 'var(--severity-low)' }
  ];
}

export const mockSourceFlow = getSourceFlowData();
