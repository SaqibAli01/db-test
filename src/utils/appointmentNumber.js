const DayCounter = require('../models/DayCounter.model');

async function getNextAppointmentNumberFor(dateObj) {
  // dateObj is Date or ISO string
  const d = new Date(dateObj);
  const dateStr = d.toISOString().slice(0,10); // YYYY-MM-DD

  const res = await DayCounter.findOneAndUpdate(
    { date: dateStr },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seq = res.seq;
  // format sequence to 3 digits e.g., 001
  const seqStr = String(seq).padStart(3, '0');
  const appointmentNumber = `${dateStr}-${seqStr}`; // e.g., 2025-10-01-001
  return appointmentNumber;
}

module.exports = { getNextAppointmentNumberFor };
