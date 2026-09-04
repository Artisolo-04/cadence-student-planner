const {
  createSubject,
  findSubjectById,
  findSubjectsByUserId,
  updateSubject,
  deleteSubject,
  findSubjectDetail,
} = require("../models/Subject");

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function parseTimetableId(raw) {
  if (raw == null || raw === "") return { timetableId: null, invalid: false };
  const timetableId = Number(raw);
  if (!Number.isInteger(timetableId) || timetableId <= 0) {
    return { timetableId: null, invalid: true };
  }
  return { timetableId, invalid: false };
}

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
    if (err.code === "23505") {
      return res.status(409).json({
        error: "You already have a subject with this name",
      });
    }
    console.error("Create subject error:", err);
    res.status(500).json({ error: "Something went wrong creating the subject" });
  }
}

async function listSubjects(req, res) {
  try {
    const { timetableId, invalid } = parseTimetableId(req.query.timetableId);
    if (invalid) {
      return res.status(400).json({ error: "Invalid timetableId" });
    }

    const subjects = await findSubjectsByUserId(req.userId, timetableId);
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
    if (err.code === "23505") {
      return res.status(409).json({
        error: "You already have a subject with this name",
      });
    }
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

async function getSubjectDetail(req, res) {
  try {
    const existing = await findSubjectById(req.params.id);
    if (!existing || existing.user_id !== req.userId) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const { timetableId, invalid } = parseTimetableId(req.query.timetableId);
    if (invalid) {
      return res.status(400).json({ error: "Invalid timetableId" });
    }

    if (timetableId == null) {
      const { homework } = await findSubjectDetail(req.params.id, req.userId, -1);
      return res.json({ subject: existing, entries: [], homework });
    }

    const detail = await findSubjectDetail(req.params.id, req.userId, timetableId);
    res.json({ subject: existing, ...detail });
  } catch (err) {
    console.error("Subject detail error:", err);
    res.status(500).json({ error: "Something went wrong fetching subject details" });
  }
}

module.exports = {
  addSubject,
  listSubjects,
  editSubject,
  removeSubject,
  getSubjectDetail,
};
