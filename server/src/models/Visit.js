const mongoose = require('mongoose');

const med = new mongoose.Schema(
  {
    name: { type: String, required: true },
    preparation: { type: String, default: '' },
    strength: { type: String, default: '' },
    strengthUnit: { type: String, default: '' },
    dosage: { type: String, default: '' },
    dosageUnit: { type: String, default: '' },
    route: { type: String, default: '' },
    frequency: { type: String, default: '' },
    direction: { type: String, default: '' },
    duration: { type: String, default: '' },
    durationUnit: { type: String, default: '' },
    instructions: { type: String, default: '' },
    otherInstructions: { type: String, default: '' },
  },
  { _id: false, strict: false }
);

const visitSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    visitDate: { type: Date, default: Date.now },
    symptoms: [String],
    diagnosis: [String],
    vitals: {
      bp: String,
      weight: String,
      temperature: String,
      sugar: String,
      pulse: String,
      spo2: String,
    },
    medicines: [med],
    advice: [String],
    followUpDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);
