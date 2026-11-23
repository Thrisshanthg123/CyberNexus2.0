"""
Severity Classifier Inference Module.

DISCLAIMER & HONESTY RULE:
Model confidence is a statistical output of the classifier on the training distribution,
NOT the probability that a real-world threat exists or is malicious.
The model predicts the severity band (Critical, High, Medium, Low) from threat text only.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np

from backend.nlp.preprocessing import clean_text


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "models" / "severity_v1.joblib"

_cached_model: Any = None
_cached_model_path: Optional[Path] = None


def load_model(model_path: Path | str | None = None) -> Any:
    """
    Load and cache the trained Pipeline model from disk.
    Returns None gracefully if the model file is missing or invalid.
    """
    global _cached_model, _cached_model_path

    target_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH

    if not target_path.exists():
        return None

    if _cached_model is not None and _cached_model_path == target_path:
        return _cached_model

    try:
        model = joblib.load(target_path)
        _cached_model = model
        _cached_model_path = target_path
        return model
    except Exception as err:
        print(f"[WARN] Failed to load model from {target_path}: {err}")
        return None


def get_top_features(
    model: Any,
    text: str,
    predicted_label: str,
    top_k: int = 5
) -> List[str]:
    """
    Extract the top words in the input text that contributed most
    to the predicted severity classification.
    """
    try:
        tfidf = model.named_steps["tfidf"]
        clf = model.named_steps["clf"]

        feature_names = np.array(tfidf.get_feature_names_out())
        vec = tfidf.transform([text])

        # Indices of non-zero features in this input text
        nonzero_indices = vec.nonzero()[1]
        if len(nonzero_indices) == 0:
            return []

        classes = list(clf.classes_)
        class_idx = classes.index(predicted_label)

        # Handle binary vs multiclass logistic regression coefficients
        if len(classes) == 2:
            # In binary classification, clf.coef_ has shape (1, n_features)
            # Row 0 represents class index 1; reverse sign for class index 0
            base_coefs = clf.coef_[0]
            if class_idx == 0:
                coefs = -base_coefs
            else:
                coefs = base_coefs
        else:
            coefs = clf.coef_[class_idx]

        # Score is TF-IDF weight * class coefficient
        scores = []
        for idx in nonzero_indices:
            tfidf_weight = vec[0, idx]
            score = tfidf_weight * coefs[idx]
            scores.append((score, feature_names[idx]))

        # Sort descending by score
        scores.sort(key=lambda item: item[0], reverse=True)
        return [word for _, word in scores[:top_k]]
    except Exception:
        return []


def predict(
    text: str | None,
    model_path: Path | str | None = None
) -> Dict[str, Any] | None:
    """
    Predict the severity band from threat text.

    Args:
        text: Unstructured threat title/description string.
        model_path: Optional custom path to model artifact (defaults to models/severity_v1.joblib).

    Returns:
        Dict with keys:
            - label: str (e.g. 'High', 'Medium', 'Critical', 'Low')
            - confidence: float (0.0 to 1.0)
            - modelVersion: 'severity_v1'
            - topFeatures: List[str] (up to top 5 contributing words)
        Returns None gracefully if the model file is missing or text cannot be processed.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return None

    model = load_model(model_path)
    if model is None:
        return None

    try:
        clf = model.named_steps["clf"]
        tfidf = model.named_steps["tfidf"]

        vec = tfidf.transform([cleaned])
        pred_label = str(clf.predict(vec)[0])

        if hasattr(clf, "predict_proba"):
            probs = clf.predict_proba(vec)[0]
            classes = list(clf.classes_)
            class_idx = classes.index(pred_label)
            confidence = round(float(probs[class_idx]), 4)
        else:
            confidence = 1.0

        # Bound confidence between 0.0 and 1.0
        confidence = max(0.0, min(1.0, confidence))

        top_features = get_top_features(model, cleaned, pred_label, top_k=5)

        return {
            "label": pred_label,
            "confidence": confidence,
            "modelVersion": "severity_v1",
            "topFeatures": top_features
        }
    except Exception as err:
        print(f"[WARN] Prediction failed: {err}")
        return None
