const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();

// Use CORS middleware to allow cross-origin requests
app.use(cors({
  origin: '*', // For production, you should restrict this to your frontend domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

// IMPORTANT: Store your secret key in an environment variable (.env file)
// const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_SECRET_KEY = 'sk_live_3dae1ef6b543efb1ac07723c4db49b3c3e873185'; // Using hardcoded key for this example as provided

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Paystack Payment API',
      description: 'API to manage Paystack payments and subaccounts',
      version: '1.0.0',
    },
    host: 'localhost:5000', // Update with your actual host
    basePath: '/',
    schemes: ['http', 'https'],
  },
  apis: ['./index.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('Welcome to the Paystack payment API');
});


/**
 * @swagger
 * /paystack/transaction/initialize:
 * post:
 * summary: Initialize a Paystack payment transaction
 * ...
 */
app.post('/paystack/transaction/initialize', async (req, res) => {
  const { email, amount, subaccount, split } = req.body;
  const headers = { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` };
  const data = { email, amount, subaccount, split };

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', data, { headers });
    const { access_code } = response.data.data;
    res.json({ access_code });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

/**
 * @swagger
 * /create-subaccount:
 * post:
 * summary: Checks for and creates a Paystack subaccount if it doesn't exist.
 * description: This endpoint first checks if a subaccount with the given account number and bank exists. If not, it creates a new one.
 * ...
 */
app.post('/create-subaccount', async (req, res) => {
  const { business_name, settlement_bank, account_number, percentage_charge } = req.body;

  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // --- STEP 1: Check if a subaccount already exists ---
    const listResponse = await axios.get('https://api.paystack.co/subaccount', { headers });
    const subaccounts = listResponse.data.data;

    const matchingSubaccount = subaccounts.find(
      (sub) => sub.account_number === account_number && sub.settlement_bank.includes(business_name)
    );

    if (matchingSubaccount) {
      console.log('Subaccount already exists:', matchingSubaccount.subaccount_code);
      // If it exists, return a success message indicating no action was needed.
      return res.status(200).json({
        message: 'Subaccount already exists.',
        subaccount_code: matchingSubaccount.subaccount_code
      });
    }

    // --- STEP 2: If no match is found, create a new subaccount ---
    console.log('No matching subaccount found. Creating a new one...');
    const createData = {
      business_name,
      settlement_bank,
      account_number,
      percentage_charge,
    };

    const createResponse = await axios.post('https://api.paystack.co/subaccount', createData, { headers });
    const { subaccount_code } = createResponse.data.data;

    console.log('Subaccount created successfully:', subaccount_code);
    res.status(201).json({
        message: 'Subaccount created successfully.',
        subaccount_code: subaccount_code
    });

  } catch (error) {
    console.error('Subaccount setup failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Subaccount creation or verification failed.' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
