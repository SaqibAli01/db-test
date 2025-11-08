const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware'); // use if needed

const controller = require('../controllers/appointment.controller');

// Public create appointment (no auth typically)
router.post('/new', controller.createAppointment);

// Admin-protected list / confirm / CRUD - attach auth middleware as needed
router.get('/new', auth, controller.getNewAppointments);
router.get('/new/:id', auth, controller.getNewById);
router.put('/new/:id', auth, controller.updateNew);
router.delete('/new/:id', auth, controller.deleteNew);

// confirm and accept
router.post('/new/:id/confirm', auth, controller.confirmAppointment);

// accepted appointments
router.get('/accepted', auth, controller.getAcceptedAppointments);
router.get('/accepted/:id', auth, controller.getAcceptedById);
router.put('/accepted/:id', auth, controller.updateAccepted);
router.delete('/accepted/:id', auth, controller.deleteAccepted);

module.exports = router;
