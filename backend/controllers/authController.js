const authService = require('../services/authService');
const { sendTokenCookie, getCookieOptions } = require('../utils/jwtHelper');

const serializeUser = (user) => ({
  _id: user._id, username: user.username, email: user.email, name: user.name,
  role: user.role, avatar: user.avatar,
});

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    sendTokenCookie(res, user._id);
    res.status(201).json({ success: true, message: 'Registration successful!', user: serializeUser(user) });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.authenticateUser(req.body);
    sendTokenCookie(res, user._id);
    res.json({ success: true, message: 'Login successful!', user: serializeUser(user) });
  } catch (error) { next(error); }
};

const logout = (req, res) => {
  res.cookie('token', '', { ...getCookieOptions(), expires: new Date(0), maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully.' });
};

const getMe = async (req, res, next) => {
  try { res.json({ success: true, user: await authService.getCurrentUser(req.user._id) }); } catch (error) { next(error); }
};

module.exports = { register, login, logout, getMe };
