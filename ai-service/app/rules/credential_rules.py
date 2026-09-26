import re

CREDENTIAL_PATTERNS = [
    (r"\b(?:otp|one[- ]time[- ]password|verification code|auth code|2fa code)\b", "Request or reference to OTP/verification codes", "CRITICAL", 50),
    (r"\b(?:share|send|enter|provide|submit) (?:your )?(?:password|pin|cvv|passcode|secret key)\b", "Direct solicitation of confidential credentials", "CRITICAL", 55),
    (r"\b(?:credit card|debit card|card number|cvv|expiry date)\b", "Banking card credentials requested", "CRITICAL", 45),
    (r"\b(?:verify|update|complete) (?:your )?(?:kyc|pan|aadhaar|ssn|identity)\b", "Demands for personal identity/KYC credentials", "HIGH", 35),
]

def evaluate_credentials(cleaned_text: str) -> list[dict]:
    """
    Evaluate requests for OTPs, passwords, PINs, CVVs, and sensitive identity tokens.
    Returns list of triggered credential rules.
    """
    triggered = []
    for pattern, description, severity, points in CREDENTIAL_PATTERNS:
        match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if match:
            triggered.append({
                "id": "rule_credential_" + re.sub(r'[^a-z0-9]', '_', pattern[:15]),
                "category": "credentials",
                "severity": severity,
                "points": points,
                "matchedText": match.group(0),
                "description": description
            })
    return triggered
