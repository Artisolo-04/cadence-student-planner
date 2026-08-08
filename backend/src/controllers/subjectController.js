const {
  createSubject,
  findSubjectById,
  findSubjectsByUserId,
  updateSubject,
  deleteSubject,
} = require("../models/Subject");

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

async function addSubject(req, res) {
  try {
    const { name, color, teacher } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    if (!color || !HEX_COLOR_RE.test(color)) {
      return res.status(400).json({ error: "A valid color is required" });
    }

    const subject = await createSubject(req.userId, {
      name: name.trim(),
      color,
      teacher: teacher?.trim(),
    });
    res.status(201).json({ subject });
  } catch (err) {
    console.error("Create subject error:", err);
    res.status(500).json({ error: "Something went wrong creating the subject" });
  }
}

async function listSubjects(req, res) {
  try {
    const subjects = await findSubjectsByUserId(req.userId);
    res.json({ subjects });
  } catch (err) {
    console.error("List subjects error:", err);
    res.status(500).json({ error: "Something went wrong fetching your subjects" });
  }
}

async function editSubject(req, res) {
  try {
    const { name, color, teacher } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    if (!color || !HEX_COLOR_RE.test(color)) {
      return res.status(400).json({ error: "A valid color is required" });
    }

    const existing = await findSubjectById(req.params.id);
    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const subject = await updateSubject(req.params.id, req.userId, {
      name: name.trim(),
      color,
      teacher: teacher?.trim(),
    });
    res.json({ subject });
  } catch (err) {
    console.error("Edit subject error:", err);
    res.status(500).json({ error: "Something went wrong updating the subject" });
  }
}

async function removeSubject(req, res) {
  try {
    const deleted = await deleteSubject(req.params.id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ id: deleted.id });
  } catch (err) {
    console.error("Remove subject error:", err);
    res.status(500).json({ error: "Something went wrong deleting the subject" });
  }
}

module.exports = {
  addSubject,
  listSubjects,
  editSubject,
  removeSubject,
};
