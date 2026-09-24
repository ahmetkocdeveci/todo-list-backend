const mailService = require('../services/mailService');

const sendContactMail = async (req, res, next) => {
  try {
    await mailService.sendContactMail(req.body);
    res.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (error) { next(error); }
};

const sendDueDateReminders = async () => {
  try { return await mailService.sendDueDateReminders(); } catch (error) { console.error('Error sending due date reminders:', error.message); return 0; }
};

module.exports = { sendContactMail, sendDueDateReminders };
