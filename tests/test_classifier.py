"""
Unit tests for Severity Classifier (backend/ml/classifier.py).

Verifies:
1. Expected keys in prediction output (label, confidence, modelVersion, topFeatures)
2. Confidence is a valid float bounded between 0.0 and 1.0
3. Top features is a list of strings
4. Graceful handling (returns None) when model file is missing
5. Graceful handling (returns None) for empty or None text
"""

from pathlib import Path
import pytest

from backend.ml.classifier import predict, load_model


def test_predict_expected_keys():
    text = (
        "Critical remote code execution vulnerability in Sendmail daemon allows "
        "attackers to execute arbitrary commands as root via buffer overflow."
    )
    res = predict(text)
    assert res is not None, "Predict returned None on valid input"
    assert "label" in res
    assert "confidence" in res
    assert "modelVersion" in res
    assert "topFeatures" in res
    assert res["modelVersion"] == "severity_v1"
    assert isinstance(res["label"], str)
    assert res["label"] in {"Critical", "High", "Medium", "Low"}


def test_predict_confidence_bounds():
    text = "Vulnerability in Obot server-side request forgery via remote endpoint."
    res = predict(text)
    assert res is not None
    assert isinstance(res["confidence"], float)
    assert 0.0 <= res["confidence"] <= 1.0


def test_predict_top_features_structure():
    text = "Buffer overflow in sendmail debug command."
    res = predict(text)
    assert res is not None
    assert isinstance(res["topFeatures"], list)
    assert len(res["topFeatures"]) <= 5
    for feat in res["topFeatures"]:
        assert isinstance(feat, str)


def test_predict_missing_model_returns_none():
    non_existent = Path("models/non_existent_model_12345.joblib")
    res = predict("Test advisory text", model_path=non_existent)
    assert res is None, "Expected None when model file is missing"


def test_predict_empty_and_none_text():
    assert predict("") is None
    assert predict("   ") is None
    assert predict(None) is None
