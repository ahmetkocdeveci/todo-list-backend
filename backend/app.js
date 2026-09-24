require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middlewares/errorHandler');
const { verifyRequestOrigin } = require('./middlewares/csrf');
const { cleanupUploadTempFiles } = require('./middlewares/upload');
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'test') {
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 'loopback');
}

app.use(helmet());
if (process.env.NODE_ENV !== 'test') app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});
if (process.env.NODE_ENV !== 'test') app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origin is not allowed by CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: require('os').tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
}));
app.use(cleanupUploadTempFiles);

app.use(verifyRequestOrigin);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Todo List API is running', timestamp: new Date() });
});
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});
app.use(errorHandler);

module.exports = app;
