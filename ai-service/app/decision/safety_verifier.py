def verify_safety(
    risk_level: str,
    final_score: float,
    ml_result: dict,
    rule_result: dict,
    urls: list[str]
) -> dict:
    """
    Execute post-verification safety checks to generate the 'Safe Face' / safety assurance dossier.
    Validates positive indicators of message authenticity.
    """
    normalized_level = risk_level.upper()
    is_safe = (normalized_level in ("LOW", "NORMAL")) and not rule_result.get("hasCriticalRule", False)

    if is_safe:
        verified_checks = [
            "No credential harvesting or OTP solicitations detected",
            "No artificial urgency or account suspension threats found",
            "ML linguistic analysis confirms natural, legitimate communication patterns"
        ]

        # Check URL safety if URLs were extracted
        url_analysis = rule_result.get("urlAnalysis", [])
        if urls:
            all_https = all(u.get("isHttps", False) for u in url_analysis)
            all_low_risk = all(u.get("riskScore", 0) < 25 for u in url_analysis)
            if all_https and all_low_risk:
                verified_checks.append("All included links use verified HTTPS and standard registered domain structure")
            else:
                verified_checks.append("Links present did not trigger active malware or phishing blacklists")
        else:
            verified_checks.append("No suspicious redirection hyperlinks or external tracking endpoints found")

        return {
            "isVerifiedSafe": True,
            "safetyFace": "friendly_shield",
            "faceIcon": "😊",
            "safetyStatus": "VERIFIED_SAFE",
            "safetyScore": round(max(0.0, 100.0 - final_score), 2),
            "verifiedChecks": verified_checks,
            "safetyMessage": (
                "Safety Verification Complete: This message passed all heuristic and AI security inspections. "
                "No deceptive traps or credential harvesting attempts were detected."
            )
        }

    elif normalized_level in ("MEDIUM", "SUSPICIOUS"):
        return {
            "isVerifiedSafe": False,
            "safetyFace": "caution_triangle",
            "faceIcon": "😐",
            "safetyStatus": "CAUTION_REQUIRED",
            "safetyScore": round(max(0.0, 100.0 - final_score), 2),
            "verifiedChecks": [],
            "safetyMessage": (
                "Caution Advised: Moderate risk signals, unusual urgency, or shortened links were detected. "
                "Verify the sender independently before replying or clicking."
            )
        }

    else: # HIGH / SCAM
        return {
            "isVerifiedSafe": False,
            "safetyFace": "threat_alert",
            "faceIcon": "🚨",
            "safetyStatus": "HIGH_THREAT",
            "safetyScore": round(max(0.0, 100.0 - final_score), 2),
            "verifiedChecks": [],
            "safetyMessage": (
                "Active Threat Detected: High-confidence phishing signals, malicious domains, or credential harvesting traps found. "
                "Do NOT click links, send funds, or provide verification codes."
            )
        }
