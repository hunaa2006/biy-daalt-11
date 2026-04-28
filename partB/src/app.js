
const express = require("express");
const app = express();

const { auth } = require("./middleware/auth");

app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/books", require("./routes/books"));
app.use("/loans", auth, require("./routes/loans"));

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

