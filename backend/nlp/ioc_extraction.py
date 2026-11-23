"""
Candidate IOC (Indicators of Compromise) Extraction Module.

DISCLAIMER & HONESTY RULE:
Extracted indicators are 'candidate indicators' discovered via pattern matching
and syntactic validation. They are NOT confirmed malicious threats or attribution proof.
No attribution, malicious intent, or active compromise is claimed.
"""

from __future__ import annotations

import ipaddress
import re
from typing import Any, Dict, List, Set


# Conservative list of recognized top-level domains for threat intel context
CONSERVATIVE_TLDS: Set[str] = {
    "com", "org", "net", "edu", "gov", "mil", "int",
    "io", "co", "ai", "app", "dev", "info", "biz", "xyz",
    "uk", "de", "jp", "fr", "au", "ca", "ru", "cn", "ch",
    "nl", "se", "no", "es", "it", "eu"
}

# Common file extensions and non-domain tokens to exclude
EXCLUDED_EXTENSIONS: Set[str] = {
    "md", "py", "json", "js", "ts", "html", "htm", "css", "txt", "csv",
    "png", "jpg", "jpeg", "gif", "svg", "pdf", "doc", "docx", "sh", "bash",
    "yml", "yaml", "xml", "tar", "gz", "zip", "rar", "7z", "exe", "dll",
    "so", "bin", "cfg", "conf", "ini", "log", "lock", "rst"
}


def refang(text: str) -> str:
    """
    Refang common defanged indicators in text.
    Handles hxxp/hxxps, [.], (.), {.}, and [:] / (:).
    """
    if not text:
        return ""

    # Refang protocols
    text = re.sub(r"(?i)\bhxxps://", "https://", text)
    text = re.sub(r"(?i)\bhxxp://", "http://", text)

    # Refang dots and colons
    text = re.sub(r"\[\.\]|\(\.\)|\{\.\}", ".", text)
    text = re.sub(r"\[:\]|\(:\)", ":", text)

    return text


def is_valid_ipv4(ip_str: str) -> bool:
    """Validate whether a string is a legitimate IPv4 address."""
    try:
        ipaddress.IPv4Address(ip_str)
        return True
    except (ipaddress.AddressValueError, ValueError):
        return False


def is_private_or_reserved_ip(ip_str: str) -> bool:
    """Check if an IPv4 address is in a private, loopback, or reserved range."""
    try:
        addr = ipaddress.IPv4Address(ip_str)
        return (
            addr.is_private
            or addr.is_reserved
            or addr.is_loopback
            or addr.is_link_local
            or addr.is_multicast
        )
    except (ipaddress.AddressValueError, ValueError):
        return False


def extract_cves(text: str) -> List[str]:
    """Extract, uppercase, de-duplicate, and sort candidate CVE identifiers."""
    pattern = r"(?i)\bCVE-\d{4}-\d{4,7}\b"
    matches = re.findall(pattern, text)
    return sorted(list({m.upper() for m in matches}))


def extract_ips(text: str) -> Dict[str, List[str]]:
    """
    Extract and validate candidate IPv4 addresses.
    Rejects invalid octets (e.g. 999.1.1.1).
    Returns dictionary with all valid 'ips' and marked 'private_ips'.
    """
    pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    candidates = re.findall(pattern, text)

    valid_ips: Set[str] = set()
    private_ips: Set[str] = set()

    for cand in candidates:
        if is_valid_ipv4(cand):
            valid_ips.add(cand)
            if is_private_or_reserved_ip(cand):
                private_ips.add(cand)

    return {
        "ips": sorted(list(valid_ips)),
        "private_ips": sorted(list(private_ips))
    }


def extract_domains(text: str) -> List[str]:
    """
    Extract candidate domains using a conservative TLD list.
    Excludes file names (e.g. readme.md), version numbers, and purely numeric hosts.
    """
    # Remove protocol prefix if present
    cleaned = re.sub(r"(?i)https?://", " ", text)
    # Remove email user prefixes
    cleaned = re.sub(r"\b[A-Za-z0-9._%+-]+@", " ", cleaned)

    pattern = r"\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,24}\b"
    candidates = re.findall(pattern, cleaned)

    valid_domains: Set[str] = set()

    for cand in candidates:
        cand_lower = cand.lower().strip(".")
        parts = cand_lower.split(".")

        if len(parts) < 2:
            continue

        tld = parts[-1]
        second_level = parts[-2]

        # Must have a recognized conservative TLD
        if tld not in CONSERVATIVE_TLDS:
            continue

        # Reject file names like readme.md, setup.py
        if tld in EXCLUDED_EXTENSIONS or second_level in {"readme", "setup", "package", "index", "test"}:
            continue

        # Reject version strings (e.g. v1.2.com is questionable, but purely numeric prefixes like 1.2.3.com)
        # Ensure at least one non-TLD label contains an alphabetic character
        has_alpha_label = any(bool(re.search(r"[a-z]", part)) for part in parts[:-1])
        if not has_alpha_label:
            continue

        # Reject if second level label starts or ends with hyphen
        if second_level.startswith("-") or second_level.endswith("-"):
            continue

        valid_domains.add(cand_lower)

    return sorted(list(valid_domains))


def extract_hashes(text: str) -> Dict[str, List[str]]:
    """
    Extract candidate cryptographic hashes by exact hex length.
    Labelled as md5 (32 hex), sha1 (40 hex), and sha256 (64 hex).
    """
    md5_pattern = r"(?<![a-fA-F0-9])[a-fA-F0-9]{32}(?![a-fA-F0-9])"
    sha1_pattern = r"(?<![a-fA-F0-9])[a-fA-F0-9]{40}(?![a-fA-F0-9])"
    sha256_pattern = r"(?<![a-fA-F0-9])[a-fA-F0-9]{64}(?![a-fA-F0-9])"

    md5_matches = set(m.lower() for m in re.findall(md5_pattern, text))
    sha1_matches = set(m.lower() for m in re.findall(sha1_pattern, text))
    sha256_matches = set(m.lower() for m in re.findall(sha256_pattern, text))

    return {
        "md5": sorted(list(md5_matches)),
        "sha1": sorted(list(sha1_matches)),
        "sha256": sorted(list(sha256_matches))
    }


def extract_iocs(text: str | None) -> Dict[str, Any]:
    """
    Extract candidate indicators of compromise from text.

    Returns:
        dict:
            - cves: List[str] (uppercased, sorted, unique)
            - ips: List[str] (valid IPv4, sorted, unique)
            - private_ips: List[str] (marked subset of private/reserved IPs)
            - domains: List[str] (conservative TLD, lowercased, unique)
            - hashes: Dict[str, List[str]] with keys 'md5', 'sha1', 'sha256'
    """
    empty_result = {
        "cves": [],
        "ips": [],
        "private_ips": [],
        "domains": [],
        "hashes": {
            "md5": [],
            "sha1": [],
            "sha256": []
        }
    }

    if not text:
        return empty_result

    refanged_text = refang(str(text))

    cves = extract_cves(refanged_text)
    ip_result = extract_ips(refanged_text)
    domains = extract_domains(refanged_text)
    hashes = extract_hashes(refanged_text)

    return {
        "cves": cves,
        "ips": ip_result["ips"],
        "private_ips": ip_result["private_ips"],
        "domains": domains,
        "hashes": hashes
    }
