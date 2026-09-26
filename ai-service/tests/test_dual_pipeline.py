import unittest
from app.preprocessing import clean_text, extract_urls
from app.classifier import classifier
from app.rules import (
    evaluate_all_rules,
    evaluate_urgency,
    evaluate_credentials,
    evaluate_payments,
    evaluate_impersonation
)
from app.decision import arbitrate, verify_safety

class TestDualPipelineAndSafeFace(unittest.TestCase):
    """
    Test suite for the Dual-Pipeline architecture:
    - ML Classifier
    - Rule Engine modules
    - Hybrid Decision Layer
    - Safety Verifier & 'Safe Face' indicators
    """

    def test_ml_classifier_loaded(self):
        self.assertTrue(classifier.is_loaded)
        res = classifier.predict("Congratulations, you won a lottery prize!")
        self.assertIn("mlScore", res)
        self.assertIn("mlConfidence", res)
        self.assertGreater(res["mlScore"], 50.0)

    def test_urgency_rules(self):
        text = "URGENT: your account will be suspended within 24 hours immediately!"
        triggers = evaluate_urgency(clean_text(text))
        self.assertGreater(len(triggers), 0)
        severities = [t["severity"] for t in triggers]
        self.assertTrue("CRITICAL" in severities or "HIGH" in severities)

    def test_credential_rules(self):
        text = "Please share your banking OTP and credit card CVV to verify."
        triggers = evaluate_credentials(clean_text(text))
        self.assertGreaterEqual(len(triggers), 2)
        categories = [t["category"] for t in triggers]
        self.assertTrue(all(c == "credentials" for c in categories))

    def test_payment_rules(self):
        text = "Pay Rs 500 registration fee to claim your prize."
        triggers = evaluate_payments(clean_text(text))
        self.assertGreater(len(triggers), 0)
        self.assertEqual(triggers[0]["category"], "payment")

    def test_impersonation_with_spoofed_link(self):
        text = "State Bank of India notice: update KYC at http://sbi-login.fake-site.com"
        urls = extract_urls(text)
        triggers = evaluate_impersonation(clean_text(text), urls)
        self.assertGreater(len(triggers), 0)
        self.assertEqual(triggers[0]["severity"], "HIGH")

    def test_decision_layer_critical_override(self):
        # Even if ML score is low, IP-based phishing URL forces High Risk
        ml_mock = {"mlScore": 10.0, "mlConfidence": 60.0}
        rule_mock = {
            "ruleScore": 75.0,
            "maxUrlRisk": 75.0,
            "hasCriticalRule": True,
            "category": "phishing",
            "triggeredRules": [{"id": "url_ip_host", "severity": "CRITICAL"}]
        }
        res = arbitrate(ml_mock, rule_mock, ["http://192.168.1.1/login"])
        self.assertEqual(res["riskLevel"], "HIGH")
        self.assertEqual(res["prediction"], "scam")
        self.assertTrue(res["isOverride"])
        self.assertIn("Deterministic Threat Override", res["decisionReason"])

    def test_safe_face_verification(self):
        # Clean transactional message
        clean_msg = "Your delivery order FEDX-1290 has been shipped and will arrive tomorrow."
        cleaned = clean_text(clean_msg)
        urls = extract_urls(clean_msg)
        ml_res = classifier.predict(cleaned)
        rule_res = evaluate_all_rules(cleaned, urls)
        decision = arbitrate(ml_res, rule_res, urls)

        self.assertEqual(decision["riskLevel"], "LOW")
        self.assertEqual(decision["prediction"], "normal")

        # Verify Safe Face dossier
        safety = decision["safetyVerification"]
        self.assertTrue(safety["isVerifiedSafe"])
        self.assertEqual(safety["safetyFace"], "friendly_shield")
        self.assertEqual(safety["faceIcon"], "😊")
        self.assertEqual(safety["safetyStatus"], "VERIFIED_SAFE")
        self.assertGreaterEqual(safety["safetyScore"], 65.0)
        self.assertGreater(len(safety["verifiedChecks"]), 2)
        self.assertIn("Safety Verification Complete", safety["safetyMessage"])

    def test_caution_face_for_suspicious(self):
        # Medium risk message
        safety = verify_safety(
            risk_level="MEDIUM",
            final_score=50.0,
            ml_result={"mlScore": 45.0},
            rule_result={"ruleScore": 55.0, "hasCriticalRule": False},
            urls=[]
        )
        self.assertFalse(safety["isVerifiedSafe"])
        self.assertEqual(safety["safetyFace"], "caution_triangle")
        self.assertEqual(safety["faceIcon"], "😐")
        self.assertEqual(safety["safetyStatus"], "CAUTION_REQUIRED")

    def test_danger_face_for_scam(self):
        # High risk scam
        safety = verify_safety(
            risk_level="HIGH",
            final_score=90.0,
            ml_result={"mlScore": 95.0},
            rule_result={"ruleScore": 85.0, "hasCriticalRule": True},
            urls=["http://scam.xyz"]
        )
        self.assertFalse(safety["isVerifiedSafe"])
        self.assertEqual(safety["safetyFace"], "threat_alert")
        self.assertEqual(safety["faceIcon"], "🚨")
        self.assertEqual(safety["safetyStatus"], "HIGH_THREAT")

if __name__ == "__main__":
    unittest.main()
