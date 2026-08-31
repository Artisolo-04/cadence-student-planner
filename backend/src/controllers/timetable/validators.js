const VALID_GROUP_TAGS = ["all", "g1", "g2"];

function validateOp(op, index) {
  if (!op || typeof op !== "object") {
    throw { status: 400, message: `Operation at index ${index} is invalid` };
  }
  if (!["create", "update", "delete"].includes(op.op)) {
    throw { status: 400, message: `Operation at index ${index} has invalid 'op'` };
  }
  if (op.op === "delete") {
    if (op.entryId == null) {
      throw { status: 400, message: `Operation at index ${index}: entryId is required for delete` };
    }
    return;
  }
  if (op.op === "update" && op.entryId == null) {
    throw { status: 400, message: `Operation at index ${index}: entryId is required for update` };
  }
  if (op.op === "create" && !op.tempId) {
    throw { status: 400, message: `Operation at index ${index}: tempId is required for create` };
  }
  if (op.slotId == null || op.dayOfWeek == null || op.subjectId == null) {
    throw { status: 400, message: `Operation at index ${index}: slotId, dayOfWeek, subjectId are required` };
  }
  if (op.dayOfWeek < 0 || op.dayOfWeek > 6) {
    throw { status: 400, message: `Operation at index ${index}: dayOfWeek must be between 0 and 6` };
  }
  const groupTag = op.groupTag ?? "all";
  if (!VALID_GROUP_TAGS.includes(groupTag)) {
    throw { status: 400, message: `Operation at index ${index}: invalid groupTag` };
  }
}

module.exports = { VALID_GROUP_TAGS, validateOp };
