const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, problem } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');

// GET /reservations
router.get('/', authenticate, (req, res) => {
  let reservations = req.user.role === 'admin'
    ? db.reservations
    : db.reservations.filter(r => r.memberId === req.user.id);
  const result = paginate(reservations, req.query);
  res.json(result);
});

// POST /reservations
router.post('/', authenticate, (req, res) => {
  const { bookId } = req.body;
  if (!bookId) return problem(res, 400, 'validation-error', 'Validation Error', 'bookId is required');

  const book = db.books.find(b => b.id === bookId);
  if (!book) return problem(res, 404, 'not-found', 'Not Found', `Book '${bookId}' not found`);

  if (book.availableCopies > 0) {
    return problem(res, 409, 'conflict', 'Conflict', 'Book is available. Please borrow it directly instead of reserving.');
  }

  const existing = db.reservations.find(r => r.bookId === bookId && r.memberId === req.user.id && r.status === 'active');
  if (existing) {
    return problem(res, 409, 'conflict', 'Conflict', 'You already have an active reservation for this book');
  }

  const reservation = {
    id: uuidv4(),
    bookId,
    bookTitle: book.title,
    memberId: req.user.id,
    memberName: req.user.name,
    reservedAt: new Date().toISOString(),
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  db.reservations.push(reservation);
  res.status(201).json(reservation);
});

// DELETE /reservations/:id — cancel
router.delete('/:id', authenticate, (req, res) => {
  const idx = db.reservations.findIndex(r => r.id === req.params.id);
  if (idx === -1) return problem(res, 404, 'not-found', 'Not Found', `Reservation '${req.params.id}' not found`);

  const reservation = db.reservations[idx];
  if (req.user.role !== 'admin' && reservation.memberId !== req.user.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Access denied');
  }

  db.reservations.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;