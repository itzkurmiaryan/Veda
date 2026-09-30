const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'payment_due',
        'payment_request',
        'access_request',
        'access_approved',
        'access_rejected',
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
    },

    message: {
      type: String,
      required: true,
    },

    cycleKey: {
      type: String,
      default: null,
    },

    readAt: {
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