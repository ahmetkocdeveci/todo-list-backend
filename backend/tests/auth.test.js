const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Auth API', () => {
  let authCookie;
  let testUser;

  const userData = {
    username: 'testuser_jest',
    email: 'testjest@example.com',
    password: 'password123',
    name: 'Test User',
  };

  beforeAll(async () => {
    await User.deleteMany({ email: userData.email });
  });

  afterAll(async () => {
    await User.deleteMany({ email: userData.email });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body).not.toHaveProperty('token');
      testUser = res.body.user;
    });

    it('should return 400 if email is already taken', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'invalid-email', username: 'uniqueuser99' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, password: '123', username: 'uniqueuser98' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body).not.toHaveProperty('token');
      authCookie = res.headers['set-cookie'];
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notexist@example.com', password: 'anypassword' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(userData.email);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('token=;') || c.includes('token=,'))).toBe(true);
    });
  });
});
