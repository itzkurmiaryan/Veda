const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'payment_due',
        'payment_request',
        'payment_verified',
        'access_request',
        'access_approved',
        'access_rejected',
        'admin_custom',
      ],
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Optional image/photo attached to the notification
    photo: {
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
    },

    // Used for monthly payment notifications
    cycleKey: {
      type: String,
      default: null,
    },

    // When doctor/admin has read the notification
    readAt: {
      type: Date,
      default: null,
    },

    // Soft delete/dismiss notification
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate monthly payment notifications
NotificationSchema.index(
  {
    type: 1,
    doctorId: 1,
    cycleKey: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      cycleKey: {
        $type: 'string',
      },
    },
  }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model('Notification', NotificationSchema);