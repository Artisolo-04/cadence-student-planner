export function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function entryKey(slotId, dayOfWeek) {
  return `${slotId}-${dayOfWeek}`;
}

export function getCellDisplay(entriesForCell) {
  const list = entriesForCell || [];
  const allEntry = list.find((e) => e.group_tag === "all");
  if (allEntry) {
    return { mode: "full", entry: allEntry };
  }
  const g1Entry = list.find((e) => e.group_tag === "g1") || null;
  const g2Entry = list.find((e) => e.group_tag === "g2") || null;
  if (g1Entry || g2Entry) {
    return { mode: "split", g1Entry, g2Entry };
  }
  return { mode: "empty" };
}

export function findEntryForGroup(entriesForCell, groupTag) {
  if (!entriesForCell) return null;
  return entriesForCell.find((e) => e.group_tag === groupTag) || null;
}

export function findAllEntriesForGroup(entriesForCell, groupTag) {
  if (!entriesForCell) return [];
  return entriesForCell.filter((e) => e.group_tag === groupTag);
}

export function getDuplicateSiblingHint({ cellEntries, targetGroupTag, subjectId }) {
  if (targetGroupTag !== "g1" && targetGroupTag !== "g2") return null;
  if (subjectId == null) return null;
  const siblingGroupTag = targetGroupTag === "g1" ? "g2" : "g1";
  const siblingEntry = findEntryForGroup(cellEntries, siblingGroupTag);
  if (siblingEntry && siblingEntry.subject_id === subjectId) {
    return `"${siblingEntry.subject_name}" is already assigned to ${siblingGroupTag.toUpperCase()} for this slot. Both groups will have the same subject — use "All" instead if they're really together.`;
  }
  return null;
}
