const Homework = require("../models/Homework");

function isValidId(id) {
  return /^\d+$/.test(id);
}

async function listHomework(req, res) {
  try {
    const homework = await Homework.findHomeworkByUserId(req.userId);
    res.json(homework);
  } catch (err) {
    console.error("listHomework error:", err);
    res.status(500).json({ error: "Failed to load homework" });
  }
}

async function createHomework(req, res) {
  try {
    const { subjectId, title, notes, dueDate, status, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!dueDate) {
      return res.status(400).json({ error: "Due date is required" });
    }

    const homework = await Homework.createHomework(req.userId, {
      subjectId,
      title: title.trim(),
      notes,
      dueDate,
      status,
      priority,
    });
    res.status(201).json(homework);
  } catch (err) {
    console.error("createHomework error:", err);
    res.status(500).json({ error: "Failed to create homework" });
  }
}

async function updateHomework(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid homework id" });
    }
    const { subjectId, title, notes, dueDate, status, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!dueDate) {
      return res.status(400).json({ error: "Due date is required" });
    }

    const existing = await Homework.findHomeworkById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Homework not found" });
    }

    const homework = await Homework.updateHomework(id, req.userId, {
      subjectId,
      title: title.trim(),
      notes,
      dueDate,
      status: status || existing.status,
      priority: priority || existing.priority,
    });
    res.json(homework);
  } catch (err) {
    console.error("updateHomework error:", err);
    res.status(500).json({ error: "Failed to update homework" });
  }
}

async function updateHomeworkStatus(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid homework id" });
    }
    const { status } = req.body;

    if (!["todo", "in_progress", "done"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing = await Homework.findHomeworkById(id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Homework not found" });
    }

    const homework = await Homework.updateHomeworkStatus(id, req.userId, status);
    res.json(homework);
  } catch (err) {
    console.error("updateHomeworkStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

async function deleteHomework(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid homework id" });
    }
    const deleted = await Homework.deleteHomework(id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: "Homework not found" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteHomework error:", err);
    res.status(500).json({ error: "Failed to delete homework" });
  }
}

module.exports = {
  listHomework,
  createHomework,
  updateHomework,
  updateHomeworkStatus,
  deleteHomework,
};
