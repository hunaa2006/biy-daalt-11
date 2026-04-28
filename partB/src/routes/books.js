const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, requireAdmin, problem } = require('../middleware/auth');
const { paginate, sortAndFilter } = require('../middleware/pagination');

// GET /books
router.get('/', authenticate, (req, res) => {
  const filtered = sortAndFilter(db.books, req.query, ['title', 'author', 'genre', 'createdAt']);
  const result = paginate(filtered, req.query);
  res.json(result);
});

// GET /books/:id
router.get('/:id', authenticate, (req, res) => {
  const book = db.books.find(b => b.id === req.params.id);
  if (!book) return problem(res, 404, 'not-found', 'Not Found', `Book with id '${req.params.id}' not found`);
  res.json(book);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const { title, author, isbn, genre, totalCopies } = req.body;

  if (!title || !author || !isbn) {
    return problem(res, 400, 'validation-error', 'Validation Error', 'title, author, and isbn are required');
  }

  if (db.books.find(b => b.isbn === isbn)) {
    return problem(res, 409, 'conflict', 'Conflict', 'A book with this ISBN already exists');
  }

  const copies = Math.max(1, parseInt(totalCopies) || 1);

  const book = {
    id: uuidv4(),
    title,
    author,
    isbn,
    genre: genre || 'General',
    available: true,
    totalCopies: copies,
    availableCopies: copies,
    createdAt: new Date().toISOString()
  };

  db.books.push(book);
  res.status(201).json(book);
});

// PUT /books/:id (admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const idx = db.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return problem(res, 404, 'not-found', 'Not Found', `Book '${req.params.id}' not found`);
  }

  const { title, author, isbn, genre, totalCopies } = req.body;
  const book = db.books[idx];

  // 🔥 ISBN давхцах шалгалт
  if (isbn && db.books.find(b => b.isbn === isbn && b.id !== req.params.id)) {
    return problem(res, 409, 'conflict', 'Conflict', 'A book with this ISBN already exists');
  }

  const copies = Math.max(1, parseInt(totalCopies) || book.totalCopies);

  db.books[idx] = {
    ...book,
    title: title || book.title,
    author: author || book.author,
    isbn: isbn || book.isbn,
    genre: genre || book.genre,
    totalCopies: copies,
    availableCopies: Math.min(book.availableCopies, copies), // 🔥 хамгаалалт
    updatedAt: new Date().toISOString()
  };

  res.json(db.books[idx]);
});

// DELETE /books/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const idx = db.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return problem(res, 404, 'not-found', 'Not Found', `Book '${req.params.id}' not found`);
  const activeLoans = db.loans.filter(l => l.bookId === req.params.id && l.status === 'active');
  if (activeLoans.length > 0) {
    return problem(res, 409, 'conflict', 'Conflict', 'Cannot delete book with active loans');
  }
  db.books.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;