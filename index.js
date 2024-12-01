const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PAYSTACK_SECRET_KEY = 'sk_live_9c93d96ca28e52ab128970dfd783766a58d42461'; // Replace with your Paystack Secret Key

// Use bodyParser to parse incoming JSON
app.use(bodyParser.json());

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paystack Integration API',
      version: '1.0.0',
      description: 'API for integrating Paystack payment gateway to generate tickets.',
    },
    servers: [
      {
        url: 'http://localhost:5000', // Local server URL for development
      },
    ],
  },
  apis: ['./index.js'], // Path to the API docs
};

// Initialize Swagger documentation
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /paystack/transaction/initialize:
 *   post:
 *     summary: Initializes a payment transaction with Paystack
 *     description: Sends a payment initialization request to Paystack and returns a reference ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               amount:
 *                 type: integer
 *                 description: Amount in kobo (100 kobo = 1 Naira)
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   description: The reference ID for the payment
 *       500:
 *         description: Error initializing the payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message
 */

// Route to initialize Paystack payment
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

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
