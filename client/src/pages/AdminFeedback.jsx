import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllFeedback, getFeedbackStats, deleteFeedback } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  Filter,
  Lock,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function AdminFeedback() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'WRONG' | 'CORRECT'
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async (page = 1, filter = filterType) => {
    setLoading(true);
    setError('');
    try {
      let isCorrectParam = '';
      if (filter === 'CORRECT') isCorrectParam = 'true';
      if (filter === 'WRONG') isCorrectParam = 'false';

      const [listRes, statsRes] = await Promise.all([
        getAllFeedback(page, 25, isCorrectParam),
        getFeedbackStats(),
      ]);

      setFeedbacks(listRes.feedbacks || []);
      setPagination(listRes.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(statsRes);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load feedback data. Ensure you are signed in with an administrator account.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData(1, filterType);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    fetchData(1, newFilter);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user feedback record?')) return;
    setDeletingId(id);
    try {
      await deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
      if (stats) {
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete feedback entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportTrainingData = () => {
    if (!feedbacks.length) return;
    const trainingSamples = feedbacks.map((f) => ({
      message: f.message,
      predicted: f.predictedLabel,
      user_verified_label: f.isCorrect ? f.predictedLabel : f.userCorrection || 'normal',
      is_correct: f.isCorrect,
      comment: f.comment,
      submitted_at: f.createdAt,
    }));

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trainingSamples, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `scamshield_retraining_feedback_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!user || user.role !== 'admin') {
    return (
      <section className="history-section">
        <div className="empty-card">
          <div className="empty-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
            <Lock size={32} />
          </div>
          <h2>Admin Privileges Required</h2>
          <p>
            User feedback logs and dataset retraining archives are restricted to administrators.
            Sign in with an account having <code>admin</code> permissions to review user feedback.
          </p>
          <div className="empty-actions">
            <Link to="/scanner" className="button">
              <span>Go to Scanner</span>
              <ArrowRight size={16} />
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
            <MessageSquare size={26} color="#38bdf8" />
            <span>Prediction Feedback & Dataset Curation</span>
          </h1>
          <p className="history-subtitle">
            Admin console reviewing real-world user feedback, false positives/negatives, and active retraining samples.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchData(pagination.page, filterType)}
            className="button-secondary"
            disabled={loading}
            title="Refresh feedback entries"
          >
            <RefreshCw size={15} className={loading ? 'radar-spinner' : ''} style={{ width: 15, height: 15, borderWidth: 2 }} />
            <span>Refresh</span>
          </button>

          {feedbacks.length > 0 && (
            <button
              onClick={handleExportTrainingData}
              className="button-secondary"
              title="Export verified feedback for retraining"
            >
              <Download size={15} />
              <span>Export for Retraining</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Ribbon */}
      {stats && (
        <div className="history-stats-row">
          <div className="history-stat-card">
            <div className="history-stat-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
              <Layers size={20} />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-num">{stats.total}</span>
              <span className="history-stat-label">Total Reviews</span>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-num" style={{ color: '#34d399' }}>{stats.accuracyRate}%</span>
              <span className="history-stat-label">Reported Accuracy ({stats.correctCount})</span>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185' }}>
              <XCircle size={20} />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-num" style={{ color: '#fb7185' }}>{stats.wrongCount}</span>
              <span className="history-stat-label">Disagreements / Corrections</span>
            </div>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fcd34d' }}>
              <AlertTriangle size={20} />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-num" style={{ color: '#fcd34d' }}>{stats.falsePositives} FP / {stats.falseNegatives} FN</span>
              <span className="history-stat-label">False Positives / Negatives</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="history-controls">
        <div className="history-filter-pills">
          <button
            className={`filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => handleFilterChange('ALL')}
          >
            All Submissions ({stats?.total ?? 0})
          </button>
          <button
            className={`filter-pill ${filterType === 'WRONG' ? 'active' : ''}`}
            onClick={() => handleFilterChange('WRONG')}
          >
            ❌ Misclassified by AI ({stats?.wrongCount ?? 0})
          </button>
          <button
            className={`filter-pill ${filterType === 'CORRECT' ? 'active' : ''}`}
            onClick={() => handleFilterChange('CORRECT')}
          >
            ✅ Confirmed Correct ({stats?.correctCount ?? 0})
          </button>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="loading-container">
          <div className="radar-spinner" style={{ width: 44, height: 44 }} />
          <p>Loading model feedback archive...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon-wrap">
            <MessageSquare size={32} />
          </div>
          <h3>No Feedback Records Found</h3>
          <p>No user feedback matches your current filter selection.</p>
        </div>
      ) : (
        <div className="scans-list">
          {feedbacks.map((item) => (
            <div key={item._id} className="history-card">
              <div className="history-card-header">
                <div className="history-badges">
                  {item.isCorrect ? (
                    <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      <CheckCircle2 size={14} />
                      <span>USER CONFIRMED ACCURATE</span>
                    </span>
                  ) : (
                    <span className="badge badge-high" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                      <XCircle size={14} />
                      <span>USER FLAGGED AS WRONG</span>
                    </span>
                  )}

                  <span className="category-pill">
                    AI Predicted: <strong>{(item.predictedLabel || '').toUpperCase()}</strong> ({item.riskScore}%)
                  </span>

                  {!item.isCorrect && item.userCorrection && (
                    <span className="category-pill" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                      User Suggests: <strong>{(item.userCorrection).toUpperCase()}</strong>
                    </span>
                  )}
                </div>

                <span className="history-date">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="history-message-box">
                <p className="history-message-text expanded">
                  "{item.message}"
                </p>
              </div>

              {item.comment && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>User Note:</span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#cbd5e1' }}>{item.comment}</p>
                </div>
              )}

              <div className="history-card-footer">
                <span className="confidence-label">
                  Feedback ID: <code>{item._id}</code> • Submitter: <strong>{item.userId?.name || 'Anonymous User'}</strong>
                </span>

                <button
                  type="button"
                  className="delete-btn"
                  disabled={deletingId === item._id}
                  onClick={() => handleDelete(item._id)}
                  title="Remove feedback record"
                >
                  <Trash2 size={14} />
                  <span>{deletingId === item._id ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ))}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button-secondary"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchData(pagination.page - 1, filterType)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="button-secondary"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchData(pagination.page + 1, filterType)}
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
