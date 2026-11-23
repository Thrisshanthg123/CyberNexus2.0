"""
Text Preprocessing Module for Cyber Threat Intelligence.

Cleans and normalizes threat advisory titles, descriptions, and unstructured
text while strictly preserving candidate threat indicators (IPs, domains, hashes, CVEs).
"""

from __future__ import annotations

import html
import re
import unicodedata
from typing import Any, Mapping


def clean_text(text: str | None) -> str:
    """
    Clean and normalize threat intelligence text.

    Performs:
    1. Null / empty handling -> returns empty string
    2. Unicode normalization (NFKC)
    3. HTML entity unescaping (&amp; -> &, &lt; -> <, etc.)
    4. HTML / markup tag removal without altering indicator boundaries
    5. Whitespace collapsing and outer trimming

    Does NOT strip dots from IPs/domains, hyphens from CVEs, or case from indicators.
    """
    if text is None:
        return ""

    if not isinstance(text, str):
        text = str(text)

    # 1. Unicode normalization
    text = unicodedata.normalize("NFKC", text)

    # 2. HTML unescape
    text = html.unescape(text)

    # 3. Remove HTML/XML markup tags, replacing with a single space to avoid word merger
    text = re.sub(r"<[^>]+>", " ", text)

    # 4. Collapse multiple whitespace characters (including tabs and newlines) to single space
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def build_threat_text(
    title: str | None = None,
    description: str | None = None,
    record: Mapping[str, Any] | None = None
) -> str:
    """
    Build a unified threat intelligence text string from title and description.

    Can accept individual title and description strings, or a record dictionary.
    Returns cleaned, unified text suitable for feature extraction and classification.
    """
    if record is not None:
        if title is None:
            title = record.get("title") or record.get("summary") or ""
        if description is None:
            description = record.get("description") or record.get("details") or ""

    cleaned_title = clean_text(title)
    cleaned_desc = clean_text(description)

    if cleaned_title and cleaned_desc:
        # If the title does not end with punctuation, append a period before description
        if cleaned_title[-1] not in ".!?":
            return f"{cleaned_title}. {cleaned_desc}"
        return f"{cleaned_title} {cleaned_desc}"

    if cleaned_title:
        return cleaned_title

    return cleaned_desc
