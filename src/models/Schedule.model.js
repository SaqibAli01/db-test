// Pehle, humein MongoDB model banana hai. Yeh file app/models/Schedule.js mein banao.

const mongoose = require('mongoose');

const TimeRangeSchema = new mongoose.Schema({
  open: { type: String, required: true },
  close: { type: String, required: true }
});

const DaySchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  mode: { type: String, enum: ['24h', 'appointment', 'custom'], required: true },
  ranges: [TimeRangeSchema]
});

const ScheduleSchema = new mongoose.Schema({
  appointmentType: { type: String, required: true },
  schedule: [DaySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);