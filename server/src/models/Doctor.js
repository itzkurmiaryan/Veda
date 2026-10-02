const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | BASIC INFORMATION
    |--------------------------------------------------------------------------
    */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: '',
    },

    password: {
      type: String,
      required: true,
    },

    qualification: {
      type: String,
      default: '',
    },

    specialization: {
      type: String,
      default: '',
    },

    registrationNumber: {
      type: String,
      default: '',
    },

    clinicName: {
      type: String,
      default: '',
    },

    clinicAddress: {
      type: String,
      default: '',
    },

    clinicLogo: {
      type: String,
      default: '',
    },

    clinicBanner: {
      type: String,
      default: '',
    },

    signature: {
      type: String,
      default: '',
    },

    /*
    |--------------------------------------------------------------------------
    | ACCESS
    |--------------------------------------------------------------------------
    */

    active: {
      type: Boolean,
      default: true,
    },

    registrationDate: {
      type: Date,
      default: null,
    },

    accessStartDate: {
      type: Date,
      default: null,
    },

    accessRemovedAt: {
      type: Date,
      default: null,
    },

    accessRemovalReason: {
      type: String,
      default: '',
    },

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    paymentStatus: {
      type: String,
      enum: [
        'pending',
        'paid',
      ],
      default: 'pending',
    },

    lastPaymentDate: {
      type: Date,
      default: null,
    },

    nextPaymentDate: {
      type: Date,
      default: null,
      index: true,
    },

    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0.01,
        },
        transactionId: {
          type: String,
          trim: true,
          maxlength: 120,
          default: '',
        },
        monthsPaid: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
          max: 24,
        },
        note: {
          type: String,
          trim: true,
          maxlength: 500,
          default: '',
        },
        paidAt: {
          type: Date,
          required: true,
        },
        nextPaymentDate: {
          type: Date,
          required: true,
        },
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
          default: null,
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
        },
      },
    ],

    paymentReminderRequested: {
      type: Boolean,
      default: false,
    },

    paymentReminderAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | ACCESS REQUEST
    |--------------------------------------------------------------------------
    */

    accessRequestStatus: {
      type: String,
      enum: [
        'none',
        'pending',
        'approved',
        'rejected',
      ],
      default: 'none',
    },

    accessRequestedAt: {
      type: Date,
      default: null,
    },

    accessRequestReviewedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Doctor ||
  mongoose.model(
    'Doctor',
    DoctorSchema
  );