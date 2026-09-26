from app.rules.url_rules import analyze_urls, analyze_single_url
from app.rules.urgency_rules import evaluate_urgency
from app.rules.credential_rules import evaluate_credentials
from app.rules.payment_rules import evaluate_payments
from app.rules.impersonation_rules import evaluate_impersonation

def evaluate_all_rules(cleaned_text: str, raw_urls: list[str]) -> dict:
    """
    Execute all rule modules in the Rule Engine pipeline:
    1. URL threat evaluation
    2. Urgency and coercion detection
    3. OTP and credential harvesting detection
    4. Payment and advance-fee solicitations
    5. Brand and authority impersonation

    Returns a comprehensive Rule Engine dossier:
    - ruleScore (0-100)
    - triggeredRules (list of structured rule objects)
    - urlAnalysis (list of analyzed URL dossiers)
    - maxUrlRisk (0-100)
    - legacyPatterns (list of legacy pattern strings for backward compatibility)
    - category (detected scam category)
    - hasCriticalRule (bool)
    """
    triggered_rules = []

    # 1. URL Analysis
    url_analysis, max_url_risk = analyze_urls(raw_urls)
    for u in url_analysis:
        for r in u.get("triggeredRules", []):
            triggered_rules.append(r)

    # 2. Urgency Rules
    urgency_triggers = evaluate_urgency(cleaned_text)
    triggered_rules.extend(urgency_triggers)

    # 3. Credential Rules
    credential_triggers = evaluate_credentials(cleaned_text)
    triggered_rules.extend(credential_triggers)

    # 4. Payment Rules
    payment_triggers = evaluate_payments(cleaned_text)
    triggered_rules.extend(payment_triggers)

    # 5. Impersonation Rules
    impersonation_triggers = evaluate_impersonation(cleaned_text, raw_urls)
    triggered_rules.extend(impersonation_triggers)

    # Calculate cumulative rule score with diminishing returns
    # Direct sum of points with clamp
    raw_points = sum(r.get("points", 0) for r in triggered_rules)
    rule_score = min(100.0, float(raw_points))

    # Detect critical severity rules
    has_critical = any(r.get("severity") == "CRITICAL" for r in triggered_rules)

    # Legacy pattern list for backward compatibility
    legacy_patterns = []
    if urgency_triggers:
        legacy_patterns.append("urgency")
    if any("account" in r.get("description", "").lower() or "account" in r.get("matchedText", "").lower() for r in urgency_triggers + credential_triggers):
        legacy_patterns.append("account_threat")
    if credential_triggers:
        legacy_patterns.append("credential_request")
    if any(r.get("category") == "payment" for r in payment_triggers):
        legacy_patterns.append("financial_request")
    if any("prize" in r.get("description", "").lower() or "lottery" in r.get("description", "").lower() for r in payment_triggers):
        legacy_patterns.append("prize_claim")
    if any("job" in r.get("description", "").lower() or "work" in r.get("description", "").lower() for r in payment_triggers):
        legacy_patterns.append("job_scam")
    if any("return" in r.get("description", "").lower() or "ponzi" in r.get("description", "").lower() for r in payment_triggers):
        legacy_patterns.append("investment_scam")

    if raw_urls:
        legacy_patterns.append("url_present")

    for u in url_analysis:
        for flag in u.get("threatFlags", []):
            if flag not in legacy_patterns:
                legacy_patterns.append(flag)

    # Category determination
    category = "other"
    if "prize_claim" in legacy_patterns:
        category = "lottery_prize_scam"
    elif "investment_scam" in legacy_patterns:
        category = "investment_scam"
    elif "job_scam" in legacy_patterns:
        category = "job_scam"
    elif (
        "account_threat" in legacy_patterns
        or "credential_request" in legacy_patterns
        or "brand_impersonation" in legacy_patterns
        or "ip_address_host" in legacy_patterns
    ):
        category = "phishing"
    elif "financial_request" in legacy_patterns:
        category = "financial_scam"
    elif any(f in legacy_patterns for f in ("insecure_http", "url_shortener", "suspicious_tld", "suspicious_path", "excessive_subdomains", "embedded_credentials")):
        category = "suspicious_link"
    elif "url_present" in legacy_patterns:
        category = "link_shared"

    return {
        "ruleScore": round(rule_score, 2),
        "triggeredRules": triggered_rules,
        "urlAnalysis": url_analysis,
        "maxUrlRisk": max_url_risk,
        "patterns": legacy_patterns,
        "category": category,
        "hasCriticalRule": has_critical
    }


def legacy_rule_signals(text: str) -> list[str]:
    """
    Legacy helper preserved for backward compatibility with existing tests.
    """
    from app.preprocessing.cleaner import clean_text
    from app.preprocessing.extractor import extract_urls
    cleaned = clean_text(text)
    urls = extract_urls(text)
    res = evaluate_all_rules(cleaned, urls)
    return res["patterns"]
