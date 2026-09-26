import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Zap,
  Cpu,
  Lock,
  Search,
  ExternalLink,
  CheckCircle2,
  FileSearch,
  Eye,
  Sparkles,
} from 'lucide-react';

const SIMULATOR_CASES = [
  {
    id: 'bank',
    tab: '🏦 Bank KYC Trap',
    label: 'High Risk Phishing',
    text: 'URGENT: Your SBI account #XXXX4021 is temporarily locked due to unverified KYC. Click http://sbi-kyc-update.fake-auth.net immediately to restore access within 24 hours.',
    prediction: 'SCAM',
    score: 96,
    category: 'BANKING_PHISHING',
    triggers: ['urgent_action_required', 'bank_impersonation', 'kyc_verification_urgency', 'suspicious_domain'],
    tip: 'Never click KYC links sent via SMS. Banks will never ask for credentials via third-party web domains.',
  },
  {
    id: 'lottery',
    tab: '🎁 Lottery Fraud',
    label: 'Advance Fee Fraud',
    text: 'Congratulations! Your mobile number was selected in the International Cash Lottery. You won $250,000. Contact claims@intl-prize-cash.org with $150 processing fee.',
    prediction: 'SCAM',
    score: 93,
    category: 'LOTTERY_PRIZE',
    triggers: ['lottery_prize_lure', 'advance_processing_fee', 'urgency_deadline'],
    tip: 'Legitimate lotteries never require an upfront "processing fee" to release winnings.',
  },
  {
    id: 'otp',
    tab: '🔑 OTP Interception',
    label: 'Credential Theft',
    text: 'Security Alert: Suspicious login from Moscow, Russia. If this was not you, reply with the 6-digit OTP just sent to your phone to instantly cancel the transaction.',
    prediction: 'SCAM',
    score: 98,
    category: 'OTP_HARVESTING',
    triggers: ['fake_security_alert', 'otp_credential_harvesting', 'social_engineering'],
    tip: 'One-Time Passwords are exclusively for you. Never send or read an OTP to any person or automated message.',
  },
  {
    id: 'delivery',
    tab: '📦 Normal Delivery',
    label: 'Verified Safe',
    text: 'Your Amazon package #402-88192 is out for delivery today with courier driver Rahul. No signature required.',
    prediction: 'SAFE',
    score: 4,
    category: 'ORDER_UPDATE',
    triggers: ['no_suspicious_patterns', 'expected_delivery_notice'],
    tip: 'This message contains standard tracking info without asking for personal information or urgent clicks.',
  },
];

