const User = require('../models/User.model');
const createToken = require('../utils/generateToken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = createToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongooseServerSelectionError'
    ) {
      return res.status(500).json({
        message: 'Database connection error. Please try again later.',
        error: 'Database connection timeout',
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

