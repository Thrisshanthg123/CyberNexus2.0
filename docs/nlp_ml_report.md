# CyberNexus NLP & ML Layer: Engineering & Evaluation Report

**Project:** CyberNexus — College Cyber Threat Intelligence (CTI) Platform  
**Model Version:** `severity_v1`  
**Evaluation Date:** 2026-11-23  

---

## 1. Objective

The objective of the CyberNexus NLP and ML layers is to provide a functional, transparent, and honest proof-of-concept pipeline that ingests raw, semi-structured threat advisories from NVD and GitHub, normalizes unstructured security descriptions, extracts candidate threat indicators, predicts severity bands using statistical text classification, and computes a multi-factor risk score for analyst triage.

---

## 2. Ingested Data & Real Counts

All experiments and evaluations use real data collected by the project's collectors without data fabrication:

- **NVD (`data/raw/nvd.json`):** 10 records
  - Real fields: `category`, `confidence`, `cve`, `cvssScore`, `description`, `ioc`, `lastModified`, `mlClassification`, `published`, `riskScore`, `severity`, `source`, `status`, `timestamp`, `title`
  - CVSS availability: 10 / 10 records have a numeric `cvssScore`
  - Raw severity distribution: `High` (7), `Medium` (2), `HIGH` (1)
  - Date range: `1988-10-01T04:00:00.000` to `1990-10-03T04:00:00.000`
- **GitHub (`data/raw/github.json`):** 5 records
  - Real fields: `category`, `confidence`, `cve`, `cvssScore`, `description`, `ghsa`, `ioc`, `lastModified`, `mlClassification`, `published`, `riskScore`, `severity`, `source`, `status`, `timestamp`, `title`
  - CVSS availability: 0 / 5 records have a `cvssScore` (all `None`)
  - Raw severity distribution: `High` (3), `Medium` (2)
  - Date range: `2026-09-18T17:58:39Z` to `2026-09-18T17:59:46Z`
- **Combined Usable Dataset:** **15 records**
  - Normalized class distribution: **High: 11**, **Medium: 4**, Critical: 0, Low: 0.

> [!WARNING]
> **Dataset Size Advisory:** 15 records is an extremely small sample. Classes with fewer than 2 instances cannot be stratified. To build a robust production classifier across all 4 severity bands (Critical, High, Medium, Low), an analyst should trigger ingestion on the dashboard's Sources page to collect at least 50–100 records per source.

---

## 3. Modeling Methodology

### Why TF-IDF and Logistic Regression?
Deep neural networks or complex ensembles heavily overfit on datasets with small $N$ and lack interpretability. A linear model using **TF-IDF with n-grams $(1,2)$ and balanced class weighting coupled with $L_2$-regularized Logistic Regression**:
1. **Prevents over-parameterization:** Linear decision boundaries with $L_2$ regularization constrain feature weights.
2. **Transparent feature attribution:** Linear coefficients directly map to feature importance, enabling extraction of the top 5 contributing words (`topFeatures`) for analyst review.
3. **No label leakage:** Features are strictly derived from advisory title and description text. CVSS scores, raw labels, and threat IDs are strictly excluded from the feature space.

### Validation Strategy
Because $N = 15 < 100$, an 80/20 train/test split would produce an unrepresentative test partition of only 3 samples. We therefore used **Stratified 4-Fold Cross-Validation** ($k=4$). $k=4$ was selected because the minority class (`Medium`) contains exactly 4 samples, guaranteeing that each fold contains at least one instance of every present class.

---

## 4. Evaluation Metrics (Quoted Directly from `models/severity_v1_metrics.json`)

| Metric | `severity_v1` Model (OOF Cross-Validation) | Naive Baseline (Most Frequent Class: `High`) |
| :--- | :---: | :---: |
| **Accuracy** | **0.4000** (40.0%) | **0.7333** (73.3%) |
| **Macro F1** | **0.2857** | **0.4231** |
| **High Precision / Recall / F1** | 0.6000 / 0.5455 / 0.5714 | 0.7333 / 1.0000 / 0.8462 |
| **Medium Precision / Recall / F1** | 0.0000 / 0.0000 / 0.0000 | 0.0000 / 0.0000 / 0.0000 |

### Confusion Matrix
- **Model Confusion Matrix:** (Rows: True [High, Medium], Columns: Pred [High, Medium])
  - `True High  `: `[6, 5]` (6 correctly predicted High, 5 misclassified as Medium)
  - `True Medium`: `[4, 0]` (4 misclassified as High, 0 predicted Medium)
- **Baseline Confusion Matrix:**
  - `True High  `: `[11, 0]`
  - `True Medium`: `[4, 0]`

