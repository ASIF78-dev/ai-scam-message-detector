import { describe, it, expect } from 'vitest';
import React from 'react';
import RiskBadge from '../components/RiskBadge.jsx';

describe('RiskBadge Frontend Component Tests', () => {
  it('renders HIGH / SCAM threat badge correctly', () => {
    const badge = RiskBadge({ level: 'HIGH', score: 95, showScore: true });
    expect(badge.props.className).toContain('badge-high');
    
    // Find label child
    const children = React.Children.toArray(badge.props.children);
    const labelSpan = children.find(c => c.props?.className === 'badge-label');
    expect(labelSpan.props.children).toBe('SCAM / HIGH RISK');

    const scoreSpan = children.find(c => c.props?.className === 'badge-score');
    expect(scoreSpan.props.children).toEqual(['(', 95, '%)']);
  });

  it('renders MEDIUM / SUSPICIOUS threat badge correctly', () => {
    const badge = RiskBadge({ level: 'SUSPICIOUS', score: 55, showScore: true });
    expect(badge.props.className).toContain('badge-medium');

    const children = React.Children.toArray(badge.props.children);
    const labelSpan = children.find(c => c.props?.className === 'badge-label');
    expect(labelSpan.props.children).toBe('SUSPICIOUS / MEDIUM');
  });

  it('renders LOW / SAFE badge for benign predictions', () => {
    const badge = RiskBadge({ level: 'LOW', score: 8, showScore: true });
    expect(badge.props.className).toContain('badge-low');

    const children = React.Children.toArray(badge.props.children);
    const labelSpan = children.find(c => c.props?.className === 'badge-label');
    expect(labelSpan.props.children).toBe('SAFE / LOW RISK');
  });

  it('hides score when showScore is false', () => {
    const badge = RiskBadge({ level: 'HIGH', score: 99, showScore: false });
    const children = React.Children.toArray(badge.props.children);
    const scoreSpan = children.find(c => c?.props?.className === 'badge-score');
    expect(scoreSpan).toBeUndefined();
  });
});
