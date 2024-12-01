const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Use CORS middleware to allow cross-origin requests
app.use(cors({
  origin: '*', // Replace '*' with your frontend domain for restricted access
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

const PAYSTACK_SECRET_KEY = 'sk_live_9c93d96ca28e52ab128970dfd783766a58d42461'; // Replace with your secret key

// Route to handle the root URL (GET /)
app.get('/', (req, res) => {
  res.send('Welcome to the Paystack payment initialization API');
});

app.post('/paystack/transaction/initialize', async (req, res) => {
  const { email, amount } = req.body;

  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  };

  const data = {
    email,
    amount,
  };

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', data, { headers });
    const { reference } = response.data.data;
    res.json({ reference });
  } catch (error) {
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
