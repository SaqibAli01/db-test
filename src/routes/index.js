const express = require('express');
const router = express.Router();


const appointmentRoutes = require('./appointment.routes');
const doctorAvailabilityRoutes = require('./doctorAvailability.routes.js');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const dashboardRoutes = require('./dashboard.routes'); // ✅ Correct variable name
const scheduleRoutes = require('./scheduleRoutes.routes.js');

// Root route - Welcome message
router.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Dr. Noor Backend API', 
    version: '1.0.0',
    documentation: 'https://github.com/your-username/your-repo', // Update with your actual repo
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      appointments: '/api/appointments',
      schedule: '/api/schedule', // ✅ Fixed: Duplicate remove kiya, schedule sahi key di
      doctorAvailability: '/api/doctor-availability',
      dashboard: '/api/dashboard',
      health: '/health'
    }
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/schedule', scheduleRoutes); // ✅ Fixed: Sahi variable use kiya
router.use('/doctor-availability', doctorAvailabilityRoutes);
router.use('/dashboard', dashboardRoutes); // ✅ Fixed

module.exports = router;