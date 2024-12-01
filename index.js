const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

// Use CORS middleware to allow cross-origin requests
app.use(cors({
  origin: '*', // Replace '*' with your frontend domain for restricted access
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

const PAYSTACK_SECRET_KEY = 'sk_live_9c93d96ca28e52ab128970dfd783766a58d42461'; // Replace with your secret key

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Paystack Payment Initialization API',
      description: 'API to initialize payment transactions with Paystack',
      version: '1.0.0',
    },
    host: 'localhost:5000',
    basePath: '/',
    schemes: ['http'],
  },
  apis: ['./index.js'], // Path to the API docs (current file)
};

// Initialize Swagger-jsdoc
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route to handle the root URL (GET /)
app.get('/', (req, res) => {
  res.send('Welcome to the Paystack payment initialization API');
});

/**
 * @swagger
 * /paystack/transaction/initialize:
 *   post:
 *     summary: Initialize a Paystack payment transaction
 *     description: This endpoint initializes a payment transaction with Paystack. It returns an access_code to complete the payment.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: paymentDetails
 *         description: The payment details (email and amount).
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "customer@example.com"
 *             amount:
 *               type: integer
 *               example: 5000
 *     responses:
 *       200:
 *         description: Successfully initialized the payment transaction
 *         schema:
 *           type: object
 *           properties:
 *             access_code:
 *               type: string
 *               example: "access_abc123"
 *       500:
 *         description: Payment initialization failed
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Payment initialization failed"
 */
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
    const { access_code } = response.data.data; // Get access_code from Paystack API response
    res.json({ access_code });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Start the server on port 5000
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
