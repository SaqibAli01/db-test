// routes/schedule.routes.js ✅ Filename standard kiya

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');

const controller = require('../controllers/scheduleController.controller'); // Apna controller path confirm karen

// Create a new schedule (POST /api/schedule/schedules)
router.post('/schedules', auth, controller.createSchedule);

// Get all schedules (GET /api/schedule/schedules)
router.get('/schedules', auth, controller.getSchedules);

// Get schedule by appointment type (GET /api/schedule/schedules/:appointmentType)
router.get('/schedules/:appointmentType', auth, controller.getScheduleByType);

// Update schedule by appointment type (PUT /api/schedule/schedules/:appointmentType)
router.put('/schedules/:appointmentType', auth, controller.updateSchedule);

// Delete schedule by appointment type (DELETE /api/schedule/schedules/:appointmentType)
router.delete('/schedules/:appointmentType', auth, controller.deleteSchedule);

module.exports = router;


// // Ab routes banao. Yeh file app/routes/scheduleRoutes.js mein banao.

// const express = require('express');
// const auth = require('../middlewares/auth.middleware'); 



// const router = express.Router();
// const scheduleController = require('../controllers/scheduleController');

// // POST /api/schedules - Naya schedule create karo
// router.post('/schedules',auth, scheduleController.createSchedule);

// // GET /api/schedules - Sab schedules fetch karo
// router.get('/schedules',auth, scheduleController.getSchedules);

// // GET /api/schedules/:appointmentType - Specific schedule get karo
// router.get('/schedules/:appointmentType',auth, scheduleController.getScheduleByType);

// // PUT /api/schedules/:appointmentType - Schedule update karo
// router.put('/schedules/:appointmentType',auth, scheduleController.updateSchedule);

// // DELETE /api/schedules/:appointmentType - Schedule delete karo
// router.delete('/schedules/:appointmentType',auth, scheduleController.deleteSchedule);

// module.exports = router;