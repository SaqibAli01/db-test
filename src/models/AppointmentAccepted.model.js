const mongoose = require('mongoose');

const AppointmentAcceptedSchema = new mongoose.Schema({
  appointmentType: { type: String, required: true },
  hospital: { type: String },
  datetime: { type: Date, required: true },
  fullName: { type: String, required: true },
  email: { type: String },
  mobile: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: Date.now },
  appointmentNumber: { type: String, required: true },
  slipPdfPath: { type: String } // optional stored file path or URL
}, { timestamps: true });

module.exports = mongoose.model('AppointmentAccepted', AppointmentAcceptedSchema);
