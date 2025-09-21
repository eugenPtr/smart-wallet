const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const port = 8080;

// Get environment variables
const APP_ID = process.env.IOS_APP_ID;
const NGROK_DOMAIN = process.env.NEXT_PUBLIC_NGROK_DOMAIN;
console.log(`Using App ID: ${APP_ID}`);

// Enable CORS for all routes
app.use(cors());

// Serve the apple-app-site-association file with correct headers
app.get('/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  
  const association = {
    "webcredentials": {
      "apps": [
        APP_ID
      ]
    },
    "applinks": {
      "apps": [],
      "details": [
        {
          "appID": APP_ID,
          "paths": ["*"]
        }
      ]
    }
  };
  
  res.json(association);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Domain association server running' });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.json({ 
    message: 'Domain Association Server for iOS Passkey Development',
    endpoints: {
      '/apple-app-site-association': 'Apple App Site Association file',
      '/health': 'Health check'
    },
    instructions: [
      `1. Make sure ngrok is running: ngrok http ${port} --domain=${NGROK_DOMAIN}`,
      '2. In Xcode, add Associated Domains capability with:',
      `   - applinks:${NGROK_DOMAIN}`,
      `   - webcredentials:${NGROK_DOMAIN}`,
      '3. Build Capacitor app: npm run build && npx cap sync ios',
      '4. Run in Xcode: npx cap open ios'
    ]
  });
});

app.listen(port, () => {
  console.log(`🔗 Domain association server running on http://localhost:${port}`);
  console.log(`📱 Apple App Site Association available at: http://localhost:${port}/apple-app-site-association`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. In another terminal, run: ngrok http ${port} --domain=${NGROK_DOMAIN}`);
  console.log('2. Build your Capacitor app: npm run build && npx cap sync ios');
  console.log('3. Open and run in Xcode: npx cap open ios');
  console.log('');
  console.log('💡 Visit http://localhost:' + port + ' for full instructions');
});
