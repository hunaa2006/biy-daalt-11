
const router = require("express").Router();
const db = require("../data/store");
const { sendProblem } = require("../middleware/problem");

router.get("/", (req, res) => {
  let { page = 1, limit = 10, title = "", sort = "id" } = req.query;

  page = Number(page);
  limit = Number(limit);

  let rows = db.books.filter((b) =>
    b.title.toLowerCase().includes(title.toLowerCase())
  );

  rows.sort((a, b) => (a[sort] > b[sort] ? 1 : -1));

  const start = (page - 1) * limit;

  res.json({
    items: rows.slice(start, start + limit),
    total: rows.length
  });
});

router.post("/", (req, res) => {
  const book = {
    id: db.nextId++,
    title: req.body.title,
    author: req.body.author,
    available: true
  };

  db.books.push(book);
  res.status(201).json(book);
});

router.get("/:id", (req, res) => {
  const book = db.books.find((x) => x.id == req.params.id);
  if (!book) return sendProblem(res, 404, "Not Found", "Book not found");
  res.json(book);
});

module.exports = router;

