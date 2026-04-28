
const router = require("express").Router();
const db = require("../data/store");
const { sendProblem } = require("../middleware/problem");

router.post("/", (req, res) => {
  const { memberId, bookId } = req.body;

  const active = db.loans.filter(
    (x) => x.memberId == memberId && !x.returnedAt
  ).length;

  if (active >= 5) {
    return sendProblem(res, 409, "Loan Limit", "Max 5 active loans");
  }

  const book = db.books.find((b) => b.id == bookId);

  if (!book) return sendProblem(res, 404, "Not Found", "Book not found");

  if (!book.available) {
    return sendProblem(res, 422, "Unavailable", "Book already borrowed");
  }

  book.available = false;

  const loan = {
    id: db.nextId++,
    memberId,
    bookId,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    renewed: false
  };

  db.loans.push(loan);
  res.status(201).json(loan);
});

router.post("/:id/return", (req, res) => {
  const loan = db.loans.find((x) => x.id == req.params.id);
  if (!loan) return sendProblem(res, 404, "Not Found", "Loan not found");

  loan.returnedAt = new Date().toISOString();

  const book = db.books.find((b) => b.id == loan.bookId);
  if (book) book.available = true;

  res.sendStatus(204);
});

router.post("/:id/renew", (req, res) => {
  const loan = db.loans.find((x) => x.id == req.params.id);
  if (!loan) return sendProblem(res, 404, "Not Found", "Loan not found");

  if (loan.renewed) {
    return sendProblem(res, 409, "Conflict", "Already renewed once");
  }

  loan.dueDate = new Date(
    new Date(loan.dueDate).getTime() + 14 * 86400000
  ).toISOString();

  loan.renewed = true;

  res.json(loan);
});

module.exports = router;

