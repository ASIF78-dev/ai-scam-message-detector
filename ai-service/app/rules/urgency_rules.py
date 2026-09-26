import re

URGENCY_PATTERNS = [
    (r"\b(?:urgent|urgently|immediate|immediately|right now|act now)\b", "High-urgency language coercing immediate action", "HIGH", 30),
    (r"\bwithin (?:24|12|48|2|1) (?:hours?|hrs?)\b", "Artificial strict deadline constraint", "HIGH", 30),
    (r"\baccount (?:will be |has been )?(?:blocked|suspended|closed|locked|terminated|disabled)\b", "Account suspension or termination threat", "CRITICAL", 45),
    (r"\b(?:verify|validate|update|confirm) (?:your )?account\b", "Account verification demand / threat", "HIGH", 35),
    (r"\b(?:final notice|last reminder|critical alert|action required)\b", "Alarmist alert framing", "MEDIUM", 20),
    (r"\blimited time (?:offer|deal|window)\b", "Scarcity manipulation tactic", "LOW", 15),
]

def evaluate_urgency(cleaned_text: str) -> list[dict]:
    """
    Evaluate urgency, artificial time pressure, and panic-inducing coercion.
    Returns list of triggered rule objects.
    """
    triggered = []
    for pattern, description, severity, points in URGENCY_PATTERNS:
        match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if match:
            triggered.append({
                "id": "rule_urgency_" + re.sub(r'[^a-z0-9]', '_', pattern[:15]),
                "category": "urgency",
                "severity": severity,
                "points": points,
                "matchedText": match.group(0),
                "description": description
            })
    return triggered
