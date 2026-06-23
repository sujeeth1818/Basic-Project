const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 4000;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002';

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

app.get('/api/users', async (req, res) => {
  try {
    const r = await fetch(`${USER_SERVICE_URL}/users`);
    res.status(r.status).json(await r.json());
  } catch (err) {
    res.status(502).json({ error: 'user-service unavailable' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const r = await fetch(`${PRODUCT_SERVICE_URL}/products`);
    res.status(r.status).json(await r.json());
  } catch (err) {
    res.status(502).json({ error: 'product-service unavailable' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`api-gateway listening on ${PORT}`));
}

module.exports = app;
