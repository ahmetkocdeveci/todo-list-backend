require('dotenv').config();
const mongoose = require('mongoose');

async function startWithMemoryDB() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('🔄 Starting MongoDB Memory Server for demo...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    console.log('✅ MongoDB Memory Server started at:', uri);

    process.on('exit', () => mongod.stop());
    process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
  } catch (err) {
    console.error('❌ Could not start MongoDB Memory Server:', err.message);
    process.exit(1);
  }
}

async function seedDemoData() {
  const User = require('./models/User');
  const Todo = require('./models/Todo');

  console.log('\n🌱 Seeding demo data...');

  const existing = await User.findOne({ email: 'demo@todoapp.com' });
  if (existing) {
    console.log('ℹ️  Demo data already exists, skipping seed.');
    return;
  }

  const demoUser = await User.create({
    username: 'demoadmin',
    email: 'demo@todoapp.com',
    password: 'Demo1234!',
    name: 'Demo Admin',
    bio: 'This is the demo account for Todo List App. Explore all features!',
  });

  const secondUser = await User.create({
    username: 'janesmith',
    email: 'jane@todoapp.com',
    password: 'Demo1234!',
    name: 'Jane Smith',
    bio: 'Second demo user for collaboration features.',
  });

  const todos = [
    {
      title: '🚀 Launch Todo App to Production',
      description: 'Deploy backend to Render and frontend to Vercel. Set all environment variables and run final smoke tests.',
      status: 'in-progress',
      priority: 'urgent',
      category: 'DevOps',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      tags: ['deployment', 'production', 'devops'],
      owner: demoUser._id,
    },
    {
      title: '📝 Write Unit Tests',
      description: 'Add Jest tests for authController and todoController. Aim for 80% coverage.',
      status: 'pending',
      priority: 'high',
      category: 'Testing',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      tags: ['jest', 'testing', 'backend'],
      owner: demoUser._id,
    },
    {
      title: '🎨 Improve UI/UX Design',
      description: 'Refine the Tailwind styles, add micro-animations, improve mobile responsiveness.',
      status: 'pending',
      priority: 'medium',
      category: 'Design',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['tailwind', 'nuxt', 'ui'],
      owner: demoUser._id,
    },
    {
      title: '🔐 Set Up JWT Refresh Token',
      description: 'Implement refresh token rotation for improved security and longer sessions.',
      status: 'pending',
      priority: 'high',
      category: 'Security',
      tags: ['jwt', 'auth', 'security'],
      owner: demoUser._id,
    },
    {
      title: '📧 Configure Nodemailer with Gmail',
      description: 'Generate Gmail App Password, update .env, test contact form and reminder emails.',
      status: 'completed',
      priority: 'medium',
      category: 'Backend',
      tags: ['nodemailer', 'gmail', 'email'],
      owner: demoUser._id,
    },
    {
      title: '☁️ Set Up Cloudinary',
      description: 'Create Cloudinary account, get API credentials, test image upload for todos and avatars.',
      status: 'completed',
      priority: 'medium',
      category: 'Backend',
      tags: ['cloudinary', 'images', 'upload'],
      owner: demoUser._id,
    },
    {
      title: '📱 Add PWA Support',
      description: 'Make the app installable as a Progressive Web App with offline support.',
      status: 'pending',
      priority: 'low',
      category: 'Feature',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: ['pwa', 'offline', 'nuxt'],
      owner: demoUser._id,
    },
    {
      title: '🤝 Shared Task — Review API Documentation',
      description: 'Jane has been asked to review the README and API endpoint documentation.',
      status: 'pending',
      priority: 'medium',
      category: 'Documentation',
      tags: ['docs', 'api', 'readme'],
      owner: demoUser._id,
      sharedWith: [{ user: secondUser._id, permission: 'edit' }],
    },
    {
      title: '⚡ Optimize MongoDB Indexes',
      description: 'Review current indexes on Todo collection. Add compound indexes for common query patterns.',
      status: 'pending',
      priority: 'low',
      category: 'Database',
      tags: ['mongodb', 'performance', 'index'],
      owner: demoUser._id,
    },
    {
      title: '🛡️ Add Rate Limiting to Auth Routes',
      description: 'Implement stricter rate limiting (5 req/15min) on login and register endpoints.',
      status: 'completed',
      priority: 'high',
      category: 'Security',
      tags: ['security', 'ratelimit', 'express'],
      owner: demoUser._id,
    },
  ];

  await Todo.insertMany(todos);

  await Todo.create({
    title: '📖 Read Nuxt 3 Documentation',
    description: 'Go through the official Nuxt 3 docs, especially server-side rendering and composables.',
    status: 'in-progress',
    priority: 'medium',
    category: 'Learning',
    tags: ['nuxt', 'vue', 'learning'],
    owner: secondUser._id,
  });

  console.log('✅ Demo data seeded successfully!');
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║           🎉 DEMO CREDENTIALS                ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Primary Account:                            ║');
  console.log('║  📧 Email:    demo@todoapp.com               ║');
  console.log('║  🔑 Password: Demo1234!                      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Secondary Account (Jane):                   ║');
  console.log('║  📧 Email:    jane@todoapp.com               ║');
  console.log('║  🔑 Password: Demo1234!                      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

async function main() {
  await startWithMemoryDB();

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Memory Server');

  await seedDemoData();

  const { startServer } = require('./server');
  await startServer();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
