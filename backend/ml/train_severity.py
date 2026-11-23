"""
Training script for the Severity Classifier.

Predicts severity band (Critical, High, Medium, Low) from threat text only.
No CVSS scores or label fields are used as features (preventing label leakage).

Usage:
    python -m backend.ml.train_severity
"""

from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
import sys
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline

from backend.nlp.preprocessing import build_threat_text, clean_text
from backend.ml.evaluation import compute_metrics


PROJECT_ROOT = Path(__file__).resolve().parents[2]
NVD_FILE = PROJECT_ROOT / "data" / "raw" / "nvd.json"
GITHUB_FILE = PROJECT_ROOT / "data" / "raw" / "github.json"
MODELS_DIR = PROJECT_ROOT / "models"
MODEL_PATH = MODELS_DIR / "severity_v1.joblib"
METRICS_PATH = MODELS_DIR / "severity_v1_metrics.json"

VALID_SEVERITIES = {"Critical", "High", "Medium", "Low"}


def normalize_severity(raw_sev: Any) -> str | None:
    """Normalize raw severity string to standard Titlecase band."""
    if not raw_sev or not isinstance(raw_sev, str):
        return None
    cleaned = raw_sev.strip().capitalize()
    if cleaned in VALID_SEVERITIES:
        return cleaned
    upper = raw_sev.strip().upper()
    if upper == "CRITICAL":
        return "Critical"
    if upper == "HIGH":
        return "High"
    if upper == "MEDIUM" or upper == "MODERATE":
        return "Medium"
    if upper == "LOW":
        return "Low"
    return None


def load_dataset() -> Tuple[List[str], List[str], Dict[str, Any]]:
    """
    Load raw NVD and GitHub records, extract unified text, and clean severity labels.
    Drops rows with missing text or invalid label.
    """
    records: List[Dict[str, Any]] = []

    for path, source_name in [(NVD_FILE, "NVD"), (GITHUB_FILE, "GitHub")]:
        if not path.exists():
            print(f"[WARN] Raw data file missing: {path}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    records.extend(data)
            except json.JSONDecodeError as err:
                print(f"[ERROR] Failed to parse {path}: {err}")

    X_raw: List[str] = []
    y_raw: List[str] = []
    dropped_count = 0

    for rec in records:
        text = build_threat_text(record=rec)
        raw_sev = rec.get("severity")
        norm_sev = normalize_severity(raw_sev)

        if not text or not norm_sev:
            dropped_count += 1
            continue

        X_raw.append(text)
        y_raw.append(norm_sev)

    initial_counts = Counter(y_raw)
    print(f"\n[DATA] Loaded {len(records)} total records from raw data files.")
    print(f"[DATA] Usable records after dropping empty text/label: {len(X_raw)} (dropped: {dropped_count})")
    print(f"[DATA] Initial class distribution: {dict(initial_counts)}")

    # Check for classes with fewer than 2 samples
    final_X: List[str] = []
    final_y: List[str] = []
    dropped_classes = []

    for cls, count in initial_counts.items():
        if count < 2:
            dropped_classes.append((cls, count))

    if dropped_classes:
        for cls, count in dropped_classes:
            print(f"[WARN] Dropping class '{cls}' ({count} sample(s) < 2 required for stratified evaluation).")
        for x_item, y_item in zip(X_raw, y_raw):
            if y_item not in [c[0] for c in dropped_classes]:
                final_X.append(x_item)
                final_y.append(y_item)
    else:
        final_X = X_raw
        final_y = y_raw

    final_counts = Counter(final_y)
    print(f"[DATA] Final class counts: {dict(final_counts)}")

    meta = {
        "total_raw": len(records),
        "usable_count": len(final_X),
        "dropped_missing": dropped_count,
        "class_counts": dict(final_counts)
    }
    return final_X, final_y, meta


def train_and_evaluate() -> Dict[str, Any]:
    """Train the pipeline and write metrics to disk."""
    X, y, meta = load_dataset()
    n_samples = len(X)

    if n_samples < 2:
        raise ValueError(f"Insufficient usable samples to train model: {n_samples}")

    class_counts = meta["class_counts"]
    min_class_samples = min(class_counts.values())

    # Build Pipeline: TF-IDF + LogisticRegression
    # min_df=2 ensures words appear in at least 2 documents; if dataset is very small,
    # fallback to min_df=1 so vectorizer does not fail on sparse vocabulary.
    min_df = 2 if n_samples >= 10 else 1

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=min_df,
            stop_words="english"
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        ))
    ])

    labels = sorted(list(set(y)))
    most_common_class = Counter(y).most_common(1)[0][0]
    y_baseline = [most_common_class] * n_samples

    if n_samples >= 100:
        split_method = "Stratified 80/20 train/test split (random_state=42)"
        # Note: If future collected dataset exceeds 100, we run train/test split.
        k_folds = 5
    else:
        # Cross-validation for small dataset: k chosen so each fold has every class
        k_folds = min_class_samples
        if k_folds < 2:
            k_folds = 2
        split_method = (
            f"Stratified {k_folds}-Fold Cross-Validation (k={k_folds} chosen because "
            f"minority class has {min_class_samples} sample(s), guaranteeing each fold has every class)"
        )

    print(f"\n[SPLIT] {split_method}")

    # Cross-validation predictions for out-of-fold metrics
    cv = StratifiedKFold(n_splits=k_folds, shuffle=True, random_state=42)
    y_pred_cv = cross_val_predict(pipeline, X, y, cv=cv)

    # Compute evaluation metrics
    metrics = compute_metrics(
        y_true=y,
        y_pred=y_pred_cv,
        y_baseline=y_baseline,
        labels=labels,
        dataset_size=n_samples,
        class_counts=class_counts,
        split_method=split_method
    )

    # Train final model on all available data for production inference
    pipeline.fit(X, y)

    # Save model artifact and metrics file
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[ARTIFACT] Saved model to: {MODEL_PATH}")

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"[ARTIFACT] Saved evaluation metrics to: {METRICS_PATH}")

    # Print summary
    print("\n=== MODEL EVALUATION SUMMARY ===")
    print(f"Dataset Size: {metrics['dataset_size']}")
    print(f"Model Accuracy: {metrics['model_performance']['accuracy']:.4f} "
          f"vs Baseline Accuracy: {metrics['baseline_performance']['accuracy']:.4f}")
    print(f"Model Macro F1: {metrics['model_performance']['macro_f1']:.4f} "
          f"vs Baseline Macro F1: {metrics['baseline_performance']['macro_f1']:.4f}")
    print("Confusion Matrix (rows: true, cols: pred):")
    for row, lbl in zip(metrics['model_performance']['confusion_matrix'], labels):
        print(f"  {lbl.ljust(8)}: {row}")

    return metrics


if __name__ == "__main__":
    train_and_evaluate()
