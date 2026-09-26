import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import Scan from '../models/Scan.js';

export async function submitFeedback(req, res) {
  try {
    const { scanId, isCorrect, userCorrection, comment } = req.body;

    if (!scanId || !mongoose.isValidObjectId(scanId)) {
      return res.status(400).json({ message: 'Valid scanId is required.' });
    }

    if (typeof isCorrect !== 'boolean') {
      return res.status(400).json({ message: 'isCorrect must be a boolean (true or false).' });
    }

    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ message: 'Associated scan record not found.' });
    }

    // Check if feedback already recorded for this scan
    let feedback = await Feedback.findOne({ scanId });
    if (feedback) {
      // Update existing feedback
      feedback.isCorrect = isCorrect;
      feedback.userCorrection = isCorrect ? null : (userCorrection || null);
      feedback.comment = comment ? comment.trim() : '';
      if (req.user && !feedback.userId) {
        feedback.userId = req.user._id;
      }
      await feedback.save();
    } else {
      // Create new feedback entry
      feedback = await Feedback.create({
        scanId: scan._id,
        userId: req.user ? req.user._id : scan.userId || null,
        message: scan.message,
        predictedLabel: scan.prediction,
        riskScore: scan.riskScore,
        isCorrect,
        userCorrection: isCorrect ? null : (userCorrection || null),
        comment: comment ? comment.trim() : '',
      });
    }

    // Update scan record with feedback status
    scan.feedback = {
      submitted: true,
      isCorrect,
      userCorrection: feedback.userCorrection,
      comment: feedback.comment,
      feedbackId: feedback._id,
    };
    await scan.save();

    return res.status(201).json({
      message: 'Feedback submitted successfully. Thank you for improving ScamShield AI!',
      feedback,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return res.status(500).json({ message: 'Failed to record feedback.' });
  }
}

export async function getFeedbackStats(req, res) {
  try {
    const [total, correctCount, wrongCount] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ isCorrect: true }),
      Feedback.countDocuments({ isCorrect: false }),
    ]);

    const accuracyRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // False positives: predicted scam, user corrected to normal/safe
    const falsePositives = await Feedback.countDocuments({
      isCorrect: false,
      predictedLabel: 'scam',
      userCorrection: { $in: ['normal', 'safe'] },
    });

    // False negatives: predicted normal, user corrected to scam/suspicious
    const falseNegatives = await Feedback.countDocuments({
      isCorrect: false,
      predictedLabel: 'normal',
      userCorrection: { $in: ['scam', 'suspicious'] },
    });

    return res.json({
      total,
      correctCount,
      wrongCount,
      accuracyRate,
      falsePositives,
      falseNegatives,
    });
  } catch (error) {
    console.error('Error calculating feedback stats:', error);
    return res.status(500).json({ message: 'Failed to fetch feedback statistics.' });
  }
}

export async function getAllFeedback(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isCorrect !== undefined && req.query.isCorrect !== '') {
      filter.isCorrect = req.query.isCorrect === 'true';
    }

    const [feedbackList, total] = await Promise.all([
      Feedback.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    return res.json({
      feedbacks: feedbackList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    return res.status(500).json({ message: 'Failed to retrieve feedback records.' });
  }
}

export async function deleteFeedback(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid feedback ID format.' });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback entry not found.' });
    }

    // Reset scan feedback subdocument if linked
    if (feedback.scanId) {
      await Scan.findByIdAndUpdate(feedback.scanId, {
        $set: {
          'feedback.submitted': false,
          'feedback.isCorrect': null,
          'feedback.userCorrection': null,
          'feedback.comment': '',
          'feedback.feedbackId': null,
        },
      });
    }

    await feedback.deleteOne();
    return res.json({ message: 'Feedback deleted successfully.', id: req.params.id });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return res.status(500).json({ message: 'Failed to delete feedback record.' });
  }
}
