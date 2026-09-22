const User = require('../models/User');
const { sendTokenCookie, getCookieOptions } = require('../utils/jwtHelper');

const register = async (req, res, next) => {
  try {
    const { username, email, password, name } = req.body;

    const user = await User.create({ username, email, password, name });

    sendTokenCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenCookie(res, user._id);

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie('token', '', { ...getCookieOptions(), expires: new Date(0), maxAge: 0 });

  res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('todoCount');

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
