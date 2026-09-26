import re
from urllib.parse import urlparse
from app.config import (
    SHORTENER_DOMAINS,
    SUSPICIOUS_TLDS,
    TARGET_BRANDS,
    OFFICIAL_DOMAINS,
    ACTION_KEYWORDS
)

def analyze_single_url(raw_url: str) -> dict:
    """
    Inspect a single URL for security threats:
    - HTTP vs HTTPS protocol
    - IP address used as hostname
    - URL shortener obfuscation
    - Suspicious TLD
    - Brand impersonation / typosquatting
    - Credential harvesting keywords in path/query
    - Returns structured URL security dossier
    """
    url_to_parse = raw_url
    if not url_to_parse.startswith(('http://', 'https://')):
        url_to_parse = 'http://' + url_to_parse

    parsed = urlparse(url_to_parse)
    scheme = parsed.scheme.lower() if parsed.scheme else 'http'
    netloc = (parsed.netloc or '').lower()
    hostname = netloc.split(':')[0] if netloc else ''
    path = (parsed.path or '').lower()
    query = (parsed.query or '').lower()

    threat_flags = []
    reasons = []
    risk_points = 0
    triggered_rules = []

    is_https = (scheme == 'https')

    # 1. Protocol / HTTPS Check
    if not is_https:
        risk_points += 25
        threat_flags.append("insecure_http")
        reasons.append("Unencrypted HTTP protocol; communications and credentials can be intercepted.")
        triggered_rules.append({
            "id": "url_insecure_http",
            "category": "url",
            "severity": "LOW",
            "points": 25,
            "description": "Insecure HTTP connection detected"
        })

    # 2. IP Address as Hostname Check
    is_ip = bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', hostname))
    if is_ip:
        risk_points += 50
        threat_flags.append("ip_address_host")
        reasons.append(f"Hostname is a raw IP address ({hostname}) rather than a registered domain name, a hallmark of malicious infrastructure.")
        triggered_rules.append({
            "id": "url_ip_host",
            "category": "url",
            "severity": "CRITICAL",
            "points": 50,
            "description": f"Raw IP address hostname: {hostname}"
        })

    # 3. URL Shortener Check
    base_host = hostname.replace("www.", "")
    if base_host in SHORTENER_DOMAINS:
        risk_points += 30
        threat_flags.append("url_shortener")
        reasons.append(f"Known URL shortener ({base_host}) masks the real destination domain to evade inspection.")
        triggered_rules.append({
            "id": "url_shortener_masking",
            "category": "url",
            "severity": "MEDIUM",
            "points": 30,
            "description": f"URL shortener used: {base_host}"
        })

    # 4. Suspicious TLD Check
    matched_tld = None
    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            matched_tld = tld
            break
    if matched_tld:
        risk_points += 25
        threat_flags.append("suspicious_tld")
        reasons.append(f"Uses a high-risk Top-Level Domain ({matched_tld}) frequently abused for disposable phishing campaigns.")
        triggered_rules.append({
            "id": "url_suspicious_tld",
            "category": "url",
            "severity": "MEDIUM",
            "points": 25,
            "description": f"High-risk TLD ({matched_tld})"
        })

    # 5. Brand Impersonation & Typosquatting Check
    matched_brand = None
    for brand in TARGET_BRANDS:
        if brand in hostname:
            matched_brand = brand
            break

    if matched_brand:
        official = OFFICIAL_DOMAINS.get(matched_brand)
        is_official = official and (hostname == official or hostname.endswith('.' + official))

        if not is_official:
            has_action_in_host = any(kw in hostname for kw in ACTION_KEYWORDS)
            if has_action_in_host or '-' in hostname or matched_tld:
                risk_points += 40
                threat_flags.append("brand_impersonation")
                reasons.append(f"Hostname mimics brand '{matched_brand}' combined with security/verification keywords.")
                triggered_rules.append({
                    "id": "url_brand_impersonation",
                    "category": "impersonation",
                    "severity": "CRITICAL",
                    "points": 40,
                    "description": f"Brand impersonation in hostname targeting {matched_brand}"
                })
            elif base_host != matched_brand + ".com":
                risk_points += 20
                threat_flags.append("brand_mention")
                reasons.append(f"Hostname mentions brand name '{matched_brand}' on an unofficial domain.")
                triggered_rules.append({
                    "id": "url_brand_mention",
                    "category": "impersonation",
                    "severity": "LOW",
                    "points": 20,
                    "description": f"Unofficial domain mentioning brand '{matched_brand}'"
                })

    # 6. Excessive Subdomains & Obfuscation
    dot_count = hostname.count('.')
    if dot_count >= 4 and not is_ip:
        risk_points += 20
        threat_flags.append("excessive_subdomains")
        reasons.append(f"Excessive subdomains ({dot_count} dots) detected; often used to fake authentic domain names.")
        triggered_rules.append({
            "id": "url_excessive_subdomains",
            "category": "url",
            "severity": "LOW",
            "points": 20,
            "description": f"Excessive subdomains ({dot_count} dots)"
        })

    if '@' in raw_url:
        risk_points += 45
        threat_flags.append("embedded_credentials")
        reasons.append("URL contains '@' character, a deceptive tactic used to mislead users about the true destination.")
        triggered_rules.append({
            "id": "url_embedded_credentials",
            "category": "url",
            "severity": "HIGH",
            "points": 45,
            "description": "Embedded '@' credential obfuscation in URL"
        })

    if hostname.count('-') >= 3:
        risk_points += 15
        threat_flags.append("excessive_hyphens")
        reasons.append("Hostname contains multiple hyphens commonly seen in typosquatted domains.")
        triggered_rules.append({
            "id": "url_excessive_hyphens",
            "category": "url",
            "severity": "LOW",
            "points": 15,
            "description": "Multiple hyphens indicating possible typosquatting"
        })

    # 7. Sensitive Keywords in Path or Query
    matched_path_keywords = [kw for kw in ACTION_KEYWORDS if kw in path or kw in query]
    if matched_path_keywords:
        risk_points += 15
        threat_flags.append("suspicious_path")
        reasons.append(f"URL path or parameters contain sensitive credential/action keywords: {', '.join(matched_path_keywords[:4])}.")
        triggered_rules.append({
            "id": "url_sensitive_path_keywords",
            "category": "url",
            "severity": "LOW",
            "points": 15,
            "description": f"Sensitive action keywords in URL path ({', '.join(matched_path_keywords[:2])})"
        })

    # Final clamped risk score
    risk_score = min(100, max(0, risk_points))

    # Risk Level Tier
    if risk_score >= 60 or "ip_address_host" in threat_flags or "brand_impersonation" in threat_flags:
        risk_level = "DANGEROUS"
    elif risk_score >= 25 or "url_shortener" in threat_flags or "insecure_http" in threat_flags:
        risk_level = "SUSPICIOUS"
    else:
        risk_level = "SAFE"

    if not reasons:
        reasons.append("Standard domain structure using encrypted HTTPS protocol; no deceptive patterns detected.")

    return {
        "url": raw_url,
        "domain": base_host or hostname,
        "hostname": hostname,
        "protocol": scheme + ":",
        "isHttps": is_https,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "threatFlags": threat_flags,
        "reasons": reasons,
        "triggeredRules": triggered_rules
    }


def analyze_urls(urls: list) -> tuple[list[dict], float]:
    """
    Run security analysis on all extracted URLs.
    Returns (url_analysis_list, max_url_risk_score).
    """
    analysis_list = []
    max_url_risk = 0
    for u in urls:
        analysis = analyze_single_url(u)
        analysis_list.append(analysis)
        if analysis["riskScore"] > max_url_risk:
            max_url_risk = analysis["riskScore"]
    return analysis_list, max_url_risk
