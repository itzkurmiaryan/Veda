const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    message: {
      type: String,
      default: '',
      trim: true,
    },

    paymentProof: {
      data: {
        type: String,
        default: null,
      },
      contentType: {
        type: String,
        default: null,
      },
      fileName: {
        type: String,
        default: null,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.AccessRequest ||
  mongoose.model('AccessRequest', AccessRequestSchema);