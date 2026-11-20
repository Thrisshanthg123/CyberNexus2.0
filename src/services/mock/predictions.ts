import { Prediction, ThreatCategory } from '../../types';
import { mockThreats } from './threats';

export function generateMockPredictions(): Prediction[] {
  const models = ['CyberBERT-v2.1', 'RoBERTa-ThreatClassifier', 'Ensemble-RF-XGBoost'];
  
  return mockThreats.slice(0, 40).map((t, i) => {
    return {
      id: `PRED-${String(i + 1).padStart(4, '0')}`,
      threatId: t.id,
      cveId: t.cveId,
      predictedCategory: t.category as ThreatCategory,
      confidence: Math.round(t.confidence * 0.95),
      model: models[i % models.length],
      timestamp: t.timestamp,
      features: {
        textLength: 120 + (i * 23) % 400,
        iocCount: 3 + (i % 5),
        keywordScore: Math.round((70 + (i * 7) % 28) * 10) / 10,
        sentimentScore: -0.4 - ((i % 5) * 0.1)
      }
    };
  });
}

export const mockPredictions = generateMockPredictions();
