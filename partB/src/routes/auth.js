const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, uuidv4 } = require('../data/store');
const { problem, SECRET } = require('../middleware/auth');

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return problem(res, 400, 'validation-error', 'Validation Error', 'email and password are required');
  }
  const member = db.members.find(m => m.email === email);
  if (!member || !bcrypt.compareSync(password, member.password)) {
    return problem(res, 401, 'unauthorized', 'Unauthorized', 'Invalid email or password');
  }
  const accessToken = jwt.sign({ id: member.id, email: member.email, role: member.role, name: member.name }, SECRET, { expiresIn: '24h' });
  res.json({ accessToken, userId: member.id, name: member.name, role: member.role });
});

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return problem(res, 400, 'validation-error', 'Validation Error', 'name, email, and password are required');
  }
  if (db.members.find(m => m.email === email)) {
    return problem(res, 409, 'conflict', 'Conflict', 'Email already in use');
  }
  const member = { id: uuidv4(), name, email, password: bcrypt.hashSync(password, 10), role: 'member', activeLoans: 0, createdAt: new Date().toISOString() };
  db.members.push(member);
  const { password: _, ...safe } = member;
  res.status(201).json(safe);
});

module.exports = router;
