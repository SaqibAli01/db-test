const AppointmentNew = require("../models/AppointmentNew.model");
const AppointmentAccepted = require("../models/AppointmentAccepted.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1️⃣ Total new appointments
    const totalNew = await AppointmentNew.countDocuments();

    // 2️⃣ Total accepted appointments
    const totalAccepted = await AppointmentAccepted.countDocuments();

    // 3️⃣ Total users/staff
    const totalUsers = await User.countDocuments();

    // 4️⃣ Monthly appointments (accepted + new combined)
    const monthlyStats = await AppointmentAccepted.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill months (1-12)
    const monthlyAppointments = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyStats.find(m => m._id === i + 1);
      return { month: i + 1, count: found ? found.count : 0 };
    });

    // 5️⃣ Appointments per hospital
    const hospitalStats = await AppointmentAccepted.aggregate([
      {
        $group: {
          _id: "$hospital",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      summary: {
        newAppointments: totalNew,
        acceptedAppointments: totalAccepted,
        totalUsers
      },
      charts: {
        monthlyAppointments,
        appointmentsPerHospital: hospitalStats
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message
    });
  }
};
