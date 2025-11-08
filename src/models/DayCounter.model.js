const mongoose = require('mongoose');

const DayCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // e.g., '2025-10-01'
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('DayCounter', DayCounterSchema);
