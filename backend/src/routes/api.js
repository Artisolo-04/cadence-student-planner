const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const profileRoutes = require("./profile");
const timetableRoutes = require("./timetable");
const subjectRoutes = require("./subject");
const homeworkRoutes = require("./homework");

router.get("/hello", (req, res) => {
  res.json({ message: "Hello from your automatically generated backend!" });
});

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/timetables", timetableRoutes);
router.use("/subjects", subjectRoutes);
router.use("/homework", homeworkRoutes);

module.exports = router;
