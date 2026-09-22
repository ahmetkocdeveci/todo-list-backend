const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const getCookieOptions = () => {
  const requestedSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(requestedSameSite) ? requestedSameSite : 'lax';
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    maxAge: Number(process.env.COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000,
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
};

const sendTokenCookie = (res, userId) => {
  const token = generateToken(userId);
  res.cookie('token', token, getCookieOptions());
};

module.exports = { generateToken, verifyToken, sendTokenCookie, getCookieOptions };
