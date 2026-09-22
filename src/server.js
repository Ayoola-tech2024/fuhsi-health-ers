require('dotenv').config();
const https = require('https');
const app = require('./app');
const { autoBootDb } = require('./db/autoBoot');

const PORT = process.env.PORT || 4000;

// Keep-alive self-ping for Render free tier (runs every 14 minutes to prevent spin-down)
function setupKeepAlive() {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || 'https://fuhsi-emergency-response-backend.onrender.com';
  console.log(`📡 Keep-Alive initialized for: ${targetUrl}`);

  setInterval(() => {
    https.get(`${targetUrl}/health`, (res) => {
      console.log(`[Keep-Alive] Self-ping status: ${res.statusCode} at ${new Date().toISOString()}`);
    }).on('error', (err) => {
      console.warn(`[Keep-Alive] Self-ping notice: ${err.message}`);
    });
  }, 14 * 60 * 1000); // every 14 minutes (Render sleeps at 15m)
}

async function start() {
  await autoBootDb();

  app.listen(PORT, () => {
    console.log(`FUHSI ERS backend listening on port ${PORT}`);
    setupKeepAlive();
  });
}

start();
