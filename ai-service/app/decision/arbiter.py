from app.config import (
    ML_WEIGHT,
    RULE_WEIGHT,
    LEGITIMATE_THRESHOLD,
    SUSPICIOUS_THRESHOLD,
    SCAM_THRESHOLD
)
from app.decision.safety_verifier import verify_safety

def arbitrate(
    ml_result: dict,
    rule_result: dict,
    urls: list[str]
) -> dict:
    """
    Hybrid Decision Layer:
    Merges ML Classifier probabilities with Rule Engine heuristic severity.
    Enforces deterministic critical overrides and generates structured explainability.
    """
    ml_score = float(ml_result.get("mlScore", 0.0))
    rule_score = float(rule_result.get("ruleScore", 0.0))
    max_url_risk = float(rule_result.get("maxUrlRisk", 0.0))
    has_critical = bool(rule_result.get("hasCriticalRule", False))
    category = rule_result.get("category", "other")
    url_analysis = rule_result.get("urlAnalysis", [])

    is_override = False
    override_reason = ""

    # 1. Critical Deterministic Overrides (High-Severity Veto)
    if max_url_risk >= 60:
        is_override = True
        override_reason = "Malicious or spoofed domain detected (URL threat score >= 60)."
        final_score = max(SCAM_THRESHOLD, max_url_risk)
        prediction = "scam"
        risk_level = "HIGH"
        if category in ("other", "link_shared"):
            category = "phishing"

    elif any(r.get("id") == "url_ip_host" for r in rule_result.get("triggeredRules", [])):
        is_override = True
        override_reason = "Raw IP address used as web host (high-risk phishing infrastructure)."
        final_score = max(SCAM_THRESHOLD, 85.0)
        prediction = "scam"
        risk_level = "HIGH"
        category = "phishing"

    elif has_critical and (urls or ml_score >= 25.0):
        is_override = True
        override_reason = "Critical credential theft or financial exploitation heuristic triggered."
        final_score = max(SCAM_THRESHOLD, rule_score)
        prediction = "scam"
        risk_level = "HIGH"

    else:
        # 2. Weighted Fusion Arbiter
        blended = (ML_WEIGHT * ml_score) + (RULE_WEIGHT * rule_score)

        # Elevate if URL is suspicious
        if max_url_risk >= 30:
            blended = max(blended, max_url_risk)

        final_score = min(100.0, max(0.0, blended))

        # 3-Tier Classification Mapping
        if final_score >= SCAM_THRESHOLD:
            prediction = "scam"
            risk_level = "HIGH"
        elif final_score >= 35.0 or (max_url_risk >= 25.0 and prediction != "scam"):
            prediction = "suspicious"
            risk_level = "MEDIUM"
        else:
            prediction = "normal"
            risk_level = "LOW"

    # Decision Reason Explainability
    if is_override:
        decision_reason = f"Deterministic Threat Override: {override_reason}"
    elif risk_level == "HIGH":
        decision_reason = (
            f"High Risk Verdict: Dual pipeline fusion (ML: {ml_score}%, Rules: {rule_score} pts) "
            f"yielded a combined threat score of {round(final_score, 1)}%."
        )
    elif risk_level == "MEDIUM":
        decision_reason = (
            f"Suspicious Warning: Message exhibits moderate risk (ML: {ml_score}%, Rules: {rule_score} pts). "
            f"Combined score {round(final_score, 1)}% suggests caution."
        )
    else:
        decision_reason = (
            f"Legitimate Message: Clean communication pattern (ML: {ml_score}%, Rules: {rule_score} pts). "
            f"Combined score {round(final_score, 1)}% indicates authentic context."
        )

    # Calculate overall confidence
    ml_confidence = float(ml_result.get("mlConfidence", 50.0))
    if is_override:
        confidence = max(ml_confidence, final_score)
    else:
        confidence = max(ml_confidence, abs(final_score - 50.0) * 1.5 + 50.0)
    confidence = min(99.9, max(50.0, confidence))

    # Contextual Recommendation Advice
    has_dangerous_url = any(u.get("riskLevel") == "DANGEROUS" for u in url_analysis)
    has_suspicious_url = any(u.get("riskLevel") == "SUSPICIOUS" for u in url_analysis)

    if has_dangerous_url:
        recommendation = (
            "DANGER: Malicious or spoofed link detected. Do not click links, "
            "provide credentials, or install files. Verify directly with the organization via official contacts."
        )
    elif prediction == "scam":
        recommendation = (
            "Do not click suspicious links or share money, "
            "passwords, OTPs, PINs, CVV or other sensitive "
            "information. Verify the message through an official channel."
        )
    elif has_suspicious_url or prediction == "suspicious":
        recommendation = (
            "Be careful with this message. A suspicious or shortened link was detected. "
            "Do not share sensitive information or make payments until verified."
        )
    else:
        recommendation = (
            "This message appears normal, but always verify unexpected "
            "requests before sharing sensitive information."
        )

    # Safety Verification Phase ('Safe Face')
    safety_dossier = verify_safety(risk_level, final_score, ml_result, rule_result, urls)

    return {
        "prediction": prediction,
        "riskScore": round(float(final_score), 2),
        "riskLevel": risk_level,
        "confidence": round(float(confidence), 2),
        "category": category,
        "decisionReason": decision_reason,
        "recommendation": recommendation,
        "isOverride": is_override,
        "pipelineBreakdown": {
            "mlScore": round(ml_score, 2),
            "mlConfidence": round(ml_confidence, 2),
            "ruleScore": round(rule_score, 2),
            "mlWeight": ML_WEIGHT,
            "ruleWeight": RULE_WEIGHT,
            "triggeredRulesCount": len(rule_result.get("triggeredRules", []))
        },
        "safetyVerification": safety_dossier
    }
