import { Threat } from '../types';

export interface InvestigationCase {
  id: string;
  title: string;
  threats: Threat[];
  notes: string[];
  status: 'Open' | 'Under Review' | 'Closed';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'cybernexus_investigation_cases';

function getInitialCases(): InvestigationCase[] {
  if (typeof window !== 'undefined') {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
  }

  return [
    {
      id: 'CASE-2026-001',
      title: 'Active Ivanti VPN Bypass & Lateral Movement',
      threats: [],
      notes: [
        'Ingested indicators from NVD and dark-web telemetry.',
        'Correlated CISA KEV publication with exploit script forks on GitHub.'
      ],
      status: 'Open',
      createdAt: '2026-11-19T14:00:00Z',
      updatedAt: '2026-11-20T10:30:00Z'
    },
    {
      id: 'CASE-2026-002',
      title: 'Midnight Blizzard Domain Escalation Incident',
      threats: [],
      notes: ['Credential spray activity observed against perimeter edge devices.'],
      status: 'Under Review',
      createdAt: '2026-11-18T09:20:00Z',
      updatedAt: '2026-11-20T11:00:00Z'
    }
  ];
}

let cases: InvestigationCase[] = getInitialCases();
const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  }
  listeners.forEach(fn => fn());
}

export const investigationStore = {
  getCases(): InvestigationCase[] {
    return [...cases];
  },

  addThreatToCase(caseId: string, threat: Threat): boolean {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return false;
    if (!targetCase.threats.some(t => t.id === threat.id)) {
      targetCase.threats.push(threat);
      targetCase.updatedAt = new Date().toISOString();
      notify();
      return true;
    }
    return false;
  },

  removeThreatFromCase(caseId: string, threatId: string): void {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;
    targetCase.threats = targetCase.threats.filter(t => t.id !== threatId);
    targetCase.updatedAt = new Date().toISOString();
    notify();
  },

  addNote(caseId: string, note: string): void {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;
    targetCase.notes.push(note);
    targetCase.updatedAt = new Date().toISOString();
    notify();
  },

  updateStatus(caseId: string, status: 'Open' | 'Under Review' | 'Closed'): void {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;
    targetCase.status = status;
    targetCase.updatedAt = new Date().toISOString();
    notify();
  },

  createNewCase(title: string): InvestigationCase {
    const newCase: InvestigationCase = {
      id: `CASE-2026-${String(cases.length + 1).padStart(3, '0')}`,
      title,
      threats: [],
      notes: ['Case initialized by analyst.'],
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    cases.unshift(newCase);
    notify();
    return newCase;
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
