import { ModelMetrics } from '../../types';

export const mockModelMetrics: ModelMetrics = {
  modelName: 'CyberBERT-ThreatNet (Multi-Task Classifier)',
  version: '0.4.0-experimental',
  evaluationNote: 'Values are preliminary benchmark placeholders until the formal cross-validation evaluation in the research paper is completed.',
  accuracy: 0.892,
  f1Score: 0.884,
  precision: 0.879,
  recall: 0.889,
  latencyP95Ms: 42,
  lastTrained: '2026-11-15T03:00:00Z',
  sampleCount: 14820
};
