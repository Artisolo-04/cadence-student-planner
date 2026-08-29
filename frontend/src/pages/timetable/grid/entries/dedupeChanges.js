import { changeKey } from "./changeKey";

export function dedupeChanges(changes) {
  const order = [];
  const byKey = new Map();

  for (const change of changes) {
    const key = changeKey(change.slotId, change.dayOfWeek, change.groupTag);
    const existing = byKey.get(key);
    if (existing) {
      existing.after = change.after;
      existing.entryId = change.entryId;
    } else {
      byKey.set(key, { ...change });
      order.push(key);
    }
  }

  return order.map((key) => byKey.get(key));
}
