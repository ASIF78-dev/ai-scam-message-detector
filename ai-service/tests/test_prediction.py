import unittest
from fastapi import HTTPException
from app.main import (
    app,
    clean_text,
    extract_urls,
    analyze_single_url,
    analyze_urls,
    rule_signals,
    health,
    predict,
    PredictionRequest,
)

class TestScamShieldAI(unittest.TestCase):

    def test_clean_text(self):
        raw = "  URGENT:   Verify your account immediately!  \n"
        cleaned = clean_text(raw)
        self.assertEqual(cleaned, "urgent: verify your account immediately!")

    def test_extract_urls(self):
        text = "Click here: http://scam-site.com/verify, or https://secure.bank.org. Also check www.suspicious.xyz!"
        urls = extract_urls(text)
        self.assertEqual(len(urls), 3)
        self.assertIn("http://scam-site.com/verify", urls)
        self.assertIn("https://secure.bank.org", urls)
        self.assertIn("www.suspicious.xyz", urls)

    def test_url_security_insecure_http(self):
        res = analyze_single_url("http://example-test.com/login")
        self.assertFalse(res["isHttps"])
        self.assertIn("insecure_http", res["threatFlags"])
        self.assertGreaterEqual(res["riskScore"], 25)

    def test_url_security_ip_hostname(self):
        res = analyze_single_url("http://192.168.1.100/pay")
        self.assertIn("ip_address_host", res["threatFlags"])
        self.assertEqual(res["riskLevel"], "DANGEROUS")
        self.assertGreaterEqual(res["riskScore"], 70)

    def test_url_security_shortener(self):
        res = analyze_single_url("https://bit.ly/claim-prize")
        self.assertIn("url_shortener", res["threatFlags"])
        self.assertIn("suspicious_path", res["threatFlags"])
        self.assertEqual(res["riskLevel"], "SUSPICIOUS")

    def test_url_security_brand_impersonation(self):
        res = analyze_single_url("http://sbi-kyc-verify.xyz/update")
        self.assertIn("brand_impersonation", res["threatFlags"])
        self.assertIn("suspicious_tld", res["threatFlags"])
        self.assertEqual(res["riskLevel"], "DANGEROUS")
        self.assertGreaterEqual(res["riskScore"], 70)

    def test_url_security_safe_domain(self):
        res = analyze_single_url("https://amazon.com/orders")
        self.assertTrue(res["isHttps"])
        self.assertEqual(res["riskLevel"], "SAFE")
        self.assertLess(res["riskScore"], 25)

    def test_rule_signals(self):
        text = "urgent verify your account immediately otp required"
        signals = rule_signals(text)
        self.assertIn("urgency", signals)
        self.assertIn("account_threat", signals)
        self.assertIn("credential_request", signals)

    def test_health_endpoint(self):
        data = health()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["service"], "scamshield-ai")

    def test_predict_scam_message(self):
        req = PredictionRequest(
            message="Your bank account will be blocked today. Click this link to verify your OTP immediately: http://bank-update.xyz"
        )
        data = predict(req)
        self.assertEqual(data["prediction"], "scam")
        self.assertEqual(data["riskLevel"], "HIGH")
        self.assertGreaterEqual(data["riskScore"], 70)
        self.assertTrue(len(data["patterns"]) > 0)
        self.assertEqual(len(data["extractedUrls"]), 1)
        self.assertIn("urlAnalysis", data)
        self.assertGreaterEqual(len(data["urlAnalysis"]), 1)
        self.assertIn("urlRiskScore", data)
        self.assertIn("recommendation", data)

    def test_predict_safe_message(self):
        req = PredictionRequest(
            message="Your appointment is confirmed for tomorrow at 10 AM. Thank you."
        )
        data = predict(req)
        self.assertEqual(data["prediction"], "normal")
        self.assertEqual(data["riskLevel"], "LOW")
        self.assertLess(data["riskScore"], 40)
        self.assertEqual(len(data["urlAnalysis"]), 0)

    def test_predict_empty_message(self):
        with self.assertRaises(HTTPException) as ctx:
            predict(PredictionRequest(message="   "))
        self.assertEqual(ctx.exception.status_code, 400)

if __name__ == "__main__":
    unittest.main()
