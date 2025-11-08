const User = require('../models/User.model');
const createToken = require('../utils/generateToken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
      return res.status(500).json({ 
        message: 'Database connection error. Please try again later.',
        error: 'Database connection timeout'
      });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};