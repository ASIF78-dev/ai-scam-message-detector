import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RiskBadge({ level, score, showScore = true, showFace = false }) {
  const normalized = (level || 'LOW').toUpperCase();

  let badgeClass = 'badge-low';
  let label = 'SAFE / LOW RISK';
  let Icon = ShieldCheck;
  let faceIcon = '😊';

  if (normalized === 'HIGH' || normalized === 'SCAM') {
    badgeClass = 'badge-high';
    label = 'SCAM / HIGH RISK';
    Icon = ShieldAlert;
    faceIcon = '🚨';
  } else if (normalized === 'MEDIUM' || normalized === 'SUSPICIOUS') {
    badgeClass = 'badge-medium';
    label = 'SUSPICIOUS / MEDIUM';
    Icon = AlertTriangle;
    faceIcon = '😐';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {showFace && (
        <span className="badge-face" style={{ marginRight: 4, fontSize: '0.95rem' }} role="img" aria-label="Risk Face">
          {faceIcon}
        </span>
      )}
      <Icon size={15} strokeWidth={2.4} />
      <span className="badge-label">{label}</span>
      {showScore && typeof score === 'number' && (
        <span className="badge-score">({Math.round(score)}%)</span>
      )}
    </span>
  );
}

