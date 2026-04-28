const jwt = require('jsonwebtoken');
const SECRET = 'library-secret-key-2024';

function problem(res, status, type, title, detail, extra = {}) {
  // 1. Content-Type-ийг ямар ч нэмэлтгүйгээр (charset-гүй) онооно
  res.setHeader('Content-Type', 'application/problem+json');

  const body = JSON.stringify({
    type: `https://library.mn/problems/${type}`,
    title,
    status,
    detail,
    ...extra,
  });

  // 2. res.json()-ийн оронд res.send() ашиглана. 
  // Энэ нь Express-ийг нэмэлт header нэмэхээс сэргийлнэ.
  return res.status(status).send(body);
}

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return problem(res, 401, 'unauthorized', 'Unauthorized', 'Bearer token required');
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return problem(res, 401, 'unauthorized', 'Unauthorized', 'Invalid or expired token');
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Admin role required');
  }
  next();
}

module.exports = { authenticate, requireAdmin, problem, SECRET };