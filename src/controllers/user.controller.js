const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

// CREATE user
exports.createUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, phone, password, role });
  res.status(201).json({ message: 'User created', user });
};

// READ users (with search + pagination)
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = {
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } }
    ]
  };

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalUsers: total,
    users
  });
};

// READ single user
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Hash password if provided
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// exports.updateUser = async (req, res) => {
//   const { id } = req.params;
//   const updates = req.body;

//   if (updates.password) delete updates.password; // password update separately handled

//   const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
//   console.log("🚀 ~ user:", user)
//   if (!user) return res.status(404).json({ message: 'User not found' });
//   res.json({ message: 'User updated', user });
// };

// DELETE user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted successfully' });
};


