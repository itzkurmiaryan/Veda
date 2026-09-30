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
    },

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