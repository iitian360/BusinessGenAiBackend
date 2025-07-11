import request from 'supertest';
import app from '../app.js';
import { expect } from 'chai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

function uniqueEmail(prefix = 'user') {
  return `${prefix}${Date.now()}@example.com`;
}

let agent;
let postId, commentId;

before(async () => {
  agent = request.agent(app); // ✅ persistent session

  const email = uniqueEmail('commentuser');

  // Register and login an admin user
  await agent
    .post('/api/users/register')
    .send({ name: 'Comment User', email, password: 'TestPassword123', role: 'admin' });

  await agent
    .post('/api/users/login')
    .send({ email, password: 'TestPassword123' });

  // Create a post to comment on
  const postRes = await agent
    .post('/api/posts/create')
    .send({ title: 'Comment Test Post', description: 'For comment tests' });

  postId = postRes.body.post._id;
});

// after(async () => {
//   if (process.env.NODE_ENV === 'test') {
//     await mongoose.connection.dropDatabase();
//     await mongoose.disconnect();
//   }
// });

describe('Comment API', function () {
  it('should create a comment on a post', async function () {
    const res = await agent
      .post('/api/comments/create')
      .send({
        content: 'This is a test comment',
        postId,
      });

    expect(res.statusCode).to.be.oneOf([201, 200]);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('comment');
    expect(res.body.comment).to.have.property('content', 'This is a test comment');
    commentId = res.body.comment._id;
  });

  it('should not create a comment without content', async function () {
    const res = await agent
      .post('/api/comments/create')
      .send({ postId });

    expect(res.statusCode).to.be.oneOf([400, 422, 500]);
    expect(res.body).to.have.property('success', false);
  });

  it('should not create a comment without postId', async function () {
    const res = await agent
      .post('/api/comments/create')
      .send({ content: 'Missing postId' });

    expect(res.statusCode).to.be.oneOf([400, 422, 500]);
    expect(res.body).to.have.property('success', false);
  });
});
