import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    predictedLabel: {
      type: String,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    userCorrection: {
      type: String,
      enum: ['normal', 'suspicious', 'scam', 'safe', null],
      default: null,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient admin querying and stats aggregation
feedbackSchema.index({ isCorrect: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
