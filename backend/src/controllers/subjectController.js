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

function validateSubjectInput(body) {
  const { name, color, teacher } = body ?? {};
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Subject name is required" };
  }
  if (name.trim().length > 255) {
    return { error: "Subject name must be 255 characters or fewer" };
  }
  if (typeof color !== "string" || !HEX_COLOR_RE.test(color)) {
    return { error: "A valid color is required" };
  }
  if (teacher != null && typeof teacher !== "string") {
    return { error: "Teacher must be a string" };
  }
  if (typeof teacher === "string" && teacher.trim().length > 255) {
    return { error: "Teacher must be 255 characters or fewer" };
  }
  return {
    value: {
      name: name.trim(),
      color,
      teacher: typeof teacher === "string" ? teacher.trim() : null,
    },
  };
}

function parseSubjectId(raw) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function addSubject(req, res) {
  try {
    const validated = validateSubjectInput(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    const subject = await createSubject(req.userId, validated.value);
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
    const id = parseSubjectId(req.params.id);
    if (!id) return res.status(404).json({ error: "Subject not found" });

    const validated = validateSubjectInput(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });

    const subject = await updateSubject(id, req.userId, validated.value);
    if (!subject) return res.status(404).json({ error: "Subject not found" });
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
    const id = parseSubjectId(req.params.id);
    if (!id) return res.status(404).json({ error: "Subject not found" });
    const deleted = await deleteSubject(id, req.userId);
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
    const id = parseSubjectId(req.params.id);
    if (!id) return res.status(404).json({ error: "Subject not found" });

    const existing = await findSubjectById(id, req.userId);
    if (!existing) return res.status(404).json({ error: "Subject not found" });

    const { timetableId, invalid } = parseTimetableId(req.query.timetableId);
    if (invalid) {
      return res.status(400).json({ error: "Invalid timetableId" });
    }

    if (timetableId == null) {
      const { homework } = await findSubjectDetail(id, req.userId, -1);
      return res.json({ subject: existing, entries: [], homework });
    }

    const detail = await findSubjectDetail(id, req.userId, timetableId);
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
