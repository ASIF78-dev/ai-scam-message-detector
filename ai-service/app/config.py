import os

# ============================================================
# PATHS CONFIGURATION
# ============================================================
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(APP_DIR)

MODEL_PATH = os.path.join(BASE_DIR, "model", "scam_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "tfidf_vectorizer.pkl")

# ============================================================
# DECISION ARBITER WEIGHTS & THRESHOLDS
# ============================================================
ML_WEIGHT = 0.55
RULE_WEIGHT = 0.45

# 3-Tier Risk Boundaries
LEGITIMATE_THRESHOLD = 34.0   # 0% - 34% = Legitimate / Low Risk
SUSPICIOUS_THRESHOLD = 69.0   # 35% - 69% = Suspicious / Medium Risk
SCAM_THRESHOLD = 70.0         # 70% - 100% = Scam / High Risk

# ============================================================
# URL & DOMAIN THREAT LISTS
# ============================================================
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy",
    "shorturl.at", "ow.ly", "buff.ly", "rebrand.ly", "tiny.cc",
    "clck.ru", "rotf.lol", "soo.gd", "s.id", "v.gd", "goo.gl"
}

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".club", ".work", ".click", ".loan", ".tk", ".ml",
    ".ga", ".cf", ".gq", ".buzz", ".fit", ".live", ".support", ".online",
    ".site", ".vip", ".icu", ".monster", ".quest", ".beauty", ".rest",
    ".cam", ".bid", ".date", ".faith", ".download", ".racing", ".cricket",
    ".cfd"
}

TARGET_BRANDS = [
    "sbi", "hdfc", "icici", "axis", "pnb", "bob", "paypal", "paytm",
    "phonepe", "gpay", "googlepay", "netflix", "amazon", "apple",
    "microsoft", "chase", "wellsfargo", "bankofamerica", "meta",
    "facebook", "whatsapp", "instagram", "fedex", "ups", "dhl",
    "usps", "indiapost", "binance", "coinbase"
]

OFFICIAL_DOMAINS = {
    "paypal": "paypal.com",
    "amazon": "amazon.com",
    "apple": "apple.com",
    "netflix": "netflix.com",
    "microsoft": "microsoft.com",
    "googlepay": "google.com",
    "gpay": "google.com",
    "sbi": "onlinesbi.sbi",
    "hdfc": "hdfcbank.com",
    "icici": "icicibank.com",
    "paytm": "paytm.com",
    "phonepe": "phonepe.com",
    "chase": "chase.com",
    "wellsfargo": "wellsfargo.com",
    "bankofamerica": "bankofamerica.com",
    "meta": "meta.com",
    "facebook": "facebook.com",
    "whatsapp": "whatsapp.com",
    "instagram": "instagram.com",
    "fedex": "fedex.com",
    "ups": "ups.com",
    "dhl": "dhl.com",
    "usps": "usps.com",
    "indiapost": "indiapost.gov.in",
    "binance": "binance.com",
    "coinbase": "coinbase.com"
}

ACTION_KEYWORDS = [
    "kyc", "verify", "verification", "login", "signin", "password",
    "pin", "cvv", "otp", "security", "update", "alert", "portal",
    "recovery", "secure", "banking", "account", "claim", "bonus",
    "reward", "prize", "refund", "wallet", "gift", "winner"
]
