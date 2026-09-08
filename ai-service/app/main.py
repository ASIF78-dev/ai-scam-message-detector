import os
import re
import pickle

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="ScamShield AI Service",
    version="1.0.0"
)


# ============================================================
# MODEL PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "scam_model.pkl"
)

VECTORIZER_PATH = os.path.join(
    BASE_DIR,
    "model",
    "tfidf_vectorizer.pkl"
)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

try:

    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

    with open(VECTORIZER_PATH, "rb") as file:
        vectorizer = pickle.load(file)

    print("✅ Scam model loaded successfully")
    print(f"Model: {MODEL_PATH}")
    print(f"Vectorizer: {VECTORIZER_PATH}")

except Exception as e:

    model = None
    vectorizer = None

    print("❌ Error loading model:")
    print(e)


# ============================================================
# REQUEST MODEL
# ============================================================

class PredictionRequest(BaseModel):
    message: str


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):

    text = str(text)

    # Convert to lowercase
    text = text.lower()

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    # Remove leading/trailing spaces
    text = text.strip()

    return text


# ============================================================
# URL EXTRACTION
# ============================================================

def extract_urls(text):

    return re.findall(
        r'https?://[^\s]+',
        text
    )


# ============================================================
# RULE-BASED SUSPICIOUS PATTERN DETECTION
# ============================================================

def rule_signals(text):

    t = text.lower()

    patterns = []

    checks = {

        "urgency": [
            "urgent",
            "immediately",
            "act now",
            "within 24 hours",
            "limited time",
            "right now"
        ],

        "financial_request": [
            "pay",
            "payment",
            "send money",
            "processing fee",
            "transfer",
            "deposit",
            "fee"
        ],

        "account_threat": [
            "account will be blocked",
            "account blocked",
            "account suspended",
            "verify your account",
            "account will be closed",
            "account has been locked"
        ],

        "credential_request": [
            "otp",
            "password",
            "pin",
            "cvv",
            "card details",
            "verification code"
        ],

        "prize_claim": [
            "won",
            "winner",
            "lottery",
            "reward",
            "prize",
            "cash prize"
        ],

        "job_scam": [
            "work from home",
            "registration fee",
            "job fee",
            "security deposit",
            "guaranteed job",
            "earn money"
        ],

        "investment_scam": [
            "guaranteed returns",
            "double your money",
            "zero risk",
            "huge profit",
            "investment opportunity"
        ]
    }

    for name, words in checks.items():

        if any(word in t for word in words):
            patterns.append(name)

    # Check for URL
    if extract_urls(text):
        patterns.append("url_present")

    return patterns


# ============================================================
# SCAM CATEGORY
# ============================================================

def detect_category(patterns):

    if "prize_claim" in patterns:
        return "lottery_prize_scam"

    elif "investment_scam" in patterns:
        return "investment_scam"

    elif "job_scam" in patterns:
        return "job_scam"

    elif (
        "account_threat" in patterns
        or "credential_request" in patterns
    ):
        return "phishing"

    elif "financial_request" in patterns:
        return "financial_scam"

    elif "url_present" in patterns:
        return "suspicious_link"

    else:
        return "other"


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "scamshield-ai",
        "model_loaded": model is not None,
        "model_type": "TF-IDF + Logistic Regression"
    }


# ============================================================
# PREDICTION API
# ============================================================

@app.post("/predict")
def predict(req: PredictionRequest):

    # Check model
    if model is None or vectorizer is None:

        raise HTTPException(
            status_code=500,
            detail="AI model is not loaded. Please train the model first."
        )

    # Check message
    if not req.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # --------------------------------------------------------
    # Clean message
    # --------------------------------------------------------

    cleaned_message = clean_text(req.message)

    # --------------------------------------------------------
    # Rule-based patterns
    # --------------------------------------------------------

    patterns = rule_signals(cleaned_message)

    # --------------------------------------------------------
    # TF-IDF transformation
    # --------------------------------------------------------

    message_vector = vectorizer.transform(
        [cleaned_message]
    )

    # --------------------------------------------------------
    # ML prediction
    # --------------------------------------------------------

    ml_prediction = model.predict(
        message_vector
    )[0]

    # --------------------------------------------------------
    # Prediction probability
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        message_vector
    )[0]

    # Find scam probability
    scam_index = list(model.classes_).index("scam")

    scam_probability = probabilities[scam_index] * 100

    # Confidence = probability of predicted class
    confidence = max(probabilities) * 100

    # --------------------------------------------------------
    # Risk level
    # --------------------------------------------------------

    if scam_probability >= 70:

        prediction = "scam"
        risk_level = "HIGH"

    elif scam_probability >= 40:

        prediction = "suspicious"
        risk_level = "MEDIUM"

    else:

        prediction = "normal"
        risk_level = "LOW"

    # --------------------------------------------------------
    # Category
    # --------------------------------------------------------

    category = detect_category(patterns)

    # --------------------------------------------------------
    # URLs
    # --------------------------------------------------------

    urls = extract_urls(req.message)

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    if prediction == "scam":

        recommendation = (
            "Do not click suspicious links or share money, "
            "passwords, OTPs, PINs, CVV or other sensitive "
            "information. Verify the message through an official channel."
        )

    elif prediction == "suspicious":

        recommendation = (
            "Be careful with this message. Do not share sensitive "
            "information or make payments until you verify the sender "
            "through an official channel."
        )

    else:

        recommendation = (
            "This message appears normal, but always verify unexpected "
            "requests before sharing sensitive information."
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "prediction": prediction,

        "riskScore": round(
            scam_probability,
            2
        ),

        "riskLevel": risk_level,

        "confidence": round(
            confidence,
            2
        ),

        "category": category,

        "patterns": patterns,

        "extractedUrls": urls,

        "recommendation": recommendation,

        "modelVersion": "tfidf-logistic-regression-v1.0"
    }