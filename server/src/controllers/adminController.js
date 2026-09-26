import mongoose from 'mongoose';
import Scan from '../models/Scan.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import { escapeRegex } from '../utils/security.js';


export async function getAnalytics(req, res) {
  try {
    const days = parseInt(req.query.days, 10) || 14;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Overall Totals
    const [totalScans, totalUsers, totalFeedback] = await Promise.all([
      Scan.countDocuments(),
      User.countDocuments(),
      Feedback.countDocuments(),
    ]);

    // 2. Scam vs. Safe messages
    const [scamCount, suspiciousCount, safeCount] = await Promise.all([
      Scan.countDocuments({ prediction: 'scam' }),
      Scan.countDocuments({ prediction: 'suspicious' }),
      Scan.countDocuments({ prediction: 'normal' }),
    ]);

    // 3. Risk Level Distribution (HIGH, MEDIUM, LOW)
    const [highRiskCount, mediumRiskCount, lowRiskCount] = await Promise.all([
      Scan.countDocuments({ riskLevel: 'HIGH' }),
      Scan.countDocuments({ riskLevel: 'MEDIUM' }),
      Scan.countDocuments({ riskLevel: 'LOW' }),
    ]);

    // 4. Scam Category Distribution
    const categoryAgg = await Scan.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$category', 'other'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const categoryDistribution = categoryAgg.map((item) => ({
      category: item._id,
      label: item._id.replace(/_/g, ' '),
      count: item.count,
    }));

    // 5. URL Detection Statistics
    const urlStatsAgg = await Scan.aggregate([
      {
        $facet: {
          scansWithUrls: [
            { $match: { 'extractedUrls.0': { $exists: true } } },
            { $count: 'count' },
          ],
          urlAnalysisCounts: [
            { $unwind: { path: '$urlAnalysis', preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: null,
                totalUrls: { $sum: 1 },
                httpsCount: {
                  $sum: { $cond: [{ $eq: ['$urlAnalysis.isHttps', true] }, 1, 0] },
                },
                httpCount: {
                  $sum: { $cond: [{ $eq: ['$urlAnalysis.isHttps', false] }, 1, 0] },
                },
                dangerousCount: {
                  $sum: { $cond: [{ $eq: ['$urlAnalysis.riskLevel', 'DANGEROUS'] }, 1, 0] },
                },
                suspiciousCount: {
                  $sum: { $cond: [{ $eq: ['$urlAnalysis.riskLevel', 'SUSPICIOUS'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const urlStatsFacet = urlStatsAgg[0] || {};
    const scansWithUrls = urlStatsFacet.scansWithUrls?.[0]?.count || 0;
    const urlCounts = urlStatsFacet.urlAnalysisCounts?.[0] || {
      totalUrls: 0,
      httpsCount: 0,
      httpCount: 0,
      dangerousCount: 0,
      suspiciousCount: 0,
    };

    // 6. Feedback Accuracy Statistics
    const [fbTotal, fbCorrect, fbWrong, fbFalsePositives, fbFalseNegatives] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ isCorrect: true }),
      Feedback.countDocuments({ isCorrect: false }),
      Feedback.countDocuments({
        isCorrect: false,
        predictedLabel: 'scam',
        userCorrection: { $in: ['normal', 'safe'] },
      }),
      Feedback.countDocuments({
        isCorrect: false,
        predictedLabel: 'normal',
        userCorrection: { $in: ['scam', 'suspicious'] },
      }),
    ]);

    const feedbackAccuracy = {
      totalReviews: fbTotal,
      correctCount: fbCorrect,
      wrongCount: fbWrong,
      accuracyRate: fbTotal > 0 ? Math.round((fbCorrect / fbTotal) * 100) : 100,
      falsePositives: fbFalsePositives,
      falseNegatives: fbFalseNegatives,
    };

    // 7. Daily Scan Trends over past N days
    const trendAgg = await Scan.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: 1 },
          scam: { $sum: { $cond: [{ $eq: ['$prediction', 'scam'] }, 1, 0] } },
          suspicious: { $sum: { $cond: [{ $eq: ['$prediction', 'suspicious'] }, 1, 0] } },
          safe: { $sum: { $cond: [{ $eq: ['$prediction', 'normal'] }, 1, 0] } },
          avgRisk: { $avg: '$riskScore' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build complete daily timeline including empty days
    const trendMap = new Map(trendAgg.map((item) => [item._id, item]));
    const dailyTrends = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const existing = trendMap.get(dateStr);

      dailyTrends.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: existing?.total || 0,
        scam: existing?.scam || 0,
        suspicious: existing?.suspicious || 0,
        safe: existing?.safe || 0,
        avgRisk: existing?.avgRisk ? Math.round(existing.avgRisk) : 0,
      });
    }

    // 8. Recent 5 Scans and Recent 5 Feedback
    const [recentScans, recentFeedback] = await Promise.all([
      Scan.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Feedback.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.json({
      summary: {
        totalScans,
        scamCount,
        safeCount,
        suspiciousCount,
        totalUsers,
        totalFeedback,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
      },
      scamVsSafe: {
        scam: scamCount,
        suspicious: suspiciousCount,
        safe: safeCount,
      },
      riskDistribution: {
        HIGH: highRiskCount,
        MEDIUM: mediumRiskCount,
        LOW: lowRiskCount,
      },
      categoryDistribution,
      urlStatistics: {
        scansWithUrls,
        totalUrls: urlCounts.totalUrls,
        httpsCount: urlCounts.httpsCount,
        httpCount: urlCounts.httpCount,
        dangerousUrls: urlCounts.dangerousCount,
        suspiciousUrls: urlCounts.suspiciousCount,
      },
      feedbackAccuracy,
      dailyTrends,
      recentScans,
      recentFeedback,
    });
  } catch (error) {
    console.error('Error in admin analytics:', error);
    return res.status(500).json({ message: 'Failed to generate admin analytics.' });
  }
}

export async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }


    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach scan counts to each user
    const userIds = users.map((u) => u._id);
    const scanCounts = await Scan.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(scanCounts.map((sc) => [sc._id.toString(), sc.count]));

    const enrichedUsers = users.map((u) => ({
      ...u,
      scanCount: countMap.get(u._id.toString()) || 0,
    }));

    return res.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch user list.' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "user" or "admin".' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    // Protect against self-demotion
    if (req.user._id.toString() === id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove admin privileges from yourself.' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: `Role updated to ${role} successfully.`, user });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Failed to update user role.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'User account deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user account.' });
  }
}

export async function getAllSystemScans(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.prediction) {
      filter.prediction = req.query.prediction;
    }
    if (req.query.riskLevel) {
      filter.riskLevel = req.query.riskLevel;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.search) {
      filter.message = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    }


    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .populate('userId', 'name email')
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
    console.error('Error fetching system scans:', error);
    return res.status(500).json({ message: 'Failed to retrieve system scans.' });
  }
}

export async function exportReport(req, res) {
  try {
    const [scans, feedback] = await Promise.all([
      Scan.find().sort({ createdAt: -1 }).limit(1000).lean(),
      Feedback.find().sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      reportTitle: 'ScamShield AI Enterprise Threat Intelligence Report',
      totalRecords: scans.length,
      feedbackRecords: feedback.length,
      scans: scans.map((s) => ({
        id: s._id,
        date: s.createdAt,
        messageSnippet: s.message.slice(0, 150),
        prediction: s.prediction,
        riskScore: s.riskScore,
        riskLevel: s.riskLevel,
        category: s.category,
        urls: s.extractedUrls,
      })),
      feedback: feedback.map((f) => ({
        id: f._id,
        date: f.createdAt,
        messageSnippet: f.message.slice(0, 150),
        predicted: f.predictedLabel,
        isCorrect: f.isCorrect,
        userCorrection: f.userCorrection,
        comment: f.comment,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=scamshield_report_${Date.now()}.json`);
    return res.json(report);
  } catch (error) {
    console.error('Report export error:', error);
    return res.status(500).json({ message: 'Failed to export threat report.' });
  }
}

export async function seedDemoIntelligence(req, res) {
  try {
    const existingCount = await Scan.countDocuments();
    if (existingCount >= 50) {
      return res.json({ message: `Database already populated with ${existingCount} scans.` });
    }

    const sampleScenarios = [
      {
        message: 'URGENT: Your SBI account #4021 is suspended. Update KYC at http://sbi-kyc-verify.xyz/login immediately.',
        prediction: 'scam',
        riskScore: 98,
        riskLevel: 'HIGH',
        category: 'phishing',
        patterns: ['urgency', 'account_threat', 'insecure_http', 'suspicious_tld', 'brand_impersonation'],
        extractedUrls: ['http://sbi-kyc-verify.xyz/login'],
        urlRiskScore: 100,
        urlAnalysis: [
          {
            url: 'http://sbi-kyc-verify.xyz/login',
            domain: 'sbi-kyc-verify.xyz',
            hostname: 'sbi-kyc-verify.xyz',
            protocol: 'http:',
            isHttps: false,
            riskScore: 100,
            riskLevel: 'DANGEROUS',
            threatFlags: ['insecure_http', 'suspicious_tld', 'brand_impersonation', 'suspicious_path'],
            reasons: ['Insecure HTTP transmission', 'Suspicious disposable .xyz TLD', 'Brand impersonation of SBI'],
          },
        ],
      },
      {
        message: 'Congratulations! Your mobile number won Rs 10,00,000 in international lottery. Contact claims@intl-prize.org with Rs 500 fee.',
        prediction: 'scam',
        riskScore: 94,
        riskLevel: 'HIGH',
        category: 'lottery_prize_scam',
        patterns: ['prize_claim', 'financial_request'],
        extractedUrls: [],
      },
      {
        message: 'Payment of Rs 1,499 for Electricity Bill was received successfully. Transaction ID: #TXN-9920194.',
        prediction: 'normal',
        riskScore: 5,
        riskLevel: 'LOW',
        category: 'financial_scam',
        patterns: [],
        extractedUrls: [],
      },
      {
        message: 'Your Amazon delivery with tracking #AMZ-33019 is out for delivery today. Track here: https://amazon.com/orders',
        prediction: 'normal',
        riskScore: 8,
        riskLevel: 'LOW',
        category: 'link_shared',
        patterns: [],
        extractedUrls: ['https://amazon.com/orders'],
        urlRiskScore: 0,
        urlAnalysis: [
          {
            url: 'https://amazon.com/orders',
            domain: 'amazon.com',
            hostname: 'amazon.com',
            protocol: 'https:',
            isHttps: true,
            riskScore: 0,
            riskLevel: 'SAFE',
            threatFlags: [],
            reasons: ['Verified HTTPS domain; no deceptive triggers.'],
          },
        ],
      },
      {
        message: 'Earn $500 daily by liking YouTube videos. Work from home. Message +1-920-331-4402 on Telegram now.',
        prediction: 'suspicious',
        riskScore: 58,
        riskLevel: 'MEDIUM',
        category: 'job_scam',
        patterns: ['job_scam', 'urgency'],
        extractedUrls: [],
      },
      {
        message: 'Unusual sign-in from Russia. If this was not you, visit http://192.168.1.100/secure to verify your identity.',
        prediction: 'scam',
        riskScore: 92,
        riskLevel: 'HIGH',
        category: 'phishing',
        patterns: ['account_threat', 'ip_address_host', 'insecure_http'],
        extractedUrls: ['http://192.168.1.100/secure'],
        urlRiskScore: 85,
        urlAnalysis: [
          {
            url: 'http://192.168.1.100/secure',
            domain: '192.168.1.100',
            hostname: '192.168.1.100',
            protocol: 'http:',
            isHttps: false,
            riskScore: 85,
            riskLevel: 'DANGEROUS',
            threatFlags: ['insecure_http', 'ip_address_host'],
            reasons: ['Insecure HTTP', 'Raw IP host phishing'],
          },
        ],
      },
      {
        message: 'Your meeting with Dr. Sharma is confirmed for tomorrow at 11:30 AM at Apex Health Clinic.',
        prediction: 'normal',
        riskScore: 4,
        riskLevel: 'LOW',
        category: 'other',
        patterns: [],
        extractedUrls: [],
      },
    ];

    const bulkDocs = [];
    const now = Date.now();

    // Create 45 staggered scans over the last 14 days
    for (let i = 0; i < 45; i++) {
      const template = sampleScenarios[i % sampleScenarios.length];
      const dayOffset = Math.floor(Math.random() * 14);
      const createdAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 3600000));

      bulkDocs.push({
        ...template,
        userId: req.user ? req.user._id : null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    await Scan.insertMany(bulkDocs);

    return res.json({
      message: 'Successfully seeded 45 threat intelligence records spanning the past 14 days.',
    });
  } catch (error) {
    console.error('Seed demo error:', error);
    return res.status(500).json({ message: 'Failed to seed demo data.' });
  }
}
