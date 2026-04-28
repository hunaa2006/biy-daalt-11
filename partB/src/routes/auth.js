
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { SECRET } = require("../middleware/auth");

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ id: 1, role: "admin" }, SECRET, {
      expiresIn: "1h"
    });

    return res.json({
      accessToken: token,
      userId: 1
    });
  }

  if (username === "member" && password === "member123") {
    const token = jwt.sign({ id: 2, role: "member" }, SECRET, {
      expiresIn: "1h"
    });

    return res.json({
      accessToken: token,
      userId: 2
    });
  }

  return res.status(401).json({
    type: "about:blank",
    title: "Unauthorized",
    status: 401
  });
});

module.exports = router;