### Honest Interpretation of Results
With only 15 samples and vocabulary overlap between CVE text descriptions, the balanced logistic regression model predicted Medium 5 times on High samples and 0 times on Medium samples during cross-validation. The naive majority-class baseline achieves 73.3% accuracy simply by exploiting the severe class imbalance (11 High vs 4 Medium). Reporting both side-by-side demonstrates genuine ML transparency rather than inflated synthetic metrics.

---

## 5. Candidate IOC Extraction Approach & Limitations

- **Syntactic Pattern Matching:**
  - **CVEs:** `(?i)\bCVE-\d{4}-\d{4,7}\b` (uppercased, deduplicated).
  - **IPv4:** Regex candidate extraction validated using Python's `ipaddress.IPv4Address`. Rejects invalid octets (e.g., `999.1.1.1`). Addresses in RFC 1918, loopback, or link-local ranges are flagged as `private_ips`.
  - **Domains:** Extracted using a conservative list of 30 common TLDs (`.com`, `.org`, `.net`, `.io`, etc.). Excludes file extensions (`readme.md`, `setup.py`), purely numeric labels, and version tokens.
  - **Hashes:** Exact hex lengths: MD5 (32), SHA-1 (40), SHA-256 (64).
  - **Defanging Support:** Automatically refangs `hxxp://`, `hxxps://`, `[.]`, `(.)`, and `[:]` before extraction.
- **Limitations:**
  - Pattern matching does not understand grammatical context. A domain cited as a researcher's blog or a software dependency repository (`github.com`) will be extracted as a candidate indicator.
  - **Attribution Disclaimer:** Extracted indicators are **candidate indicators**, not confirmed threats. No attribution or malicious intent is claimed.

---

## 6. Multi-Factor Risk Scoring Formula (`formula-v1`)

Composite risk score $R \in [0, 100]$:
$$R = \text{clamp}\left(100 \times [0.35 \cdot f_{\text{cvss}} + 0.25 \cdot f_{\text{sev}} + 0.15 \cdot f_{\text{rec}} + 0.15 \cdot f_{\text{ioc}} + 0.10 \cdot f_{\text{src}}], \; 0, \; 100\right)$$

- **CVSS Factor ($f_{\text{cvss}}$, 35%):** Normalized $\frac{\text{CVSS}}{10.0}$. If missing (e.g. GitHub advisories), explicitly logged as `missingCvss: true` and imputed from reported severity.
- **Severity Factor ($f_{\text{sev}}$, 25%):** Critical: 1.0, High: 0.75, Medium: 0.50, Low: 0.25.
- **Recency Factor ($f_{\text{rec}}$, 15%):** $\frac{1.0}{1.0 + (\text{days} / 180.0)}$ (180-day half-life decay).
- **Candidate Indicator Factor ($f_{\text{ioc}}$, 15%):** $\min(N_{\text{IOC}} / 5, 1.0)$ (saturated at 5 indicators).
- **Source Reliability Factor ($f_{\text{src}}$, 10%):** NVD (0.95), GitHub (0.85), Reddit (0.50), X/Twitter (0.45), default (0.60).

---

## 7. Limitations & Honesty Rules

1. **Small Data Limitation:** The current pipeline operates on 15 real records. Performance on small datasets is sensitive to individual vocabulary tokens.
2. **Source Severity as Proxy Label:** Ground truth severity labels originate from the reporting source (NVD/GitHub), which may carry subjective source bias.
3. **No Attack Category Labels:** The raw data contains no labels for attack types (e.g. phishing, ransomware, Trojan). We do NOT claim attack category classification.
4. **Model Confidence $\neq$ Reality:** Model confidence is an internal softmax probability reflecting how closely the text aligns with the training vocabulary. It does not measure the probability that a real-world breach has occurred.
5. **Heuristic Weights:** Risk formula factor weights are subjective engineering choices with no ground truth validation.
6. **Shared Indicators are Leads, Not Campaigns:** Cross-record overlaps (e.g. `github.com` appearing in 4 GitHub advisories) represent shared infrastructure or references, not proof of a coordinated threat actor.

---

## 8. Future Roadmap

1. **Data Ingestion Expansion:** Expand ingestion to $\ge 500$ records per source via automated polling on the Sources page.
2. **Multiclass Coverage:** Ingest and label confirmed `Critical` and `Low` CVEs to support all four severity tiers.
3. **Probability Calibration:** Apply Platt scaling or Isotonic Regression on larger validation splits.
4. **Cyber-Specific NER:** Integrate spaCy or fine-tuned RoBERTa for context-aware named entity recognition to distinguish malicious C2 domains from benign vendor references.
5. **Graph Correlation:** Ingest shared candidate indicators into a persistent graph database (e.g., NetworkX / Neo4j) with node weights decaying over time.
