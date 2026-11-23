"""
Evaluation module for Severity Classifier.

Computes accuracy, per-class precision, recall, F1, macro F1, and confusion matrix
for both the trained model and a naive baseline (most frequent class).
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Sequence
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support
)


def compute_metrics(
    y_true: Sequence[str],
    y_pred: Sequence[str],
    y_baseline: Sequence[str],
    labels: Sequence[str],
    dataset_size: int,
    class_counts: Dict[str, int],
    split_method: str
) -> Dict[str, Any]:
    """
    Compute comprehensive classification metrics comparing model to naive baseline.
    """
    # 1. Model metrics
    model_acc = float(accuracy_score(y_true, y_pred))
    p, r, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, zero_division=0
    )
    macro_f1 = float(np.mean(f1))
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    per_class_model: Dict[str, Dict[str, float]] = {}
    for i, lbl in enumerate(labels):
        per_class_model[lbl] = {
            "precision": round(float(p[i]), 4),
            "recall": round(float(r[i]), 4),
            "f1_score": round(float(f1[i]), 4),
            "support": int(support[i])
        }

    # 2. Naive Baseline metrics (predict most common class)
    base_acc = float(accuracy_score(y_true, y_baseline))
    bp, br, bf1, _ = precision_recall_fscore_support(
        y_true, y_baseline, labels=labels, zero_division=0
    )
    base_macro_f1 = float(np.mean(bf1))
    base_cm = confusion_matrix(y_true, y_baseline, labels=labels).tolist()

    return {
        "model_version": "severity_v1",
        "evaluation_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dataset_size": dataset_size,
        "class_counts": class_counts,
        "split_method": split_method,
        "labels": list(labels),
        "model_performance": {
            "accuracy": round(model_acc, 4),
            "macro_f1": round(macro_f1, 4),
            "per_class": per_class_model,
            "confusion_matrix": cm
        },
        "baseline_performance": {
            "description": "Naive majority-class baseline (always predicts most frequent class)",
            "accuracy": round(base_acc, 4),
            "macro_f1": round(base_macro_f1, 4),
            "confusion_matrix": base_cm
        },
        "interpretation_note": (
            "Model confidence is a statistical output of the classifier on the training distribution, "
            "not the probability that a threat is real. Dataset is small (N=15), requiring cross-validation."
        )
    }
