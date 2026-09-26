import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeMessage, submitFeedback } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import {
  ScanLine,
  Sparkles,
  ClipboardPaste,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers,
  Cpu,
  Lock,
  Unlock,
  Globe,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react';

const SAMPLE_MESSAGES = [
  {
    label: 'Bank KYC Threat',
    tag: 'High Risk',
    tagClass: 'chip-tag-high',
    text: 'Your bank account will be blocked today. Click this link immediately to complete your KYC verification: http://bank-secure-update.fake-auth.com',
  },
  {
    label: 'Lottery Cash Reward',
    tag: 'High Risk',
    tagClass: 'chip-tag-high',
    text: 'Congratulations! You have won a lottery prize of Rs 10,00,000. Send Rs 500 processing fee to claim your cash reward now.',
  },
  {
    label: 'OTP Security Urgency',
    tag: 'High Risk',
    tagClass: 'chip-tag-high',
    text: 'URGENT: Unusual activity detected in your account. Send the OTP received on your phone immediately to avoid permanent suspension.',
  },
  {
    label: 'Work-from-Home Bait',
    tag: 'Suspicious',
    tagClass: 'chip-tag-high',
    text: 'Earn $300-$800 daily by liking YouTube videos. No experience required. Message +1-829-441-2019 on Telegram immediately.',
  },
  {
    label: 'Courier Delivery Note',
    tag: 'Safe',
    tagClass: 'chip-tag-safe',
    text: 'Your package with tracking number #FEDX-99201 has been dispatched and will arrive tomorrow by 5 PM. Thank you for your order.',
  },
];

const SCAN_STEPS = [
  'Sanitizing tokens & payload...',
  'Extracting hyperlinks & protocols...',
  'Evaluating semantic urgency & emotion...',
  'Scoring against ML threat vectors...',
];

export default function Scanner() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // Feedback state
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(null); // 'correct' | 'wrong'
  const [userCorrection, setUserCorrection] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const { user } = useAuth();

  const resetFeedbackState = () => {
    setFeedbackSent(false);
    setFeedbackStatus(null);
    setUserCorrection('');
    setFeedbackComment('');
    setFeedbackMessage('');
  };

  const handleSampleClick = (text) => {
    setMessage(text);
    setError('');
    setResult(null);
    resetFeedbackState();
  };

  const handleClear = () => {
    setMessage('');
    setResult(null);
    setError('');
    resetFeedbackState();
  };

  const handleFeedbackClick = async (isCorrect) => {
    if (!result?.scanId) return;

    if (isCorrect) {
      setSubmittingFeedback(true);
      try {
        await submitFeedback({
          scanId: result.scanId,
          isCorrect: true,
        });
        setFeedbackSent(true);
        setFeedbackStatus('correct');
        setFeedbackMessage('Thank you! Feedback recorded — helping improve ScamShield AI accuracy.');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to submit feedback.');
      } finally {
        setSubmittingFeedback(false);
      }
    } else {
      setFeedbackStatus('wrong');
      const currentPred = (result.prediction || '').toLowerCase();
      if (currentPred === 'scam' || currentPred === 'suspicious') {
        setUserCorrection('normal');
      } else {
        setUserCorrection('scam');
      }
    }
  };

  const handleWrongFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!result?.scanId) return;

    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        scanId: result.scanId,
        isCorrect: false,
        userCorrection: userCorrection || 'normal',
        comment: feedbackComment,
      });
      setFeedbackSent(true);
      setFeedbackMessage('Thank you! Correction logged for dataset auditing and model retraining.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setMessage(clipText);
        setError('');
        setResult(null);
      }
    } catch {
      setError('Clipboard access was denied by your browser. Please paste manually.');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `[ScamShield AI Threat Report]
Verdict: ${(result.riskLevel || result.prediction).toUpperCase()} (${result.riskScore}%)
Category: ${result.category || 'General'}
Confidence: ${result.confidence}%
Model: ${result.modelVersion || 'TF-IDF Logistic Regression'}
Detected Signals: ${(result.patterns || []).join(', ') || 'None'}
URLs Extracted: ${(result.extractedUrls || []).join(', ') || 'None'}
Recommendation: ${result.recommendation || 'No recommendation specified.'}
Message Analyzed: "${message}"`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    resetFeedbackState();

    if (!message.trim()) {
      return setError('Please paste or type a message to analyze.');
    }

    setLoading(true);
    try {
      const data = await analyzeMessage(message.trim());
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not analyze message. Please check that the server and AI service are running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // SVG circular gauge calculation
  const score = result ? Math.min(100, Math.max(0, result.riskScore)) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = '#10b981';
  let borderClass = 'safe-border';
  if (score >= 60 || result?.riskLevel === 'HIGH' || result?.prediction === 'scam') {
    gaugeColor = '#f43f5e';
    borderClass = 'scam-border';
  } else if (score >= 30 || result?.riskLevel === 'MEDIUM' || result?.prediction === 'suspicious') {
    gaugeColor = '#f59e0b';
    borderClass = 'suspicious-border';
  }

  return (
    <section className="scanner-container">
      <div className="scanner-header">
        <h1>
          <ScanLine size={28} color="#38bdf8" />
          <span>AI Threat Scanner Console</span>
        </h1>
        <p className="scanner-subtitle">
          Inspect suspicious SMS, WhatsApp messages, phishing emails, or direct messages. Our multi-layer AI
          evaluates emotional pressure, domain reputation, and credential harvesting patterns.
        </p>
      </div>

      {/* Preset Samples */}
      <div className="sample-chips">
        <span className="sample-label">Quick test presets:</span>
        {SAMPLE_MESSAGES.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSampleClick(sample.text)}
          >
            <span className={`chip-tag ${sample.tagClass}`}>{sample.tag}</span>
            <span>{sample.label}</span>
          </button>
        ))}
      </div>

      {/* Input Workstation Form */}
      <form onSubmit={handleSubmit} className="scanner-card">
        <textarea
          className="scanner-textarea"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste or type suspicious message text, phishing email body, or SMS here..."
          maxLength={5000}
        />

        <div className="form-toolbar">
          <div className="toolbar-left">
            <span className="char-count">{message.length} / 5000 chars</span>
          </div>

          <div className="toolbar-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={handlePasteClipboard}
              disabled={loading}
              title="Paste text from clipboard"
            >
              <ClipboardPaste size={16} />
              <span>Paste</span>
            </button>

            {message && (
              <button
                type="button"
                className="button-secondary"
                onClick={handleClear}
                disabled={loading}
                title="Clear input"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            )}

            <button type="submit" className="button" disabled={loading}>
              {loading ? (
                <>
                  <RotateCcw size={16} className="radar-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span>Scanning Message...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Scan Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* High-Tech Radar Scanning State */}
      {loading && (
        <div className="scanning-state-card">
          <div className="radar-spinner" />
          <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>Inspecting Message For Phishing Traps</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Running deep NLP vectorization, urgency heuristics, and URL sandboxing...
          </p>
          <div className="scanning-steps">
            {SCAN_STEPS.map((step, i) => (
              <span key={i} className="scanning-step-item">
                <CheckCircle2 size={13} color="#38bdf8" />
                <span>{step}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Result Dossier */}
      {result && (
        <div className={`result-card ${borderClass}`}>
          {/* Dossier Header */}
          <div className="dossier-header">
            <div className="dossier-headline">
              <span className="dossier-tag">Threat Intelligence Dossier</span>
              <div className="verdict-row">
                <RiskBadge level={result.riskLevel || result.prediction} score={result.riskScore} showFace={true} />
                <span className="category-pill">
                  Category: {result.category?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Circular SVG Gauge */}
            <div className="gauge-wrapper">
              <div className="gauge-circle">
                <svg className="gauge-svg" viewBox="0 0 72 72">
                  <circle className="gauge-bg" cx="36" cy="36" r={radius} />
                  <circle
                    className="gauge-fill"
                    cx="36"
                    cy="36"
                    r={radius}
                    stroke={gaugeColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-text">{result.riskScore}%</div>
              </div>
              <div className="gauge-info">
                <span className="gauge-title">Risk Probability</span>
                <span className="gauge-subtitle">
                  {result.riskScore >= 60 ? 'Malicious Vector' : result.riskScore >= 30 ? 'Suspicious Signal' : 'Minimal Risk'}
                </span>
              </div>
            </div>
          </div>

          {/* Safe Face Verification Banner */}
          {result.safetyVerification?.isVerifiedSafe && (
            <div className="safe-face-banner">
              <div className="safe-face-topbar">
                <div className="safe-face-avatar" role="img" aria-label="Verified Safe Face">
                  {result.safetyVerification.faceIcon || '😊'}
                </div>
                <div className="safe-face-title-group">
                  <h3>
                    <ShieldCheck size={20} color="#34d399" />
                    <span>Verified Safe Face · Safety Verification Passed</span>
                  </h3>
                  <p>{result.safetyVerification.safetyMessage}</p>
                </div>
              </div>

              {result.safetyVerification.verifiedChecks?.length > 0 && (
                <div className="safety-checklist-grid">
                  {result.safetyVerification.verifiedChecks.map((check, idx) => (
                    <div key={idx} className="safety-check-item">
                      <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Decision Layer Rationale */}
          {result.decisionReason && (
            <div className="decision-rationale-box">
              <Layers size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="decision-rationale-text">
                <strong style={{ color: '#38bdf8' }}>Decision Layer Analysis: </strong>
                <span>{result.decisionReason}</span>
              </div>
            </div>
          )}

          {/* Dual-Pipeline Threat Intelligence Grid */}
          <div className="dual-pipeline-section">
            <h4 className="section-block-title">
              <Cpu size={16} color="#38bdf8" />
              <span>Dual-Pipeline Threat Intelligence Engine</span>
            </h4>
            <div className="dual-pipeline-grid">
              {/* Branch A: ML Classifier */}
              <div className="pipeline-card">
                <div className="pipeline-card-header">
                  <span className="pipeline-title">
                    <Cpu size={14} color="#818cf8" />
                    <span>ML Classifier</span>
                  </span>
                  <span className="pipeline-weight">55% Weight</span>
                </div>
                <div className="pipeline-metric-val" style={{ color: '#818cf8' }}>
                  {result.pipelineBreakdown?.mlScore ?? result.riskScore}%
                </div>
                <div className="pipeline-metric-desc">
                  NLP TF-IDF + Logistic Regression probability. Confidence: {result.pipelineBreakdown?.mlConfidence ?? result.confidence}%.
                </div>
              </div>

              {/* Branch B: Heuristic Rule Engine */}
              <div className="pipeline-card">
                <div className="pipeline-card-header">
                  <span className="pipeline-title">
                    <AlertTriangle size={14} color="#c084fc" />
                    <span>Rule Engine</span>
                  </span>
                  <span className="pipeline-weight">45% Weight</span>
                </div>
                <div className="pipeline-metric-val" style={{ color: '#c084fc' }}>
                  {result.pipelineBreakdown?.ruleScore ?? 0} pts
                </div>
                <div className="pipeline-metric-desc">
                  Multi-vector triggers: {result.triggeredRules?.length ?? result.patterns?.length ?? 0} heuristic rules evaluated (URL, urgency, OTP, payment, impersonation).
                </div>
              </div>

              {/* Branch C: Decision Layer Arbiter */}
              <div className="pipeline-card">
                <div className="pipeline-card-header">
                  <span className="pipeline-title">
                    <Layers size={14} color="#38bdf8" />
                    <span>Decision Arbiter</span>
                  </span>
                  <span className="pipeline-weight">3-Tier Arbiter</span>
                </div>
                <div className="pipeline-metric-val" style={{ color: gaugeColor }}>
                  {(result.riskLevel || result.prediction).toUpperCase()}
                </div>
                <div className="pipeline-metric-desc">
                  {result.isOverride ? 'Deterministic Critical Override (Veto).' : 'Calibrated Weighted Ensemble.'} Risk tier: {result.riskScore}%.
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">
                <Info size={14} />
                <span>Confidence</span>
              </span>
              <span className="metric-val">{result.confidence}%</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                <Layers size={14} />
                <span>Classification</span>
              </span>
              <span className="metric-val" style={{ textTransform: 'capitalize' }}>
                {result.prediction}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                <Cpu size={14} />
                <span>Model Engine</span>
              </span>
              <span className="metric-val" style={{ fontSize: '0.95rem', fontFamily: 'JetBrains Mono' }}>
                {result.modelVersion || 'TF-IDF Logistic Reg'}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                <Lock size={14} />
                <span>Risk Level</span>
              </span>
              <span className="metric-val" style={{ color: gaugeColor }}>
                {(result.riskLevel || result.prediction).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Detected Risk Signals */}
          {result.patterns && result.patterns.length > 0 && (
            <div className="section-block">
              <h4 className="section-block-title">
                <AlertTriangle size={16} color="#fb7185" />
                <span>Detected Threat Indicators ({result.patterns.length})</span>
              </h4>
              <div className="signals-grid">
                {result.patterns.map((pat) => (
                  <div key={pat} className="signal-pill-card">
                    <div className="signal-pill-header">
                      <span>⚠️</span>
                      <span>{pat.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="signal-pill-desc">
                      Pattern triggered by known phishing heuristics or high-pressure language.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Threat Inspection & Domain Security Dossier */}
          {((result.urlAnalysis && result.urlAnalysis.length > 0) || (result.extractedUrls && result.extractedUrls.length > 0)) && (
            <div className="section-block">
              <h4 className="section-block-title">
                <Globe size={18} color="#38bdf8" />
                <span>URL Threat Inspection & Domain Checks ({result.urlAnalysis?.length || result.extractedUrls.length})</span>
              </h4>

              {/* Summary Strip */}
              <div className="url-summary-strip">
                <div className="url-summary-left">
                  <span className="url-summary-count">
                    {result.urlAnalysis?.length || result.extractedUrls.length} Hyperlink{(result.urlAnalysis?.length || result.extractedUrls.length) > 1 ? 's' : ''} Analyzed
                  </span>
                  <span>•</span>
                  <span>
                    URL Threat Level: <strong>{result.urlRiskScore ?? Math.round(result.riskScore)}%</strong>
                  </span>
                </div>
                <div>
                  {result.urlAnalysis?.some((u) => !u.isHttps) ? (
                    <span className="url-flag-chip chip-http">
                      <Unlock size={12} />
                      <span>Unencrypted HTTP Detected</span>
                    </span>
                  ) : (
                    <span className="url-risk-score-badge safe" style={{ padding: '2px 8px' }}>
                      <Lock size={12} />
                      <span>All Links Encrypted (HTTPS)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Critical Alert if any URL is DANGEROUS */}
              {result.urlAnalysis?.some((u) => u.riskLevel === 'DANGEROUS') && (
                <div className="url-critical-warning-banner" style={{ marginBottom: '12px' }}>
                  <AlertOctagon size={18} />
                  <span>
                    CRITICAL WARNING: High-risk phishing, typosquatted, or raw IP link identified. Do not click or input confidential information.
                  </span>
                </div>
              )}

              {/* Detailed URL Cards */}
              <div className="url-sandbox-list">
                {(result.urlAnalysis && result.urlAnalysis.length > 0
                  ? result.urlAnalysis
                  : (result.extractedUrls || []).map((u) => ({
                      url: u,
                      domain: u.replace(/^https?:\/\//, '').split('/')[0],
                      hostname: u.replace(/^https?:\/\//, '').split('/')[0],
                      isHttps: u.toLowerCase().startsWith('https://'),
                      protocol: u.toLowerCase().startsWith('https://') ? 'https:' : 'http:',
                      riskScore: u.toLowerCase().startsWith('http://') ? 35 : 10,
                      riskLevel: u.toLowerCase().startsWith('http://') ? 'SUSPICIOUS' : 'SAFE',
                      threatFlags: u.toLowerCase().startsWith('http://') ? ['insecure_http'] : [],
                      reasons: [
                        u.toLowerCase().startsWith('http://')
                          ? 'Insecure HTTP protocol transmission.'
                          : 'Standard encrypted HTTPS connection.',
                      ],
                    }))
                ).map((item, i) => {
                  const cardClass =
                    item.riskLevel === 'DANGEROUS'
                      ? 'url-danger'
                      : item.riskLevel === 'SUSPICIOUS'
                      ? 'url-suspicious'
                      : 'url-safe';

                  const badgeClass =
                    item.riskLevel === 'DANGEROUS'
                      ? 'danger'
                      : item.riskLevel === 'SUSPICIOUS'
                      ? 'suspicious'
                      : 'safe';

                  return (
                    <div key={i} className={`url-threat-card ${cardClass}`}>
                      {/* Top Bar: Badges, Domain, Risk Score */}
                      <div className="url-threat-topbar">
                        <div className="url-threat-badges">
                          <span className={`protocol-badge ${item.isHttps ? 'protocol-https' : 'protocol-http'}`}>
                            {item.isHttps ? 'HTTPS ENCRYPTED' : 'INSECURE HTTP'}
                          </span>
                          <span className="url-domain-tag">
                            Host: {item.hostname || item.domain || 'N/A'}
                          </span>
                        </div>

                        <span className={`url-risk-score-badge ${badgeClass}`}>
                          {item.riskLevel === 'DANGEROUS' ? (
                            <ShieldAlert size={14} />
                          ) : item.riskLevel === 'SUSPICIOUS' ? (
                            <AlertTriangle size={14} />
                          ) : (
                            <ShieldCheck size={14} />
                          )}
                          <span>
                            {item.riskLevel} ({item.riskScore}%)
                          </span>
                        </span>
                      </div>

                      {/* Raw URL Display & Copy */}
                      <div className="url-raw-container">
                        <span className="url-raw-text">{item.url}</span>
                        <button
                          type="button"
                          className="button-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleCopyUrl(item.url)}
                          title="Copy URL to clipboard"
                        >
                          {copiedUrl === item.url ? (
                            <>
                              <Check size={13} color="#10b981" />
                              <span style={{ color: '#10b981' }}>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Threat Flags */}
                      {item.threatFlags && item.threatFlags.length > 0 && (
                        <div className="url-flags-row">
                          {item.threatFlags.map((flag) => (
                            <span
                              key={flag}
                              className={`url-flag-chip ${
                                flag === 'url_shortener'
                                  ? 'chip-shortener'
                                  : flag === 'insecure_http'
                                  ? 'chip-http'
                                  : ''
                              }`}
                            >
                              ⚠️ {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Detected Security Explanations / Reasons */}
                      {item.reasons && item.reasons.length > 0 && (
                        <div className="url-reasons-box">
                          {item.reasons.map((reason, rIdx) => (
                            <div key={rIdx} className="url-reason-item">
                              <span
                                style={{
                                  color:
                                    item.riskLevel === 'DANGEROUS'
                                      ? '#fb7185'
                                      : item.riskLevel === 'SUSPICIOUS'
                                      ? '#fcd34d'
                                      : '#34d399',
                                }}
                              >
                                •
                              </span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Safety Playbook / Recommendation */}
          {result.recommendation && (
            <div
              className={`playbook-card ${
                result.riskScore >= 60
                  ? 'playbook-danger'
                  : result.riskScore >= 30
                  ? 'playbook-warning'
                  : 'playbook-safe'
              }`}
            >
              <div className="playbook-header">
                {result.riskScore >= 60 ? (
                  <ShieldAlert size={20} />
                ) : result.riskScore >= 30 ? (
                  <AlertTriangle size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
                <span>Recommended Defense Action</span>
              </div>
              <p className="playbook-body">{result.recommendation}</p>
            </div>
          )}

          {/* User Prediction Feedback Section */}
          <div className="feedback-container-card">
            <div className="feedback-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="#38bdf8" />
                <span className="feedback-title">Model Prediction Feedback</span>
              </div>
              <span className="feedback-subtitle">Was this AI classification accurate?</span>
            </div>

            {feedbackSent ? (
              <div className="feedback-success-banner">
                <CheckCircle2 size={18} color="#10b981" />
                <span>{feedbackMessage}</span>
              </div>
            ) : feedbackStatus === 'wrong' ? (
              <form onSubmit={handleWrongFeedbackSubmit} className="feedback-correction-form">
                <p className="correction-intro">
                  Help us retrain our threat models. What should the actual classification be?
                </p>

                <div className="correction-options">
                  <label className={`correction-label ${userCorrection === 'normal' ? 'selected safe' : ''}`}>
                    <input
                      type="radio"
                      name="userCorrection"
                      value="normal"
                      checked={userCorrection === 'normal'}
                      onChange={() => setUserCorrection('normal')}
                    />
                    <span>🟢 Safe / Legitimate</span>
                  </label>

                  <label className={`correction-label ${userCorrection === 'suspicious' ? 'selected suspicious' : ''}`}>
                    <input
                      type="radio"
                      name="userCorrection"
                      value="suspicious"
                      checked={userCorrection === 'suspicious'}
                      onChange={() => setUserCorrection('suspicious')}
                    />
                    <span>🟡 Suspicious / Unclear</span>
                  </label>

                  <label className={`correction-label ${userCorrection === 'scam' ? 'selected scam' : ''}`}>
                    <input
                      type="radio"
                      name="userCorrection"
                      value="scam"
                      checked={userCorrection === 'scam'}
                      onChange={() => setUserCorrection('scam')}
                    />
                    <span>🔴 Scam / Malicious Phishing</span>
                  </label>
                </div>

                <div className="correction-comment-wrap">
                  <input
                    type="text"
                    className="correction-input"
                    placeholder="Optional: Detail why (e.g. 'Normal bank SMS', 'Phishing gift lure')..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="correction-actions">
                  <button
                    type="submit"
                    className="button"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                    disabled={submittingFeedback}
                  >
                    <span>{submittingFeedback ? 'Submitting...' : 'Submit Correction'}</span>
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => setFeedbackStatus(null)}
                    disabled={submittingFeedback}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="feedback-buttons-row">
                <button
                  type="button"
                  className="feedback-btn feedback-btn-correct"
                  onClick={() => handleFeedbackClick(true)}
                  disabled={submittingFeedback || !result.scanId}
                  title="Mark this prediction as correct"
                >
                  <span style={{ fontSize: '1.1rem' }}>✅</span>
                  <span>Correct prediction</span>
                </button>

                <button
                  type="button"
                  className="feedback-btn feedback-btn-wrong"
                  onClick={() => handleFeedbackClick(false)}
                  disabled={submittingFeedback || !result.scanId}
                  title="Mark this prediction as incorrect and submit correction"
                >
                  <span style={{ fontSize: '1.1rem' }}>❌</span>
                  <span>Wrong prediction</span>
                </button>
              </div>
            )}
          </div>

          {/* Actions Toolbar */}
          <div className="dossier-actions">
            <div>
              {user ? (
                <span className="status-save-msg">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>Scan automatically archived in your <Link to="/history">Threat History</Link>.</span>
                </span>
              ) : (
                <span className="status-save-msg">
                  <Info size={16} color="#38bdf8" />
                  <span>Want to persist your scan logs? <Link to="/login">Sign in</Link> or <Link to="/register">Create an account</Link>.</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="button-secondary"
                onClick={handleCopyReport}
                title="Copy formatted security summary"
              >
                {copiedReport ? (
                  <>
                    <Check size={16} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Report Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Dossier</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={handleClear}
                title="Reset scanner for another message"
              >
                <RotateCcw size={16} />
                <span>Scan Another</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

