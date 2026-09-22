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

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'fuhsi-ers-backend', version: '1.0.1-enterprise' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/clinical-entries', clinicalRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/incidents', incidentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
