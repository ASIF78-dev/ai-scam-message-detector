import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getScanHistory, deleteScan } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import {
  History as HistoryIcon,
  Shield,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Lock,
  ChevronDown,
  ChevronUp,
  Inbox,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedScan, setExpandedScan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await getScanHistory(page, 30);
      setScans(data.scans || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory(1);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan record from your security history?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteScan(id);
      setScans((prev) => prev.filter((s) => s._id !== id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete scan.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedScan((prev) => (prev === id ? null : id));
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleExportJson = () => {
    if (!scans.length) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scamshield_scan_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered Scans based on search query & severity filter
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const query = searchQuery.toLowerCase().trim();
      const messageMatches = !query || scan.message?.toLowerCase().includes(query) || (scan.extractedUrls || []).some(u => u.toLowerCase().includes(query));

      if (!messageMatches) return false;

      const level = (scan.riskLevel || scan.prediction || 'LOW').toUpperCase();
      if (filterSeverity === 'HIGH') {
        return level === 'HIGH' || level === 'SCAM';
      } else if (filterSeverity === 'MEDIUM') {
        return level === 'MEDIUM' || level === 'SUSPICIOUS';
      } else if (filterSeverity === 'LOW') {
        return level === 'LOW' || level === 'SAFE' || level === 'NORMAL';
      }
      return true;
    });
  }, [scans, searchQuery, filterSeverity]);

  // Aggregate stats
  const stats = useMemo(() => {
    let scamCount = 0;
    let suspiciousCount = 0;
    let safeCount = 0;

    scans.forEach((s) => {
      const lvl = (s.riskLevel || s.prediction || 'LOW').toUpperCase();
      if (lvl === 'HIGH' || lvl === 'SCAM') scamCount++;
      else if (lvl === 'MEDIUM' || lvl === 'SUSPICIOUS') suspiciousCount++;
      else safeCount++;
    });

    return { total: pagination.total || scans.length, scamCount, suspiciousCount, safeCount };
  }, [scans, pagination.total]);

  if (!user) {
    return (
      <section className="history-section">
        <div className="empty-card">
          <div className="empty-icon-wrap">
            <Lock size={32} />
          </div>
          <h2>Authentication Required</h2>
          <p>
            Scan logs are encrypted and tied to your personal account. Sign in to review your past scam investigations, threat categories, and extracted malicious URLs.
          </p>
          <div className="empty-actions">
            <Link to="/login" className="button">
              <span>Sign In</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="button-secondary">
              <span>Create Free Account</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="history-section">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>
            <HistoryIcon size={26} color="#38bdf8" />
            <span>Threat Intelligence History</span>
          </h1>
          <p className="history-subtitle">
            Search, filter, and review all previous message investigations and security reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchHistory(pagination.page)}
            className="button-secondary"
            disabled={loading}
            title="Reload scan history from server"
          >
            <RefreshCw size={15} className={loading ? 'radar-spinner' : ''} style={{ width: 15, height: 15, borderWidth: 2 }} />
            <span>Refresh</span>
          </button>

          {scans.length > 0 && (
            <button
              onClick={handleExportJson}
              className="button-secondary"
              title="Download your scan history as JSON"
            >
              <Download size={15} />
              <span>Export Logs</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Summary Statistics Strip */}
      <div className="history-stats-row">
        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Layers size={20} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-num">{stats.total}</span>
            <span className="history-stat-label">Total Messages</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185' }}>
            <ShieldAlert size={20} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-num" style={{ color: '#fb7185' }}>{stats.scamCount}</span>
            <span className="history-stat-label">Scams Blocked</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fcd34d' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-num" style={{ color: '#fcd34d' }}>{stats.suspiciousCount}</span>
            <span className="history-stat-label">Suspicious</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="history-stat-info">
            <span className="history-stat-num" style={{ color: '#34d399' }}>{stats.safeCount}</span>
            <span className="history-stat-label">Safe Verified</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="history-controls">
        <div className="history-search-wrap">
          <Search size={16} className="history-search-icon" />
          <input
            type="text"
            className="history-search-input"
            placeholder="Search keywords, URLs, or sender info..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="history-filter-pills">
          <button
            className={`filter-pill ${filterSeverity === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('ALL')}
          >
            All Logs
          </button>
          <button
            className={`filter-pill ${filterSeverity === 'HIGH' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('HIGH')}
          >
            High Risk / Scam
          </button>
          <button
            className={`filter-pill ${filterSeverity === 'MEDIUM' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('MEDIUM')}
          >
            Suspicious
          </button>
          <button
            className={`filter-pill ${filterSeverity === 'LOW' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('LOW')}
          >
            Safe
          </button>
        </div>
      </div>

      {/* Main Content / List */}
      {loading ? (
        <div className="loading-container">
          <div className="radar-spinner" style={{ width: 44, height: 44 }} />
          <p>Retrieving your scan history archive...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon-wrap">
            <Inbox size={32} />
          </div>
          <h3>No Scans Recorded Yet</h3>
          <p>You haven't scanned any suspicious messages yet. Test your first message to build your personal threat intelligence archive.</p>
          <Link to="/scanner" className="button">
            <span>Open AI Scanner</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon-wrap">
            <Search size={32} />
          </div>
          <h3>No Matching Records Found</h3>
          <p>No scans match your current search query or filter selection. Try changing the keywords or filter.</p>
          <button
            className="button-secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterSeverity('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="scans-list">
          {filteredScans.map((scan) => {
            const isExpanded = expandedScan === scan._id;
            const patterns = scan.patterns?.length ? scan.patterns : scan.detectedPatterns || [];

            return (
              <div key={scan._id} className="history-card">
                <div className="history-card-header">
                  <div className="history-badges">
                    <RiskBadge level={scan.riskLevel || scan.prediction} score={scan.riskScore} />
                    <span className="category-pill">
                      {scan.category?.replace(/_/g, ' ') || 'OTHER'}
                    </span>
                    {scan.feedback?.submitted && (
                      <span
                        className="category-pill"
                        style={{
                          background: scan.feedback.isCorrect
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(244, 63, 94, 0.15)',
                          color: scan.feedback.isCorrect ? '#34d399' : '#fb7185',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title={scan.feedback.comment ? `User note: ${scan.feedback.comment}` : undefined}
                      >
                        {scan.feedback.isCorrect
                          ? '✓ Verified Accurate'
                          : `⚠️ User Flagged: Should be ${(scan.feedback.userCorrection || 'Safe').toUpperCase()}`}
                      </span>
                    )}
                  </div>
                  <span className="history-date">
                    {new Date(scan.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="history-message-box">
                  <p className={`history-message-text ${isExpanded ? 'expanded' : 'truncated'}`}>
                    "{scan.message}"
                  </p>
                  {scan.message.length > 130 && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => toggleExpand(scan._id)}
                    >
                      {isExpanded ? (
                        <>
                          <span>Show less</span>
                          <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          <span>Read full message</span>
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {patterns.length > 0 && (
                  <div className="history-patterns">
                    {patterns.map((pat) => (
                      <span key={pat} className="pattern-pill-small">
                        ⚠️ {pat.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {((scan.urlAnalysis && scan.urlAnalysis.length > 0) || scan.extractedUrls?.length > 0) && (
                  <div className="history-urls">
                    <span className="urls-label">URLs Inspected:</span>
                    {(scan.urlAnalysis && scan.urlAnalysis.length > 0
                      ? scan.urlAnalysis
                      : scan.extractedUrls.map((u) => ({
                          url: u,
                          isHttps: u.toLowerCase().startsWith('https://'),
                          riskLevel: u.toLowerCase().startsWith('http://') ? 'SUSPICIOUS' : 'SAFE',
                          riskScore: u.toLowerCase().startsWith('http://') ? 35 : 10,
                          threatFlags: u.toLowerCase().startsWith('http://') ? ['insecure_http'] : [],
                        }))
                    ).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${
                            item.riskLevel === 'DANGEROUS'
                              ? 'rgba(244, 63, 94, 0.4)'
                              : item.riskLevel === 'SUSPICIOUS'
                              ? 'rgba(245, 158, 11, 0.4)'
                              : 'rgba(16, 185, 129, 0.3)'
                          }`,
                        }}
                      >
                        <span
                          className={`protocol-badge ${item.isHttps ? 'protocol-https' : 'protocol-http'}`}
                          style={{ fontSize: '0.65rem', padding: '1px 5px' }}
                        >
                          {item.isHttps ? 'HTTPS' : 'HTTP'}
                        </span>
                        <code className="url-tag">{item.url}</code>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color:
                              item.riskLevel === 'DANGEROUS'
                                ? '#fb7185'
                                : item.riskLevel === 'SUSPICIOUS'
                                ? '#fcd34d'
                                : '#34d399',
                          }}
                        >
                          {item.riskLevel} ({item.riskScore}%)
                        </span>
                        <button
                          type="button"
                          className="link-btn"
                          style={{ margin: 0, padding: '2px' }}
                          onClick={() => handleCopyUrl(item.url)}
                          title="Copy link"
                        >
                          {copiedUrl === item.url ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="history-card-footer">
                  <span className="confidence-label">
                    Confidence: <strong>{scan.confidence || scan.riskScore}%</strong> • Engine: <strong>{scan.modelVersion || 'TF-IDF'}</strong>
                  </span>
                  <button
                    type="button"
                    className="delete-btn"
                    disabled={deletingId === scan._id}
                    onClick={() => handleDelete(scan._id)}
                    title="Delete record permanently"
                  >
                    <Trash2 size={14} />
                    <span>{deletingId === scan._id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button-secondary"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchHistory(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="button-secondary"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchHistory(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

