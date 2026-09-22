require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');
const { scheduleDueDateReminders } = require('./controllers/cronController');

const startServer = async () => {
  await connectDB();

  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
    if (process.env.NODE_ENV !== 'test') scheduleDueDateReminders();
  });

  return server;
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
