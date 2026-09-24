const cron = require('node-cron');
const { sendDueDateReminders } = require('../services/mailService');

const scheduleDueDateReminders = () => {
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('⏰ Running due date reminder cron job...');
      await sendDueDateReminders();
    },
    {
      timezone: 'Europe/Istanbul',
      noOverlap: true,
    }
  );

  console.log('📅 Due date reminder cron job scheduled (daily at 08:00 Istanbul time)');
};

module.exports = { scheduleDueDateReminders };
