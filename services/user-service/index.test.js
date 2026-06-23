const request = require('supertest');
const app = require('./index');

describe('user-service', () => {
  it('returns health ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('lists users', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates a user', async () => {
    const res = await request(app).post('/users').send({ name: 'Charlie' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Charlie');
  });
});
