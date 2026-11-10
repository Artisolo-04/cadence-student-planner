const Homework = require("../models/Homework");

const STATUSES = new Set(["todo", "in_progress", "done"]);
const PRIORITIES = new Set(["low", "normal", "high"]);
const MAX_POSTGRES_INT = 2147483647;

function isValidId(raw) {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return false;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id <= MAX_POSTGRES_INT;
}

function isValidDate(raw) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [year, month, day] = raw.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysPerMonth[month - 1];
}

function validateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request body" };
  }

  const { subjectId, title, notes, dueDate, status, priority } = body;

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Title is required" };
  }
  if (title.trim().length > 255) {
    return { error: "Title must be 255 characters or fewer" };
  }
  if (!isValidDate(dueDate)) {
    return { error: "Due date must be a valid date in YYYY-MM-DD format" };
  }
  if (
    subjectId != null &&
    (!Number.isSafeInteger(subjectId) || subjectId <= 0 || subjectId > MAX_POSTGRES_INT)
  ) {
    return { error: "Invalid subjectId" };
  }
  if (notes != null && typeof notes !== "string") {
    return { error: "Notes must be a string" };
  }
  if (status != null && !STATUSES.has(status)) {
    return { error: "Invalid status" };
  }
  if (priority != null && !PRIORITIES.has(priority)) {
    return { error: "Invalid priority" };
  }

  return {
    value: {
      subjectId: subjectId ?? null,
      title: title.trim(),
      notes: notes ?? null,
      dueDate,
      status: status ?? null,
      priority: priority ?? null,
    },
  };
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
    const validated = validateBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    const homework = await Homework.createHomework(req.userId, validated.value);
    if (!homework) return res.status(400).json({ error: "Invalid subjectId" });
    res.status(201).json(homework);
  } catch (err) {
    console.error("createHomework error:", err);
    res.status(500).json({ error: "Failed to create homework" });
  }
}

async function updateHomework(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid homework id" });

    const validated = validateBody(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    const existing = await Homework.findHomeworkById(id, req.userId);
    if (!existing) return res.status(404).json({ error: "Homework not found" });

    const value = validated.value;
    const homework = await Homework.updateHomework(id, req.userId, {
      ...value,
      status: value.status ?? existing.status,
      priority: value.priority ?? existing.priority,
    });
    if (!homework) return res.status(400).json({ error: "Invalid subjectId" });
    res.json(homework);
  } catch (err) {
    console.error("updateHomework error:", err);
    res.status(500).json({ error: "Failed to update homework" });
  }
}

async function updateHomeworkStatus(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid homework id" });

    const status = req.body?.status;
    if (!STATUSES.has(status)) return res.status(400).json({ error: "Invalid status" });

    const existing = await Homework.findHomeworkById(id, req.userId);
    if (!existing) return res.status(404).json({ error: "Homework not found" });

    const homework = await Homework.updateHomeworkStatus(id, req.userId, status);
    if (!homework) return res.status(404).json({ error: "Homework not found" });
    res.json(homework);
  } catch (err) {
    console.error("updateHomeworkStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

async function deleteHomework(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid homework id" });

    const deleted = await Homework.deleteHomework(id, req.userId);
    if (!deleted) return res.status(404).json({ error: "Homework not found" });
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