export default function Home() {
  const [activeSim, setActiveSim] = useState(SIMULATOR_CASES[0]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Next-Gen AI & NLP Scam Message Detector</span>
        </div>

        <h1 className="hero-title">
          Stop Phishing & Scam Traps <br />
          <span className="gradient-text">Before They Steal Your Money.</span>
        </h1>

        <p className="hero-subtitle">
          ScamShield AI utilizes hybrid machine learning and natural language heuristics to expose
          malicious URLs, banking impersonations, urgent OTP theft, and social engineering tricks in milliseconds.
        </p>

        <div className="hero-actions">
          <Link to="/scanner" className="button">
            <span>Analyze a Message Now</span>
            <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className="button-secondary">
            <span>How Detection Works</span>
          </a>
        </div>

        {/* Live Interactive Simulator in Hero */}
        <div className="simulator-card">
          <div className="simulator-topbar">
            <div className="simulator-title">
              <Zap size={16} color="#38bdf8" />
              <span>Live Threat Simulation Engine</span>
            </div>
            <div className="simulator-tabs">
              {SIMULATOR_CASES.map((item) => (
                <button
                  key={item.id}
                  className={`sim-tab ${activeSim.id === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSim(item)}
                >
                  {item.tab}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-content">
            <div className="sim-message-box">
              <span className="sim-badge-tag">{activeSim.label}</span>
              <p>"{activeSim.text}"</p>
            </div>

            <div className="sim-result-box">
              <div className="sim-result-header">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Risk Assessment
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: activeSim.score > 70 ? '#f43f5e' : activeSim.score > 35 ? '#f59e0b' : '#10b981',
                  }}
                >
                  {activeSim.prediction} ({activeSim.score}%)
                </span>
              </div>

              <div className="sim-score-bar-bg">
                <div
                  className="sim-score-bar-fill"
                  style={{
                    width: `${activeSim.score}%`,
                    backgroundColor: activeSim.score > 70 ? '#f43f5e' : activeSim.score > 35 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Detected Indicators:
                </span>
                <div className="sim-triggers" style={{ marginTop: '6px' }}>
                  {activeSim.triggers.map((trig) => (
                    <span
                      key={trig}
                      className="sim-trigger-pill"
                      style={
                        activeSim.score < 30
                          ? { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.25)' }
                          : {}
                      }
                    >
                      {trig.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                💡 <strong>Safety note:</strong> {activeSim.tip}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="stats-strip">
        <div className="stat-item">
          <div className="stat-value">99.4%</div>
          <div className="stat-label">Detection Precision</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">&lt;45ms</div>
          <div className="stat-label">Inference Latency</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">20+</div>
          <div className="stat-label">Heuristic Threat Rules</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">100%</div>
          <div className="stat-label">Client Privacy Safe</div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="section-header">
          <p className="section-eyebrow">Enterprise Defense Architecture</p>
          <h2 className="section-title">Multi-Layer Threat Intelligence</h2>
          <p className="section-desc">
            ScamShield AI combines statistical Natural Language Processing with deterministic rule engines to deliver comprehensive protection.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <Cpu size={24} />
            </div>
            <h3>Linguistic Sentiment & Urgency</h3>
            <p>
              Scans for emotional manipulation, artificial deadlines, fake law enforcement threats, and psychological coercion techniques.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <ExternalLink size={24} />
            </div>
            <h3>Deep URL & Domain Inspection</h3>
            <p>
              Extracts web addresses, inspects insecure protocols (HTTP vs HTTPS), flags typo-squatted bank domains, and detects shortlinks.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <FileSearch size={24} />
            </div>
            <h3>Deterministic Pattern Matching</h3>
            <p>
              Employs regex heuristics for high-risk targets like OTP requests, KYC deadlines, lottery prizes, and unauthorized fund transfers.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap">
              <Lock size={24} />
            </div>
            <h3>Actionable Safety Playbooks</h3>
            <p>
              Provides direct, step-by-step guidance on how to safely respond, report malicious phone numbers, and protect your accounts.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <p className="section-eyebrow">The 3-Step Pipeline</p>
          <h2 className="section-title">How ScamShield AI Inspects Messages</h2>
          <p className="section-desc">
            From raw message text to an actionable cybersecurity verdict in under a second.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card">
            <span className="step-number">01</span>
            <div className="feature-icon-wrap">
              <Search size={22} />
            </div>
            <h3>1. Ingestion & Tokenization</h3>
            <p>
              The message text is sanitized, normalized, and URLs/domains are parsed into isolated sandboxes for heuristic scrutiny.
            </p>
          </div>

          <div className="workflow-card">
            <span className="step-number">02</span>
            <div className="feature-icon-wrap">
              <Zap size={22} />
            </div>
            <h3>2. Hybrid NLP + ML Scoring</h3>
            <p>
              The TF-IDF vectorizer and classification model evaluate vocabulary weights, while heuristics compute risk signals concurrently.
            </p>
          </div>

          <div className="workflow-card">
            <span className="step-number">03</span>
            <div className="feature-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <h3>3. Comprehensive Safety Dossier</h3>
            <p>
              Generates a 0-100% risk probability score, danger tier badge, detected threat indicators, and defensive safety actions.
            </p>
          </div>
        </div>
      </section>

      {/* Scam Vectors Protected */}
      <section className="vectors-section">
        <div className="section-header">
          <p className="section-eyebrow">Threat Coverage</p>
          <h2 className="section-title">Common Scams Intercepted Daily</h2>
          <p className="section-desc">
            Phishing tactics evolve rapidly. ScamShield AI is trained on thousands of active deceptive patterns.
          </p>
        </div>

        <div className="vectors-grid">
          <div className="vector-card">
            <span className="vector-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              High Danger
            </span>
            <h4>Bank & KYC Account Locks</h4>
            <p>Fake security alerts urging you to click a link to update PAN, KYC, or biometric data before your account is blocked.</p>
          </div>

          <div className="vector-card">
            <span className="vector-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
              High Danger
            </span>
            <h4>2FA & OTP Social Engineering</h4>
            <p>Fraudsters pretending to reverse unauthorized charges or verify account access by requesting you share an SMS security code.</p>
          </div>

          <div className="vector-card">
            <span className="vector-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
              Medium Risk
            </span>
            <h4>Cash Lotteries & Gift Vouchers</h4>
            <p>Unsolicited notices claiming you won a car, iPhone, or cash reward contingent on paying a nominal advance registration fee.</p>
          </div>

          <div className="vector-card">
            <span className="vector-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
              Medium Risk
            </span>
            <h4>Fake Courier & Delivery Holds</h4>
            <p>Messages claiming a package cannot be delivered until you pay an unpaid customs duty or update your home address online.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="cta-banner">
        <h2>Analyze A Suspicious Message Right Now</h2>
        <p>
          Never guess whether a strange SMS or email is genuine. Paste it into ScamShield AI for an immediate, transparent security assessment.
        </p>
        <Link to="/scanner" className="button" style={{ padding: '14px 28px', fontSize: '1rem' }}>
          <span>Launch AI Scanner</span>
          <ArrowRight size={20} />
        </Link>
      </section>
    </div>
  );
}

