const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const profileRoutes = require("./profile");

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from your automatically generated backend!" });
});

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
