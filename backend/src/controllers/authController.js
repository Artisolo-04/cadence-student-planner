const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserById } = require("../models/User");
const { findProfileByUserId } = require("../models/Profile");

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body, isSignup) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const { email: rawEmail, password } = body;
  if (typeof rawEmail !== "string" || typeof password !== "string") {
    return { error: "Email and password are required" };
  }

  const email = rawEmail.trim();
  const emailLength = Array.from(email).length;
  if (!email || emailLength > 255 || !EMAIL_RE.test(email)) {
    return { error: "A valid email address is required" };
  }

  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes === 0 || passwordBytes > 1024) {
    return { error: "Password must be between 1 and 1024 bytes" };
  }
  if (isSignup && Array.from(password).length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (isSignup && passwordBytes > 72) {
    return { error: "Password must be 72 bytes or fewer" };
  }

  return { value: { email, password } };
}

async function signup(req, res) {
  const input = validateCredentials(req.body, true);
  if (input.error) return res.status(400).json({ error: input.error });

  try {
    const { email, password } = input.value;
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, passwordHash);
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Something went wrong during signup" });
  }
}

async function login(req, res) {
  const input = validateCredentials(req.body, false);
  if (input.error) return res.status(400).json({ error: input.error });

  try {
    const { email, password } = input.value;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong during login" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = await findProfileByUserId(req.userId);
    return res.json({ user, profile: profile || null });
  } catch (err) {
    console.error("Get current user error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { signup, login, getCurrentUser };
