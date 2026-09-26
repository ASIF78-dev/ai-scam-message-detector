import unittest
from app.main import (
    extract_urls,
    analyze_single_url,
    analyze_urls,
)

class TestUrlAnalysisSuite(unittest.TestCase):
    """
    Exhaustive security testing for URL threat analysis, heuristic scanning,
    domain checks, HTTPS enforcement, IP-host detection, and brand impersonation.
    """

    def test_https_validation(self):
        # Clean HTTPS
        res_https = analyze_single_url("https://secure.example.com/portal")
        self.assertTrue(res_https["isHttps"])
        self.assertNotIn("insecure_http", res_https["threatFlags"])

        # Insecure HTTP
        res_http = analyze_single_url("http://portal.example.com")
        self.assertFalse(res_http["isHttps"])
        self.assertIn("insecure_http", res_http["threatFlags"])
        self.assertGreaterEqual(res_http["riskScore"], 25)

    def test_ip_address_host_detection(self):
        res = analyze_single_url("http://192.168.0.1/admin/login")
        self.assertIn("ip_address_host", res["threatFlags"])
        self.assertEqual(res["riskLevel"], "DANGEROUS")
        self.assertGreaterEqual(res["riskScore"], 75)

    def test_suspicious_tld_detection(self):
        suspicious_tlds = [
            ("https://claim-free-coins.xyz", ".xyz"),
            ("https://lottery-prize.top", ".top"),
            ("http://fast-cash.loan/apply", ".loan"),
            ("http://account-alert.cfd", ".cfd"),
        ]
        for url, tld in suspicious_tlds:
            with self.subTest(url=url, tld=tld):
                res = analyze_single_url(url)
                self.assertIn("suspicious_tld", res["threatFlags"])
                self.assertGreaterEqual(res["riskScore"], 25)

    def test_url_shorteners_detection(self):
        shorteners = [
            "https://bit.ly/3xYqz0",
            "http://tinyurl.com/prize99",
            "https://t.co/alert44",
            "https://is.gd/verifyMe",
            "https://ow.ly/claimNow",
        ]
        for url in shorteners:
            with self.subTest(url=url):
                res = analyze_single_url(url)
                self.assertIn("url_shortener", res["threatFlags"])
                self.assertGreaterEqual(res["riskScore"], 30)

    def test_brand_impersonation_detection(self):
        impersonation_cases = [
            ("http://sbi-kyc-online.xyz/update", "sbi"),
            ("https://paypal-security-alert.com/signin", "paypal"),
            ("http://hdfc-bank-verification.net/otp", "hdfc"),
            ("https://paytm-cashback-claim.org/reward", "paytm"),
            ("http://netflix-billing-reactivate.biz/sub", "netflix"),
        ]
        for url, brand in impersonation_cases:
            with self.subTest(url=url, brand=brand):
                res = analyze_single_url(url)
                self.assertIn("brand_impersonation", res["threatFlags"])
                self.assertIn(res["riskLevel"], ["SUSPICIOUS", "DANGEROUS"])
                self.assertGreaterEqual(res["riskScore"], 50)


    def test_suspicious_path_keywords(self):
        res = analyze_single_url("https://normal-looking-site.com/kyc-verification/login")
        self.assertIn("suspicious_path", res["threatFlags"])

    def test_mixed_urls_aggregation(self):
        urls = [
            "https://google.com",
            "http://phishing-sbi-portal.xyz/login",
            "https://amazon.com",
        ]
        analysis_list, max_risk = analyze_urls(urls)
        self.assertEqual(len(analysis_list), 3)
        self.assertEqual(max_risk, 100) # Dangerous phishing URL drives max score

    def test_extract_urls_from_complex_message(self):
        text = (
            "Hi user! Check out https://github.com for docs. Also visit "
            "http://scam.tk/reward and click www.apple.com for support. Thank you!"
        )
        extracted = extract_urls(text)
        self.assertEqual(len(extracted), 3)
        self.assertIn("https://github.com", extracted)
        self.assertIn("http://scam.tk/reward", extracted)
        self.assertIn("www.apple.com", extracted)

    def test_clean_safe_domain_has_zero_or_low_risk(self):
        res = analyze_single_url("https://microsoft.com/en-us/")
        self.assertEqual(res["riskLevel"], "SAFE")
        self.assertEqual(res["riskScore"], 0)
        self.assertEqual(len(res["threatFlags"]), 0)

if __name__ == "__main__":
    unittest.main()
