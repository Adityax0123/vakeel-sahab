require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const clientRoutes = require('./routes/client.routes');
const lawyerRoutes = require('./routes/lawyer.routes');
const developerRoutes = require('./routes/developer.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Fallback 404
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Central error handler (catches anything thrown synchronously in routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Vakeel Sahab API running on port ${PORT}`));
