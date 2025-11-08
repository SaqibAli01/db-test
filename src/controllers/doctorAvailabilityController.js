const DoctorAvailability = require("../models/DoctorAvailability");
const connectDB = require("../config/db");

// Ensure database connection for serverless environments
const ensureConnection = async () => {
  if (process.env.VERCEL_ENV) {
    await connectDB();
  }
};

// ✅ Create new record
exports.createAvailability = async (req, res) => {
  try {
    await ensureConnection();
    const availability = await DoctorAvailability.create(req.body);
    console.log("🚀 ~ availability:", availability)
    res.status(201).json({ message: "Created", availability });
  } catch (err) {
    console.error("Error creating availability:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get all (with pagination + search)
exports.getAllAvailabilities = async (req, res) => {
  try {
    await ensureConnection();
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {
      $or: [
        { doctor_name: { $regex: search, $options: "i" } },
        { hospital_name: { $regex: search, $options: "i" } },
      ],
    };
    const total = await DoctorAvailability.countDocuments(query);
    const items = await DoctorAvailability.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ page: Number(page), total, totalPages: Math.ceil(total / limit), items });
  } catch (err) {
    console.error("Error getting availabilities:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single
exports.getAvailabilityById = async (req, res) => {
  try {
    await ensureConnection();
    const availability = await DoctorAvailability.findById(req.params.id);
    if (!availability) return res.status(404).json({ message: "Not found" });
    res.json(availability);
  } catch (err) {
    console.error("Error getting availability by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update
exports.updateAvailability = async (req, res) => {
  try {
    await ensureConnection();
    const availability = await DoctorAvailability.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!availability) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", availability });
  } catch (err) {
    console.error("Error updating availability:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete
exports.deleteAvailability = async (req, res) => {
  try {
    await ensureConnection();
    const availability = await DoctorAvailability.findByIdAndDelete(req.params.id);
    if (!availability) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting availability:", err);
    res.status(500).json({ error: err.message });
  }
};