import re

PAYMENT_PATTERNS = [
    (r"\b(?:processing fee|registration fee|security deposit|clearance charge|advance fee)\b", "Upfront fee demand typical of lottery and job scams", "CRITICAL", 45),
    (r"\b(?:won|winner|lottery|cash prize|jackpot|reward of Rs|reward of \$)\b", "Unsolicited lottery or prize winnings claim", "HIGH", 40),
    (r"\b(?:send|transfer|deposit|pay) (?:money|cash|funds|rs|inr|\$|usd|crypto|bitcoin|usdt)\b", "Direct financial transfer solicitation", "HIGH", 35),
    (r"\b(?:guaranteed returns?|double your money|zero risk|huge profit|daily profit)\b", "Unrealistic financial return promises / Ponzi bait", "HIGH", 40),
    (r"\b(?:gift card|itunes card|google play card|steam card)\b", "Gift card payment demand (hallmark scam mechanism)", "CRITICAL", 50),
    (r"\b(?:work from home|earn money online|like youtube videos|easy money)\b", "Task scam or fraudulent employment recruitment", "MEDIUM", 30),
]

def evaluate_payments(cleaned_text: str) -> list[dict]:
    """
    Evaluate fraudulent financial demands, prize lures, advance fee scams, and crypto/gift-card solicitations.
    Returns list of triggered payment rules.
    """
    triggered = []
    for pattern, description, severity, points in PAYMENT_PATTERNS:
        match = re.search(pattern, cleaned_text, re.IGNORECASE)
        if match:
            triggered.append({
                "id": "rule_payment_" + re.sub(r'[^a-z0-9]', '_', pattern[:15]),
                "category": "payment",
                "severity": severity,
                "points": points,
                "matchedText": match.group(0),
                "description": description
            })
    return triggered
