import mongoose from 'mongoose';
import Scan from '../models/Scan.js';
import { predictMessage } from '../services/aiService.js';

export async function analyze(req, res) {
  try {
    const { message } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ message: 'Message is too long (maximum 5000 characters).' });
    }

    const trimmed = message.trim();
    const prediction = await predictMessage(trimmed);

    const patternsList = Array.isArray(prediction.patterns) ? prediction.patterns : [];
    const urlAnalysisList = Array.isArray(prediction.urlAnalysis) ? prediction.urlAnalysis : [];

    const scanData = {
      message: trimmed,
      prediction: prediction.prediction,
      riskScore: prediction.riskScore,
      riskLevel: prediction.riskLevel || 'LOW',
      confidence: prediction.confidence,
      category: prediction.category || 'other',
      decisionReason: prediction.decisionReason || '',
      patterns: patternsList,
      detectedPatterns: patternsList,
      extractedUrls: Array.isArray(prediction.extractedUrls) ? prediction.extractedUrls : [],
      urlAnalysis: urlAnalysisList,
      urlRiskScore: typeof prediction.urlRiskScore === 'number' ? prediction.urlRiskScore : 0,
      triggeredRules: Array.isArray(prediction.triggeredRules) ? prediction.triggeredRules : [],
      pipelineBreakdown: prediction.pipelineBreakdown || {},
      safetyVerification: prediction.safetyVerification || {},
      recommendation: prediction.recommendation || '',
      modelVersion: prediction.modelVersion || 'dual-pipeline-tfidf-logreg-v2.0',
      userId: req.user ? req.user._id : null,
    };

    const scan = await Scan.create(scanData);

    return res.json({
      ...prediction,
      urlAnalysis: urlAnalysisList,
      urlRiskScore: scanData.urlRiskScore,
      triggeredRules: scanData.triggeredRules,
      pipelineBreakdown: scanData.pipelineBreakdown,
      safetyVerification: scanData.safetyVerification,
      decisionReason: scanData.decisionReason,
      scanId: scan._id,
      createdAt: scan.createdAt,
    });
  } catch (error) {
    console.error('Scan analysis error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('AI service')) {
      return res.status(502).json({
        message: 'AI Service is unavailable. Please ensure the FastAPI service is running on port 8000.',
      });
    }
    return res.status(500).json({
      message: error.message || 'Analysis failed due to an internal server error.',
    });
  }
}

export async function getHistory(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Scan.countDocuments(filter),
    ]);

    return res.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return res.status(500).json({ message: 'Failed to retrieve scan history.' });
  }
}

export async function getScanById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid scan ID format.' });
    }

    const scan = await Scan.findById(req.params.id).lean();
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found.' });
    }

    const isOwner = scan.userId && req.user && scan.userId.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    // If scan belongs to a user, only that user or an admin can access it
    if (scan.userId && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this scan record.' });
    }

    return res.json(scan);
  } catch (error) {
    console.error('Error fetching scan details:', error);
    return res.status(500).json({ message: 'Failed to fetch scan details.' });
  }
}

export async function deleteScan(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid scan ID format.' });
    }

    const scan = await Scan.findById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found.' });
    }

    const isOwner = scan.userId && req.user && scan.userId.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to delete this scan.' });
    }

    await scan.deleteOne();
    return res.json({ message: 'Scan deleted successfully.', id: req.params.id });
  } catch (error) {
    console.error('Error deleting scan:', error);
    return res.status(500).json({ message: 'Failed to delete scan.' });
  }
}
