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
      title: 'Paystack Payment API',
      description: 'API to manage Paystack payments and subaccounts',
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
  res.send('Welcome to the Paystack payment API');
});

/**
 * @swagger
 * /paystack/transaction/initialize:
 *   post:
 *     summary: Initialize a Paystack payment transaction
 *     description: Initializes a payment transaction with Paystack and includes split payment configuration.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: paymentDetails
 *         description: The payment details (email, amount, subaccount, split configuration).
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
 *             subaccount:
 *               type: string
 *               example: "ACCT_xxx"
 *             split:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "percentage"
 *                 subaccounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subaccount:
 *                         type: string
 *                         example: "ACCT_xxx"
 *                       share:
 *                         type: integer
 *                         example: 50
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
  const { email, amount, subaccountCode } = req.body;

  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  };

 const splitPayment = subaccountCode ? {
    type: 'percentage', 
    subaccounts: [{ subaccount: subaccountCode, share: 50 }] 
  } : undefined;

  const data = {
    email,
    amount: amount * 100,  
    split: splitPayment,
  };

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', data, { headers });
    const { access_code } = response.data.data; // Get access_code from Paystack API response
    res.json({ access_code });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

/**
 * @swagger
 * /create-subaccount:
 *   post:
 *     summary: Create a Paystack subaccount
 *     description: Creates a subaccount for payment splits.
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: subaccountDetails
 *         description: The subaccount details (business name, settlement bank, account number, and percentage charge).
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             business_name:
 *               type: string
 *               example: "Oasis"
 *             settlement_bank:
 *               type: string
 *               example: "058"
 *             account_number:
 *               type: string
 *               example: "0123456047"
 *             percentage_charge:
 *               type: integer
 *               example: 30
 *     responses:
 *       200:
 *         description: Subaccount successfully created
 *         schema:
 *           type: object
 *           properties:
 *             subaccount_code:
 *               type: string
 *               example: "ACCT_xxx"
 *       500:
 *         description: Subaccount creation failed
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               example: "Subaccount creation failed"
 */
app.post('/create-subaccount', async (req, res) => {
  const { business_name, settlement_bank, account_number, percentage_charge } = req.body;

  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  const data = {
    business_name,
    settlement_bank,
    account_number,
    percentage_charge,
  };

  try {
    const response = await axios.post('https://api.paystack.co/subaccount', data, { headers });
    const { subaccount_code } = response.data.data; // Get subaccount code from Paystack API response
    res.json({ subaccount_code });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Subaccount creation failed' });
  }
});

// Start the server on port 5000
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
