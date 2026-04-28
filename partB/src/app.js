const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/books', require('./routes/books'));
app.use('/members', require('./routes/members'));
app.use('/loans', require('./routes/loans'));
app.use('/reservations', require('./routes/reservations'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => {
  res.status(404).set('Content-Type', 'application/problem+json').json({
    type: 'https://library.mn/problems/not-found',
    title: 'Not Found',
    status: 404,
    detail: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).set('Content-Type', 'application/problem+json').json({
    type: 'https://library.mn/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Library API running on http://localhost:${PORT}`));

module.exports = app;