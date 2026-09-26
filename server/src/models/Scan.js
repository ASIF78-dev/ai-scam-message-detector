import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    prediction: {
      type: String,
      enum: ['normal', 'suspicious', 'scam'],
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      default: 'other',
    },
    patterns: {
      type: [String],
      default: [],
    },
    detectedPatterns: {
      type: [String],
      default: [],
    },
    extractedUrls: {
      type: [String],
      default: [],
    },
    urlAnalysis: [
      {
        url: { type: String, required: true },
        domain: { type: String, default: '' },
        hostname: { type: String, default: '' },
        protocol: { type: String, default: 'http:' },
        isHttps: { type: Boolean, default: false },
        riskScore: { type: Number, default: 0, min: 0, max: 100 },
        riskLevel: {
          type: String,
          enum: ['SAFE', 'SUSPICIOUS', 'DANGEROUS', 'LOW', 'MEDIUM', 'HIGH'],
          default: 'SAFE',
        },
        threatFlags: { type: [String], default: [] },
        reasons: { type: [String], default: [] },
      },
    ],
    urlRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    recommendation: {
      type: String,
      default: '',
    },
    decisionReason: {
      type: String,
      default: '',
    },
    modelVersion: {
      type: String,
      default: 'dual-pipeline-tfidf-logreg-v2.0',
    },
    triggeredRules: [
      {
        id: { type: String, default: '' },
        category: { type: String, default: '' },
        severity: { type: String, default: 'LOW' },
        points: { type: Number, default: 0 },
        description: { type: String, default: '' },
        matchedText: { type: String, default: '' },
        matchedEntity: { type: String, default: '' },
      },
    ],
    pipelineBreakdown: {
      mlScore: { type: Number, default: 0 },
      mlConfidence: { type: Number, default: 0 },
      ruleScore: { type: Number, default: 0 },
      mlWeight: { type: Number, default: 0.55 },
      ruleWeight: { type: Number, default: 0.45 },
      triggeredRulesCount: { type: Number, default: 0 },
    },
    safetyVerification: {
      isVerifiedSafe: { type: Boolean, default: false },
      safetyFace: { type: String, default: 'friendly_shield' },
      faceIcon: { type: String, default: '😊' },
      safetyStatus: { type: String, default: 'VERIFIED_SAFE' },
      safetyScore: { type: Number, default: 0 },
      verifiedChecks: { type: [String], default: [] },
      safetyMessage: { type: String, default: '' },
    },
    feedback: {
      submitted: {
        type: Boolean,
        default: false,
      },
      isCorrect: {
        type: Boolean,
        default: null,
      },
      userCorrection: {
        type: String,
        default: null,
      },
      comment: {
        type: String,
        default: '',
      },
      feedbackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user history retrieval ordered by date
scanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Scan', scanSchema);
