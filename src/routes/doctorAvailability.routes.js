const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctorAvailabilityController");

// CRUD endpoints
router.post("/", controller.createAvailability);
router.get("/", controller.getAllAvailabilities);
router.get("/:id", controller.getAvailabilityById);
router.put("/:id", controller.updateAvailability);
router.delete("/:id", controller.deleteAvailability);

module.exports = router;
