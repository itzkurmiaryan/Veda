const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema(
  {
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

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Doctor ||
  mongoose.model('Doctor', DoctorSchema);