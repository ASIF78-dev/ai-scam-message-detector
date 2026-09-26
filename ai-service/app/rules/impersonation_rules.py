import re
from urllib.parse import urlparse
from app.config import TARGET_BRANDS, OFFICIAL_DOMAINS

IMPERSONATED_ENTITIES = {
    "bank": [
        "sbi", "state bank", "hdfc", "icici", "axis bank", "pnb", "punjab national",
        "bank of baroda", "chase bank", "wells fargo", "bank of america"
    ],
    "courier": [
        "fedex", "ups", "dhl", "usps", "india post", "indiapost", "bluedart"
    ],
    "wallet_payment": [
        "paytm", "phonepe", "google pay", "gpay", "paypal"
    ],
    "service_platform": [
        "netflix", "amazon", "apple support", "meta", "whatsapp support", "instagram security"
    ],
    "government_legal": [
        "income tax", "customs department", "cyber crime", "police department", "court warrant"
    ]
}

def evaluate_impersonation(cleaned_text: str, urls: list[str]) -> list[dict]:
    """
    Detect explicit entity or authority impersonation claims within message body,
    correlating with extracted URLs to identify domain spoofing.
    """
    triggered = []

    matched_entities = []
    for category_name, entity_list in IMPERSONATED_ENTITIES.items():
        for entity in entity_list:
            if re.search(r'\b' + re.escape(entity) + r'\b', cleaned_text, re.IGNORECASE):
                matched_entities.append((category_name, entity))

    if not matched_entities:
        return []

    # Check if any URL belongs to a different unofficial domain
    has_unverified_url = False
    for u in urls:
        parsed = urlparse(u if u.startswith(('http://', 'https://')) else 'http://' + u)
        host = (parsed.netloc or '').lower().split(':')[0]
        # Check if the host matches the claimed entity's official domain
        for _, entity in matched_entities:
            # normalize entity key
            key = entity.replace(" ", "")
            official = OFFICIAL_DOMAINS.get(key)
            if official:
                if host != official and not host.endswith('.' + official):
                    has_unverified_url = True
                    break

    for cat, entity in matched_entities:
        severity = "HIGH" if has_unverified_url or urls else "MEDIUM"
        points = 35 if severity == "HIGH" else 20
        desc = f"Message claims to represent '{entity.title()}' ({cat.replace('_', ' ')})"
        if has_unverified_url:
            desc += " paired with an unofficial or unverified web link"

        triggered.append({
            "id": f"rule_impersonation_{cat}_{entity.replace(' ', '_')}",
            "category": "impersonation",
            "severity": severity,
            "points": points,
            "matchedEntity": entity,
            "description": desc
        })

    return triggered
