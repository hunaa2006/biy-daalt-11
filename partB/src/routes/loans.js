const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, requireAdmin, problem } = require('../middleware/auth');
const { paginate } = require('../middleware/pagination');

const MAX_LOANS = 5;
const LOAN_DAYS = 14;

// GET /loans (admin sees all, member sees own)
router.get('/', authenticate, (req, res) => {
  let loans = req.user.role === 'admin'
    ? db.loans
    : db.loans.filter(l => l.memberId === req.user.id);

  if (req.query.status) loans = loans.filter(l => l.status === req.query.status);

  const result = paginate(loans, req.query);
  res.json(result);
});

// GET /loans/:id
router.get('/:id', authenticate, (req, res) => {
  const loan = db.loans.find(l => l.id === req.params.id);
  if (!loan) return problem(res, 404, 'not-found', 'Not Found', `Loan '${req.params.id}' not found`);
  if (req.user.role !== 'admin' && loan.memberId !== req.user.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Access denied');
  }
  res.json(loan);
});

// POST /loans — borrow a book
router.post('/', authenticate, (req, res) => {
  const { bookId, memberId } = req.body;
  if (!bookId) return problem(res, 400, 'validation-error', 'Validation Error', 'bookId is required');

  const targetMemberId = (req.user.role === 'admin' && memberId) ? memberId : req.user.id;

  const member = db.members.find(m => m.id === targetMemberId);
  if (!member) return problem(res, 404, 'not-found', 'Not Found', 'Member not found');

  const book = db.books.find(b => b.id === bookId);
  if (!book) return problem(res, 404, 'not-found', 'Not Found', `Book '${bookId}' not found`);

  // Business rule: max 5 active loans
  const activeLoans = db.loans.filter(l => l.memberId === targetMemberId && l.status === 'active');
  if (activeLoans.length >= MAX_LOANS) {
    return problem(res, 422, 'loan-limit-exceeded', 'Loan Limit Exceeded',
      `Member already has ${MAX_LOANS} active loans. Cannot borrow more.`,
      { activeLoans: activeLoans.length, maxLoans: MAX_LOANS });
  }

  // Check if already borrowed this book
  const alreadyBorrowed = activeLoans.find(l => l.bookId === bookId);
  if (alreadyBorrowed) {
    return problem(res, 409, 'conflict', 'Conflict', 'Member already has an active loan for this book');
  }

  // Check availability
  if (book.availableCopies <= 0) {
    return problem(res, 409, 'conflict', 'Conflict', 'No copies available. Consider making a reservation.');
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

  const loan = {
    id: uuidv4(),
    bookId,
    bookTitle: book.title,
    memberId: targetMemberId,
    memberName: member.name,
    borrowedAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    returnedAt: null,
    status: 'active',
    extended: false,
    extensionCount: 0,
  };

  book.availableCopies -= 1;
  book.available = book.availableCopies > 0;
  member.activeLoans += 1;
  db.loans.push(loan);

  res.status(201).json(loan);
});

// PATCH /loans/:id/return — return a book
router.patch('/:id/return', authenticate, (req, res) => {
  const loan = db.loans.find(l => l.id === req.params.id);
  if (!loan) return problem(res, 404, 'not-found', 'Not Found', `Loan '${req.params.id}' not found`);
  if (req.user.role !== 'admin' && loan.memberId !== req.user.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Access denied');
  }
  if (loan.status !== 'active') {
    return problem(res, 409, 'conflict', 'Conflict', 'Loan is not active');
  }

  loan.status = 'returned';
  loan.returnedAt = new Date().toISOString();

  const book = db.books.find(b => b.id === loan.bookId);
  if (book) { book.availableCopies += 1; book.available = true; }

  const member = db.members.find(m => m.id === loan.memberId);
  if (member && member.activeLoans > 0) member.activeLoans -= 1;

  res.json(loan);
});

// PATCH /loans/:id/extend — extend by 14 more days (once)
router.patch('/:id/extend', authenticate, (req, res) => {
  const loan = db.loans.find(l => l.id === req.params.id);
  if (!loan) return problem(res, 404, 'not-found', 'Not Found', `Loan '${req.params.id}' not found`);
  if (req.user.role !== 'admin' && loan.memberId !== req.user.id) {
    return problem(res, 403, 'forbidden', 'Forbidden', 'Access denied');
  }
  if (loan.status !== 'active') {
    return problem(res, 409, 'conflict', 'Conflict', 'Can only extend active loans');
  }
  if (loan.extensionCount >= 1) {
    return problem(res, 422, 'extension-limit', 'Extension Limit Reached',
      'Loan can only be extended once', { extensionCount: loan.extensionCount });
  }

  const newDue = new Date(loan.dueDate);
  newDue.setDate(newDue.getDate() + LOAN_DAYS);
  loan.dueDate = newDue.toISOString();
  loan.extended = true;
  loan.extensionCount += 1;

  res.json(loan);
});

module.exports = router;