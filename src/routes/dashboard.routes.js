const express = require("express");
const NewAppointment = require("../models/AppointmentNew.model");
const AcceptedAppointment = require("../models/AppointmentAccepted.model");
const User = require("../models/User.model");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // 1️⃣ Count total records
    const [newCount, acceptedCount, userCount] = await Promise.all([
      NewAppointment.countDocuments(),
      AcceptedAppointment.countDocuments(),
      User.countDocuments(),
    ]);

    // 2️⃣ Monthly appointments
    const monthlyAgg = await AcceptedAppointment.aggregate([
      {
        $group: {
          _id: { $month: "$datetime" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyAppointments = monthNames.map((month, i) => {
      const found = monthlyAgg.find((m) => m._id === i + 1);
      return { month, count: found ? found.count : 0 };
    });

    // 3️⃣ Appointments per hospital (including online)
    const hospitalAgg = await AcceptedAppointment.aggregate([
      {
        $group: {
          _id: "$hospital",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const appointmentsPerHospital = hospitalAgg.map((h) => ({
      hospital: h._id || "Unknown",
      count: h.count,
    }));

    // ✅ Final structured response
    res.json({
      stats: {
        newAppointments: newCount,
        acceptedAppointments: acceptedCount,
        totalUsers: userCount,
      },
      monthlyAppointments,
      appointmentsPerHospital,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;


// const express = require("express");
// const NewAppointment = require("../models/AppointmentNew.model");
// const AcceptedAppointment = require("../models/AppointmentAccepted.model");
// const User = require("../models/User.model");

// const router = express.Router();

// router.get("/", async (req, res) => {
//   try {
//     // ✅ Query params for optional year filtering
//     const year = parseInt(req.query.year) || new Date().getFullYear();

//     // 1️⃣ Count totals
//     const [newCount, acceptedCount, userCount] = await Promise.all([
//       NewAppointment.countDocuments(),
//       AcceptedAppointment.countDocuments(),
//       User.countDocuments(),
//     ]);

//     // 2️⃣ Monthly accepted appointments (group by month)
//     const monthlyAgg = await AcceptedAppointment.aggregate([
//       {
//         $match: {
//           datetime: {
//             $gte: new Date(`${year}-01-01`),
//             $lt: new Date(`${year + 1}-01-01`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: "$datetime" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { "_id": 1 } },
//     ]);

//     const monthNames = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//     ];

//     const monthlyAppointments = monthNames.map((m, i) => {
//       const found = monthlyAgg.find((x) => x._id === i + 1);
//       return { month: m, count: found ? found.count : 0 };
//     });

//     // 3️⃣ Accepted appointments per hospital
//     const hospitalAgg = await AcceptedAppointment.aggregate([
//       {
//         $group: {
//           _id: "$hospital",
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { count: -1 } },
//     ]);

//     const appointmentsPerHospital = hospitalAgg.map((h) => ({
//       hospital: h._id || "Unknown Hospital",
//       count: h.count,
//     }));

//     // ✅ Final Response
//     res.json({
//       stats: {
//         newAppointments: newCount,
//         acceptedAppointments: acceptedCount,
//         totalUsers: userCount,
//       },
//       monthlyAppointments,
//       appointmentsPerHospital,
//     });
//   } catch (err) {
//     console.error("Dashboard error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// module.exports = router;
