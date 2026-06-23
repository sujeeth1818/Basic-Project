const request = require('supertest');
const app = require('./index');

describe('product-service', () => {
  it('returns health ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('lists products', async () => {
    const res = await request(app).get('/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates a product', async () => {
    const res = await request(app).post('/products').send({ name: 'Monitor', price: 199.99 });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Monitor');
  });
});
