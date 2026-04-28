
const jwt = require("jsonwebtoken");
const SECRET = "library-secret-key";

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({
      type: "about:blank",
      title: "Unauthorized",
      status: 401
    });
  }

  try {
    const token = header.replace("Bearer ", "");
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({
      type: "about:blank",
      title: "Unauthorized",
      status: 401
    });
  }
}

module.exports = { auth, SECRET };

