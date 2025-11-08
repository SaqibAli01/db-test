const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor_name: { type: String, required: true },
  hospital_name: { type: String, required: true },
  holiday_start: { type: Date, required: true },
  holiday_end: { type: Date, required: true },
  open_time: { type: String, required: true },
  close_time: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
