"""
Unit tests for Candidate IOC Extraction (backend/nlp/ioc_extraction.py).

Verifies the 12 required test conditions:
1. Valid IP
2. Invalid IP (rejects 999.1.1.1)
3. Private IP (marked in private_ips)
4. Mixed-case CVE (uppercased)
5. Duplicate CVEs (de-duplicated)
6. File name not a domain (rejects readme.md, setup.py)
7. MD5 hash (length 32)
8. SHA1 hash (length 40)
9. SHA256 hash (length 64)
10. Defanged domain (hxxp, [.], etc.)
11. Empty text
12. None input
13. Several indicator types in one sentence
"""

import pytest
from backend.nlp.ioc_extraction import extract_iocs, refang, is_private_or_reserved_ip


def test_valid_ip():
    text = "Traffic originated from external host 93.184.216.34 during the probe."
    iocs = extract_iocs(text)
    assert "93.184.216.34" in iocs["ips"]
    assert "93.184.216.34" not in iocs["private_ips"]


def test_invalid_ip():
    text = "Attempted connection to bogus address 999.1.1.1 and 256.0.0.1 on port 80."
    iocs = extract_iocs(text)
    assert "999.1.1.1" not in iocs["ips"]
    assert "256.0.0.1" not in iocs["ips"]
    assert len(iocs["ips"]) == 0


def test_private_ip():
    text = "Internal node 192.168.1.50 communicated with gateway 10.0.0.1 and loopback 127.0.0.1."
    iocs = extract_iocs(text)
    assert "192.168.1.50" in iocs["ips"]
    assert "10.0.0.1" in iocs["ips"]
    assert "192.168.1.50" in iocs["private_ips"]
    assert "10.0.0.1" in iocs["private_ips"]
    assert "127.0.0.1" in iocs["private_ips"]


def test_mixed_case_cve():
    text = "Identified vulnerability cve-2024-3094 in liblzma utility."
    iocs = extract_iocs(text)
    assert iocs["cves"] == ["CVE-2024-3094"]


def test_duplicate_cves():
    text = "Report mentions CVE-2021-44228, cve-2021-44228, and CVE-2021-44228 repeatedly."
    iocs = extract_iocs(text)
    assert iocs["cves"] == ["CVE-2021-44228"]


def test_filename_not_a_domain():
    text = "Please review the instructions in readme.md, run setup.py, and inspect package.json."
    iocs = extract_iocs(text)
    assert "readme.md" not in iocs["domains"]
    assert "setup.py" not in iocs["domains"]
    assert "package.json" not in iocs["domains"]
    assert len(iocs["domains"]) == 0


def test_md5_hash():
    # 32-character hexadecimal string
    md5 = "44d88612fea8a8f36de82e1278abb02f"
    text = f"Sample payload MD5 hash is {md5}."
    iocs = extract_iocs(text)
    assert md5 in iocs["hashes"]["md5"]
    assert len(iocs["hashes"]["sha1"]) == 0
    assert len(iocs["hashes"]["sha256"]) == 0


def test_sha1_hash():
    # 40-character hexadecimal string
    sha1 = "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12"
    text = f"Binary signature SHA-1: {sha1}."
    iocs = extract_iocs(text)
    assert sha1 in iocs["hashes"]["sha1"]
    assert len(iocs["hashes"]["md5"]) == 0


def test_sha256_hash():
    # 64-character hexadecimal string
    sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    text = f"Observed sample hash: {sha256}."
    iocs = extract_iocs(text)
    assert sha256 in iocs["hashes"]["sha256"]


def test_defanged_domain():
    text = "Inbound connection seen to hxxp://c2-command[.]org and http://beacon(.)xyz."
    iocs = extract_iocs(text)
    assert "c2-command.org" in iocs["domains"]
    assert "beacon.xyz" in iocs["domains"]


def test_empty_text():
    iocs = extract_iocs("")
    assert iocs["cves"] == []
    assert iocs["ips"] == []
    assert iocs["private_ips"] == []
    assert iocs["domains"] == []
    assert iocs["hashes"] == {"md5": [], "sha1": [], "sha256": []}


def test_none_input():
    iocs = extract_iocs(None)
    assert iocs["cves"] == []
    assert iocs["ips"] == []
    assert iocs["private_ips"] == []
    assert iocs["domains"] == []
    assert iocs["hashes"] == {"md5": [], "sha1": [], "sha256": []}


def test_multiple_indicator_types_in_one_sentence():
    text = (
        "Advisory for CVE-2023-38606: Malicious host 203.0.113.15 contacted evil-corp.com "
        "distributing artifact 5d41402abc4b2a76b9719d911017c592."
    )
    iocs = extract_iocs(text)
    assert "CVE-2023-38606" in iocs["cves"]
    assert "203.0.113.15" in iocs["ips"]
    assert "evil-corp.com" in iocs["domains"]
    assert "5d41402abc4b2a76b9719d911017c592" in iocs["hashes"]["md5"]
