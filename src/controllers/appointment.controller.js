const AppointmentNew = require('../models/AppointmentNew.model');
const AppointmentAccepted = require('../models/AppointmentAccepted.model');
const { getNextAppointmentNumberFor } = require('../utils/appointmentNumber');
// const { sendWhatsApp } = require('../services/whatsapp.service');
const { sendAppointmentEmailWithPdf } = require('../services/emailPdf.service');
const { createSendAppointmentEmailWithPdf } = require('../services/create-emailPdf.service');
const connectDB = require("../config/db");

// Ensure database connection for serverless environments
const ensureConnection = async () => {
  if (process.env.VERCEL_ENV) {
    await connectDB();
  }
};

/**
 * Create new appointment (goes to New collection)
 */

exports.createAppointment = async (req, res) => {
  const payload = req.body;
  // basic validation - you can use Joi instead
  if (!payload.fullName || !payload.mobile || !payload.datetime || !payload.appointmentType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // generate appointment number based on the appointment datetime
  const appointmentNumber = await getNextAppointmentNumberFor(payload.datetime || new Date());

  const newAppt = await AppointmentNew.create({
    ...payload,
    appointmentNumber
  });

  // send WhatsApp notification (best-effort)
  // try {
  //   const msg = `Your appointment request received. #${appointmentNumber} at ${new Date(newAppt.datetime).toLocaleString()}`;
  //   await sendWhatsApp(newAppt.mobile, msg);
  // } catch (err) {
  //   console.warn('WhatsApp send failed:', err.message || err);
  //   // Also log to application logs for better visibility
  //   console.error('WhatsApp Error Details:', {
  //     mobile: newAppt.mobile,
  //     message: msg,
  //     error: err.stack || err
  //   });
  // }

  // send email with PDF if email exists
  if (newAppt.email) {
    try {
      await createSendAppointmentEmailWithPdf(newAppt.email, newAppt);
    } catch (err) {
      console.warn('Email send failed:', err.message || err);
      // Also log to application logs for better visibility
      console.error('Email Error Details:', {
        email: newAppt.email,
        appointmentNumber: appointmentNumber,
        error: err.stack || err
      });
    }
  }

  return res.status(201).json({ message: 'Appointment created (pending confirmation)', appointment: newAppt });
};
// exports.createAppointment = async (req, res) => {
//   const payload = req.body;
//   // basic validation - you can use Joi instead
//   if (!payload.fullName || !payload.mobile || !payload.datetime || !payload.appointmentType) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   // generate appointment number based on the appointment datetime
//   const appointmentNumber = await getNextAppointmentNumberFor(payload.datetime || new Date());

//   const newAppt = await AppointmentNew.create({
//     ...payload,
//     appointmentNumber
//   });

//   // send WhatsApp notification (best-effort)
//   // try {
//   //   const msg = `Your appointment request received. #${appointmentNumber} at ${new Date(newAppt.datetime).toLocaleString()}`;
//   //   await sendWhatsApp(newAppt.mobile, msg);
//   // } catch (err) {
//   //   console.warn('WhatsApp send failed:', err.message || err);
//   //   // Also log to application logs for better visibility
//   //   console.error('WhatsApp Error Details:', {
//   //     mobile: newAppt.mobile,
//   //     message: msg,
//   //     error: err.stack || err
//   //   });
//   // }

//   // send email with PDF if email exists
//   if (newAppt.email) {
//     try {
//       await createSendAppointmentEmailWithPdf(newAppt.email, newAppt);
//     } catch (err) {
//       console.warn('Email send failed:', err.message || err);
//       // Also log to application logs for better visibility
//       console.error('Email Error Details:', {
//         email: newAppt.email,
//         appointmentNumber: appointmentNumber,
//         error: err.stack || err
//       });
//     }
//   }

//   return res.status(201).json({ message: 'Appointment created (pending confirmation)', appointment: newAppt });
// };
// exports.createAppointment = async (req, res) => {
//   try {
//     await ensureConnection();
//     const payload = req.body;
//     // basic validation - you can use Joi instead
//     if (!payload.fullName || !payload.mobile || !payload.datetime || !payload.appointmentType) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // generate appointment number based on the appointment datetime
//     const appointmentNumber = await getNextAppointmentNumberFor(payload.datetime || new Date());

//     const newAppt = await AppointmentNew.create({
//       ...payload,
//       appointmentNumber
//     });

//     // send email with PDF if email exists
//     if (newAppt.email) {
//       try {
//         await createSendAppointmentEmailWithPdf(newAppt.email, newAppt);
//       } catch (err) {
//         console.warn('Email send failed:', err.message || err);
//         // Also log to application logs for better visibility
//         console.error('Email Error Details:', {
//           email: newAppt.email,
//           appointmentNumber: appointmentNumber,
//           error: err.stack || err
//         });
//       }
//     }

//     return res.status(201).json({ message: 'Appointment created (pending confirmation)', appointment: newAppt });
//   } catch (err) {
//     console.error("Error creating appointment:", err);
//     return res.status(500).json({ message: 'Failed to create appointment', error: err.message });
//   }
// };

/**
 * Get new appointments (search + pagination)
 */
exports.getNewAppointments = async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 10, search = '' } = req.query;
    const q = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { appointmentNumber: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AppointmentNew.find(q).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AppointmentNew.countDocuments(q)
    ]);

    res.json({ page: parseInt(page), totalPages: Math.ceil(total / limit), total, items });
  } catch (err) {
    console.error("Error getting new appointments:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Confirm appointment: move from new -> accepted, generate PDF & email/whatsapp
 */
exports.confirmAppointment = async (req, res) => {
  try {
    await ensureConnection();
    const { id } = req.params;
    const { date, time } = req.body;  // <-- alag alag time & date

    const appt = await AppointmentNew.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });

    // Agar date/time diya ho to combine kro, warna old datetime use kro
    let finalDatetime;

    if (date && time) {
      finalDatetime = new Date(`${date}T${time}:00`);
    } else {
      finalDatetime = appt.datetime;
    }

    const accepted = await AppointmentAccepted.create({
      appointmentType: appt.appointmentType,
      hospital: appt.hospital,
      datetime: finalDatetime,
      fullName: appt.fullName,
      email: appt.email,
      mobile: appt.mobile,
      createdAt: appt.createdAt,
      acceptedAt: new Date(),
      appointmentNumber: appt.appointmentNumber,
    });

    await AppointmentNew.findByIdAndDelete(id);

    if (accepted.email) {
      try {
        await sendAppointmentEmailWithPdf(accepted, accepted);
      } catch (err) {
        console.error("Email sending error:", err);
      }
    }

    // try {
    //   await sendWhatsApp(
    //     accepted.mobile,
    //     `Your appointment ${accepted.appointmentNumber} is confirmed for ${finalDatetime.toLocaleString()}`
    //   );
    // } catch (err) {
    //   console.error("WhatsApp sending error:", err);
    // }

    res.json({ message: "Appointment confirmed", accepted });
  } catch (err) {
    console.error("Error confirming appointment:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get accepted appointments (pagination + search)
 */
exports.getAcceptedAppointments = async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 10, search = '' } = req.query;
    const q = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { appointmentNumber: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AppointmentAccepted.find(q).sort({ acceptedAt: -1 }).skip(skip).limit(parseInt(limit)),
      AppointmentAccepted.countDocuments(q)
    ]);

    res.json({ page: parseInt(page), totalPages: Math.ceil(total / limit), total, items });
  } catch (err) {
    console.error("Error getting accepted appointments:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * CRUD small helpers: get by id, update, delete for both collections
 */
exports.getNewById = async (req, res) => {
  try {
    await ensureConnection();
    const a = await AppointmentNew.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json(a);
  } catch (err) {
    console.error("Error getting new appointment by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateNew = async (req, res) => {
  try {
    await ensureConnection();
    const updates = req.body;
    const a = await AppointmentNew.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', a });
  } catch (err) {
    console.error("Error updating new appointment:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNew = async (req, res) => {
  try {
    await ensureConnection();
    await AppointmentNew.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error("Error deleting new appointment:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAcceptedById = async (req, res) => {
  try {
    await ensureConnection();
    const a = await AppointmentAccepted.findById(req.params.id);
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json(a);
  } catch (err) {
    console.error("Error getting accepted appointment by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAccepted = async (req, res) => {
  try {
    await ensureConnection();
    const updates = req.body;
    // if you want to regenerate PDF on update & re-email, do that here
    const a = await AppointmentAccepted.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!a) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', a });
  } catch (err) {
    console.error("Error updating accepted appointment:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAccepted = async (req, res) => {
  try {
    await ensureConnection();
    await AppointmentAccepted.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error("Error deleting accepted appointment:", err);
    res.status(500).json({ error: err.message });
  }
};