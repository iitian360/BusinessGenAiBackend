import request from 'supertest';
import app from '../app.js';
import { expect } from 'chai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load .env.test if running in test mode
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

// Helper to generate unique emails
function uniqueEmail(prefix = 'user') {
  return `${prefix}${Date.now()}@example.com`;
}

// after(async () => {
//   // Clean up test database after all tests
//   if (process.env.NODE_ENV === 'test') {
//     await mongoose.connection.dropDatabase();
//     await mongoose.disconnect();
//   }
// });

describe('User API', function () {
  describe('POST /api/users/register', function () {
    it('should register a new user', async function () {
      const email = uniqueEmail('testuser');
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email,
          password: 'TestPassword123',
        });
      expect(res.statusCode).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('email', email);
    });

    it('should not register a user with an existing email', async function () {
      const email = uniqueEmail('duplicate');
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email,
          password: 'TestPassword123',
        });
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email,
          password: 'TestPassword123',
        });
      expect(res.statusCode).to.be.oneOf([400, 409]);
      expect(res.body).to.have.property('success', false);
    });

    it('should not register a user with missing fields', async function () {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: uniqueEmail('missingfields'),
        });
      expect(res.statusCode).to.be.oneOf([400, 422]);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('POST /api/users/login', function () {
    it('should login an existing user', async function () {
      const email = uniqueEmail('loginuser');
      // Register user first
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Login User',
          email,
          password: 'TestPassword123',
        });
      // Now login
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email,
          password: 'TestPassword123',
        });
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.user).to.have.property('email', email);
    });

    it('should not login with wrong password', async function () {
      const email = uniqueEmail('wrongpass');
      // Register user first
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Wrong Password User',
          email,
          password: 'TestPassword123',
        });
      // Try wrong password
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email,
          password: 'WrongPassword',
        });
      expect(res.statusCode).to.be.oneOf([400, 401]);
      expect(res.body).to.have.property('success', false);
    });

    it('should not login non-existent user', async function () {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: uniqueEmail('nonexistent'),
          password: 'AnyPassword',
        });
      expect(res.statusCode).to.be.oneOf([400, 401, 404]);
      expect(res.body).to.have.property('success', false);
    });
  });
});
