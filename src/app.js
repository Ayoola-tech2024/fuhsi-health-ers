const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const clinicalRoutes = require('./routes/clinicalRoutes');
const contactRoutes = require('./routes/contactRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  let dbHost = 'none';
  try {
    if (process.env.DATABASE_URL) {
      const parsed = new URL(process.env.DATABASE_URL.replace(/^(postgres|postgresql):/, 'http:'));
      dbHost = parsed.hostname + (parsed.port ? `:${parsed.port}` : '');
    }
  } catch (e) {
    dbHost = 'parse_error';
  }
  res.json({
    status: 'ok',
    service: 'fuhsi-ers-backend',
    version: '1.0.1-enterprise',
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    dbHost,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/clinical-entries', clinicalRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
