const sendMail = require('../utils/sendMail');
const Todo = require('../models/Todo');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendContactMail = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    await sendMail({
      to: process.env.MAIL_USER,
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151;">From:</td>
              <td style="padding: 8px;">${safeName} &lt;${safeEmail}&gt;</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="padding: 8px; font-weight: bold; color: #374151;">Subject:</td>
              <td style="padding: 8px;">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #374151; vertical-align: top;">Message:</td>
              <td style="padding: 8px; white-space: pre-line;">${safeMessage}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Sent at: ${new Date().toLocaleString('tr-TR')}
          </p>
        </div>
      `,
    });

    await sendMail({
      to: email,
      subject: 'We received your message — Todo List App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Hello, ${safeName}! 👋</h2>
          <p>Thank you for reaching out. We've received your message and will get back to you as soon as possible.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>Your message:</strong>
            <p style="white-space: pre-line; color: #374151;">${safeMessage}</p>
          </div>
          <p style="color: #6b7280;">Best regards,<br/>Todo List App Team</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (error) {
    next(error);
  }
};

const sendDueDateReminders = async () => {
  try {
    const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const upcomingTodos = await Todo.find({
      dueDate: { $lte: cutoff },
      status: { $ne: 'completed' },
      isDeleted: false,
    }).populate({
      path: 'owner',
      select: 'email name username',
      match: { isActive: true },
    });

    const grouped = {};
    upcomingTodos.forEach((todo) => {
      if (!todo.owner) return;
      const userId = todo.owner._id.toString();
      if (!grouped[userId]) {
        grouped[userId] = { owner: todo.owner, todos: [] };
      }
      grouped[userId].todos.push(todo);
    });

    for (const [, { owner, todos }] of Object.entries(grouped)) {
      const todoList = todos
        .map(
          (t) =>
            `<li style="margin-bottom: 8px;">
              <strong>${escapeHtml(t.title)}</strong>
              <span style="color: ${t.priority === 'urgent' ? '#ef4444' : '#f59e0b'};">
                [${t.priority.toUpperCase()}]
              </span>
              — Due: ${new Date(t.dueDate).toLocaleDateString('tr-TR')}
            </li>`
        )
        .join('');

      await sendMail({
        to: owner.email,
        subject: `⏰ Reminder: You have ${todos.length} upcoming todo(s)!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Hello, ${escapeHtml(owner.name || owner.username)}! 📋</h2>
            <p>You have <strong>${todos.length}</strong> overdue or upcoming todo(s):</p>
            <ul style="line-height: 1.8;">${todoList}</ul>
            <a href="${process.env.FRONTEND_URL}/todos"
               style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                      background-color: #4f46e5; color: white; border-radius: 8px;
                      text-decoration: none; font-weight: bold;">
              View My Todos
            </a>
            <p style="color: #6b7280; margin-top: 24px; font-size: 12px;">
              This is an automated reminder from Todo List App.
            </p>
          </div>
        `,
      });

      console.log(`📧 Reminder sent to ${owner.email} (${todos.length} todos)`);
    }

    console.log(`✅ Due date reminders processed: ${Object.keys(grouped).length} emails sent.`);
  } catch (error) {
    console.error('❌ Error sending due date reminders:', error.message);
  }
};

module.exports = { sendContactMail, sendDueDateReminders };
