import request from 'supertest';
import app from '../app.js';
import { expect } from 'chai';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}


function uniqueEmail(prefix = 'user') {
  return `${prefix}${Date.now()}@example.com`;
}

let agent;

describe('Post API', function () {
  let postId;
  let userEmail = uniqueEmail('postadmin');

  before(async function () {
    agent = request.agent(app); // ✅ persistent session

    // Register and login an admin user
    await agent
      .post('/api/users/register')
      .send({ name: 'Post Admin', email: userEmail, password: 'TestPassword123', role: 'admin' });

    await agent
      .post('/api/users/login')
      .send({ email: userEmail, password: 'TestPassword123' });
  });

  it('should create a new post', async function () {
    const res = await agent
      .post('/api/posts/create')
      .send({
        title: 'Test Post',
        description: 'This is a test post',
      });

    expect(res.statusCode).to.be.oneOf([201, 200]);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('post');
    postId = res.body.post._id;
  });

  it('should create a new post with an image', async function () {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const imagePath = files.length > 0 ? path.join(uploadsDir, files[0]) : path.join(process.cwd(), 'sample.png');

    const res = await agent
      .post('/api/posts/create')
      .field('title', 'Test Post With Image')
      .field('description', 'This is a test post with image')
      .attach('image', imagePath);

    expect(res.statusCode).to.be.oneOf([201, 200]);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('post');
    expect(res.body.post).to.have.property('image');
  });

  it('should get all posts', async function () {
    const res = await agent.get('/api/posts/');
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('posts');
    expect(res.body.posts).to.be.an('array');
  });

  it('should get a post by ID', async function () {
    const res = await agent.get(`/api/posts/${postId}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('post');
    expect(res.body.post).to.have.property('_id', postId);
  });

  it('should like a post', async function () {
    const res = await agent.put(`/api/posts/${postId}/like`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('liked');
    expect(res.body).to.have.property('likes');
  });

  it('should update a post', async function () {
    const res = await agent
      .put(`/api/posts/${postId}`)
      .send({ title: 'Updated Title', description: 'Updated description' });

    expect(res.statusCode).to.be.oneOf([200, 201]);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('post');
    expect(res.body.post).to.have.property('title', 'Updated Title');
  });

  it('should delete a post', async function () {
    const res = await agent.delete(`/api/posts/${postId}`);
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message');
  });
});
