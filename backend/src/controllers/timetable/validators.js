const VALID_GROUP_TAGS = ["all", "g1", "g2"];

function isPositiveId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function parsePositiveRouteId(raw) {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function validateEntryInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const { slotId, endSlotId, dayOfWeek, subjectId } = body;
  const groupTag = body.groupTag ?? "all";
  const room = body.room ?? null;

  if (slotId == null || dayOfWeek == null || subjectId == null) {
    return { error: "slotId, dayOfWeek, and subjectId are required" };
  }
  if (!isPositiveId(slotId) || !isPositiveId(subjectId)) {
    return { error: "slotId and subjectId must be positive integers" };
  }
  if (endSlotId != null && !isPositiveId(endSlotId)) {
    return { error: "endSlotId must be a positive integer" };
  }
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { error: "dayOfWeek must be an integer between 0 and 6" };
  }
  if (!VALID_GROUP_TAGS.includes(groupTag)) {
    return { error: "groupTag must be 'all', 'g1', or 'g2'" };
  }
  if (room !== null && typeof room !== "string") {
    return { error: "room must be a string or null" };
  }
  if (typeof room === "string" && room.trim().length > 100) {
    return { error: "room must be 100 characters or fewer" };
  }

  return {
    value: {
      slotId,
      endSlotId: endSlotId ?? slotId,
      dayOfWeek,
      subjectId,
      groupTag,
      room: typeof room === "string" && room.trim() ? room.trim() : null,
    },
  };
}

function validateOp(op, index) {
  const prefix = `Operation at index ${index}`;

  if (!op || typeof op !== "object" || Array.isArray(op)) {
    throw { status: 400, message: `${prefix} is invalid` };
  }
  if (!["create", "update", "delete"].includes(op.op)) {
    throw { status: 400, message: `${prefix} has invalid 'op'` };
  }

  if (op.op === "delete") {
    if (!isPositiveId(op.entryId)) {
      throw { status: 400, message: `${prefix}: entryId must be a positive integer for delete` };
    }
    return;
  }

  if (op.op === "update" && !isPositiveId(op.entryId)) {
    throw { status: 400, message: `${prefix}: entryId must be a positive integer for update` };
  }
  if (op.op === "create" && (typeof op.tempId !== "string" || !op.tempId.trim())) {
    throw { status: 400, message: `${prefix}: tempId is required for create` };
  }

  const result = validateEntryInput(op);
  if (result.error) {
    throw { status: 400, message: `${prefix}: ${result.error}` };
  }
}

module.exports = { VALID_GROUP_TAGS, parsePositiveRouteId, validateEntryInput, validateOp };
