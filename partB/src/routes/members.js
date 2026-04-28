const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, requireAdmin, problem } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');

// GET /members (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const safe = db.members.map(({ password, ...m }) => m);
  const result = paginate(safe, req.query);
  res.json(result);
});

// GET /members/:id
router.get('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'You can only view your own profile');
  }
  const member = db.members.find(m => m.id === req.params.id);
  if (!member) return problem(res, 404, 'not-found', 'Not Found', `Member '${req.params.id}' not found`);
  const { password, ...safe } = member;
  res.json(safe);
});

// GET /members/:id/loans
router.get('/:id/loans', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Access denied');
  }
  const loans = db.loans.filter(l => l.memberId === req.params.id);
  const result = paginate(loans, req.query);
  res.json(result);
});

module.exports = router;