/** JWT authentication + role-based access middleware. */
"use strict";

const jwt = require("jsonwebtoken");
const store = require("./store");

const SECRET = process.env.JWT_SECRET || "JobDozo-dev-secret-change-me";
const EXPIRES = process.env.JWT_EXPIRES || "7d";

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: EXPIRES });
}

function verify(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

/**
 * auth()              -> require any logged-in user
 * auth(["admin"])     -> require one of the roles
 * auth(null, false)   -> optional (req.user = user|null)
 */
function auth(roles = null, required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token && verify(token);
    const user = payload && store.col("users").byId(payload.id);

    if (!user) {
      if (!required) { req.user = null; return next(); }
      return res.status(401).json({ error: "Login required" });
    }
    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ error: "You don't have permission for this action" });
    }
    req.user = user;
    next();
  };
}

module.exports = { sign, verify, auth, publicUser, SECRET };
