const jwt = require("jsonwebtoken");

const verifyToken = async (request, h) => {
  try {
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) {
      return h
        .response({ success: false, message: "No token provided." })
        .code(401)
        .takeover();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.auth = { credentials: decoded };

    return h.continue;
  } catch (error) {
    console.error("Token verification failed:", error);
    return h
      .response({ success: false, message: "Invalid token." })
      .code(401)
      .takeover();
  }
};

module.exports = verifyToken;
