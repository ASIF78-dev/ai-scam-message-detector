from fastapi import FastAPI, HTTPException

from app.preprocessing import clean_text, extract_urls
from app.classifier import classifier
from app.rules import (
    evaluate_all_rules,
    legacy_rule_signals,
    analyze_single_url,
    analyze_urls
)
from app.decision import arbitrate
from app.schemas import PredictionRequest, PredictionResponse

# Backward-compatibility alias for tests
rule_signals = legacy_rule_signals

# ============================================================
# FASTAPI APPLICATION
# ============================================================
app = FastAPI(
    title="ScamShield AI Service",
    description="Dual-Pipeline Threat Detection Engine (ML Classifier + Rule Engine + Decision Arbiter)",
    version="2.0.0"
)

# Reference to the loaded model for backward compatibility
model = classifier.model
vectorizer = classifier.vectorizer


# ============================================================
# ROOT & HEALTH
# ============================================================
@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "scamshield-ai",
        "version": app.version,
        "docs": "/docs",
        "health": "/health",
        "predict": "POST /predict",
    }


@app.get("/json/version")
def json_version():
    return {
        "status": "ok",
        "service": "scamshield-ai",
        "version": app.version,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "scamshield-ai",
        "model_loaded": classifier.is_loaded,
        "model_type": "TF-IDF + Logistic Regression",
        "pipeline": "Dual-Pipeline (ML + Heuristic Rule Engine + Decision Arbiter)"
    }


# ============================================================
# PREDICTION & THREAT SCAN ENDPOINT
# ============================================================
@app.post("/predict")
def predict(req: PredictionRequest):
    # 1. Input Validation
    if not req.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # 2. Text Preprocessing
    cleaned_message = clean_text(req.message)
    extracted_urls = extract_urls(req.message)

    # 3. Branch A: ML Classifier (TF-IDF + Logistic Regression)
    ml_result = classifier.predict(cleaned_message)

    # 4. Branch B: Rule Engine (URL + Urgency + Credential + Payment + Impersonation)
    rule_result = evaluate_all_rules(cleaned_message, extracted_urls)

    # 5. Decision Layer: Hybrid Fusion & Safety Verification
    decision = arbitrate(ml_result, rule_result, extracted_urls)

    # 6. Structured Output Response
    return {
        "prediction": decision["prediction"],
        "riskScore": decision["riskScore"],
        "riskLevel": decision["riskLevel"],
        "confidence": decision["confidence"],
        "category": decision["category"],
        "decisionReason": decision["decisionReason"],
        "recommendation": decision["recommendation"],
        "modelVersion": "dual-pipeline-tfidf-logreg-v2.0",
        "patterns": rule_result["patterns"],
        "extractedUrls": extracted_urls,
        "urlAnalysis": rule_result["urlAnalysis"],
        "urlRiskScore": rule_result["maxUrlRisk"],
        "triggeredRules": rule_result["triggeredRules"],
        "pipelineBreakdown": decision["pipelineBreakdown"],
        "safetyVerification": decision["safetyVerification"]
    }