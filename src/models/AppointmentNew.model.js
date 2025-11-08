const mongoose = require('mongoose');

const AppointmentNewSchema = new mongoose.Schema({
  appointmentType: { type: String, required: true }, // Physical / Online etc.
  hospital: { type: String },
  datetime: { type: Date, required: true },
  fullName: { type: String, required: true },
  email: { type: String },
  mobile: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  appointmentNumber: { type: String } // e.g., 2025-10-01-001
}, { timestamps: true });

module.exports = mongoose.model('AppointmentNew', AppointmentNewSchema);
