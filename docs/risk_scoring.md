# Risk Scoring Specification (formula-v1)

## 1. Overview and Honesty Statement

> **HONESTY & DESIGN CHOICE DISCLAIMER:**
> The risk score formula weights (CVSS: 35%, Severity: 25%, Recency: 15%, Indicators: 15%, Source Reliability: 10%) are **design choices and heuristic engineering estimates**. 
> **No ground truth dataset exists** to empirically optimize, fit, or statistically validate these weights. 
> The resulting 0–100 score serves solely as a structured, deterministic triage heuristic to assist security analysts in ordering incoming advisories. It is **not** an actuarial risk probability or guarantee of exploitability.

---

## 2. Mathematical Formulation

The composite risk score $R \in [0, 100]$ is computed as:

$$R = \text{clamp}\left(100 \times \sum_{i} w_i \cdot f_i, \; 0, \; 100\right)$$

where $\sum_i w_i = 1.00$.

### Factor Breakdown and Weights

| Factor ($f_i$) | Weight ($w_i$) | Normalization Formula | Design Rationale |
| :--- | :---: | :--- | :--- |
| **CVSS Score** | **0.35** | $f_{\text{cvss}} = \frac{\text{CVSS}}{10.0} \in [0, 1]$ <br>*(If missing: imputed from Severity band)* | CVSS is the industry-standard baseline metric assessing intrinsic technical impact and exploitability. |
| **Severity Band** | **0.25** | Critical: $1.00$<br>High: $0.75$<br>Medium: $0.50$<br>Low: $0.25$ | Captures the qualitative triage assessment issued by the advisory authority or the ML text classifier. |
| **Recency** | **0.15** | $f_{\text{recency}} = \frac{1.0}{1.0 + (\text{days} / 180.0)}$ <br>*(Half-life: 180 days)* | Recent advisories pose higher immediate risk of zero-day weaponization, while legacy vulnerabilities (e.g. from 1988) have mature patches. |
| **Extracted Indicators** | **0.15** | $f_{\text{indicators}} = \min\left(\frac{N_{\text{IOC}}}{5}, 1.0\right)$ | Threats with concrete candidate indicators (IPs, C2 domains, hashes) are tactically actionable and require immediate operational review. |
| **Source Reliability** | **0.10** | NVD: $0.95$<br>GitHub: $0.85$<br>Reddit: $0.50$<br>X/Twitter: $0.45$<br>Default: $0.60$ | Formal government and vendor registries (NIST NVD) carry significantly higher fidelity than unverified social channels. |

---

## 3. Handling Missing CVSS Scores

In real-world threat feeds (e.g., GitHub Security Advisories before CVE assignment), CVSS scores are frequently absent.
- The scoring engine explicitly records `missingCvss: true` in the output breakdown.
- Rather than discarding the advisory or setting the CVSS factor to zero (which would unrealistically depress the risk of critical zero-days), the engine **imputes $f_{\text{cvss}}$ from the reported or predicted severity band**.

---

## 4. Output Schema

The engine outputs a transparent dictionary:

```json
{
  "riskScore": 78.4,
  "riskBreakdown": {
    "cvssFactor": 0.75,
    "severityFactor": 0.75,
    "recencyFactor": 0.9852,
    "indicatorFactor": 0.40,
    "sourceFactor": 0.85,
    "missingCvss": true,
    "daysSincePublished": 2.7
  },
  "riskScoreBasis": "formula-v1"
}
```
