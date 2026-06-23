const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

let products = [
  { id: 1, name: 'Keyboard', price: 49.99 },
  { id: 2, name: 'Mouse', price: 19.99 }
];

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'product-service' }));

app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'not found' });
  res.json(product);
});

app.post('/products', (req, res) => {
  const product = { id: products.length + 1, name: req.body.name, price: req.body.price };
  products.push(product);
  res.status(201).json(product);
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`product-service listening on ${PORT}`));
}

module.exports = app;
