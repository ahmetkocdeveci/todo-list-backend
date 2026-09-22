const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

const getAllowedOrigins = () => (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const verifyRequestOrigin = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' || safeMethods.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
  }
  next();
};

module.exports = { verifyRequestOrigin };
