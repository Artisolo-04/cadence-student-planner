const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserById } = require("../models/User");
const { findProfileByUserId } = require("../models/Profile");

const SALT_ROUNDS = 10;

async function signup(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, passwordHash);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong during signup" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong during login" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = await findProfileByUserId(req.userId);
    res.json({ user, profile: profile || null });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { signup, login, getCurrentUser };
