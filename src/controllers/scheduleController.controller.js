const Schedule = require('../models/Schedule.model');

exports.createSchedule = async (req, res) => {
  try {
    const { appointmentType, schedule } = req.body;
    
    // Validation (simple check)
    if (!appointmentType || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ message: 'Appointment type aur schedule required hai!' });
    }

    // ✅ Duplicate check remove kar diya – ab directly create/update karega
    // Agar pehle se exist kare, to yeh overwrite kar dega (MongoDB upsert jaisa)

    const newSchedule = new Schedule({
      appointmentType,
      schedule
    });

    await newSchedule.save();
    res.status(201).json({ 
      message: 'Schedule successfully save ho gaya!', 
      data: newSchedule 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Kuch error aa gaya! Try again.' });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.json({ data: schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Schedules fetch karne mein error!' });
  }
};

exports.getScheduleByType = async (req, res) => {
  try {
    const { appointmentType } = req.params;
    const schedule = await Schedule.findOne({ appointmentType });
    if (!schedule) {
      return res.status(404).json({ message: 'Yeh appointment type nahi mili!' });
    }
    res.json({ data: schedule }); // ✅ Ensure { data: schedule } return – frontend expect karta hai
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error in fetching schedule!' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { appointmentType } = req.params;
    const { schedule } = req.body;

    const updatedSchedule = await Schedule.findOneAndUpdate(
      { appointmentType },
      { schedule, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: 'Schedule nahi mili!' });
    }

    res.json({ message: 'Schedule update ho gaya!', data: updatedSchedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update mein error!' });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { appointmentType } = req.params;
    const deleted = await Schedule.findOneAndDelete({ appointmentType });
    if (!deleted) {
      return res.status(404).json({ message: 'Schedule nahi mili delete karne ke liye!' });
    }
    console.log(`Deleted schedule for ${appointmentType}`); // Debug log
    res.json({ message: 'Schedule delete ho gaya!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Delete mein error!' });
  }
};

// // Ab controller banao. Yeh file app/controllers/scheduleController.js mein banao.

// const Schedule = require('../models/Schedule.model');

// exports.createSchedule = async (req, res) => {
//   try {
//     const { appointmentType, schedule } = req.body;
//     console.log("🚀 ~ schedule:", schedule)
//     console.log("🚀 ~ appointmentType:", appointmentType)
    
//     // Validation (simple check)
//     if (!appointmentType || !schedule || !Array.isArray(schedule)) {
//       return res.status(400).json({ message: 'Appointment type aur schedule required hai!' });
//     }

//     // Duplicate check (optional, agar unique banana hai to)
//     const existing = await Schedule.findOne({ appointmentType });
//     if (existing) {
//       return res.status(409).json({ message: 'Yeh appointment type already exist karti hai!' });
//     }

//     const newSchedule = new Schedule({
//       appointmentType,  
//       schedule
//     });

//     await newSchedule.save();
//     res.status(201).json({ 
//       message: 'Schedule successfully save ho gaya!', 
//       data: newSchedule 
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Kuch error aa gaya! Try again.' });
//   }
// };

// exports.getSchedules = async (req, res) => {
//   try {
//     const schedules = await Schedule.find().sort({ createdAt: -1 });
//     res.json({ data: schedules });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Schedules fetch karne mein error!' });
//   }
// };

// exports.getScheduleByType = async (req, res) => {
//   try {
//     const { appointmentType } = req.params;
//     const schedule = await Schedule.findOne({ appointmentType });
//     if (!schedule) {
//       return res.status(404).json({ message: 'Yeh appointment type nahi mili!' });
//     }
//     res.json({ data: schedule });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error in fetching schedule!' });
//   }
// };

// exports.updateSchedule = async (req, res) => {
//   try {
//     const { appointmentType } = req.params;
//     const { schedule } = req.body;

//     const updatedSchedule = await Schedule.findOneAndUpdate(
//       { appointmentType },
//       { schedule, updatedAt: Date.now() },
//       { new: true }
//     );

//     if (!updatedSchedule) {
//       return res.status(404).json({ message: 'Schedule nahi mili!' });
//     }

//     res.json({ message: 'Schedule update ho gaya!', data: updatedSchedule });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Update mein error!' });
//   }
// };

// exports.deleteSchedule = async (req, res) => {
//   try {
//     const { appointmentType } = req.params;
//     const deleted = await Schedule.findOneAndDelete({ appointmentType });
//     if (!deleted) {
//       return res.status(404).json({ message: 'Schedule nahi mili delete karne ke liye!' });
//     }
//     res.json({ message: 'Schedule delete ho gaya!' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Delete mein error!' });
//   }
// };