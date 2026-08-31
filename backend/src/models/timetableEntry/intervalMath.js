function subtractRanges(start, end, consumed) {
  const remaining = [];
  let cursor = start;
  for (const r of consumed) {
    if (r.start > cursor) remaining.push({ start: cursor, end: r.start - 1 });
    cursor = Math.max(cursor, r.end + 1);
  }
  if (cursor <= end) remaining.push({ start: cursor, end });
  return remaining;
}

function coalesceFragmentSpecs(specs) {
  const groups = new Map();
  for (const spec of specs) {
    const key = `${spec.groupTag}\u0000${spec.subjectId}\u0000${spec.room ?? "\u0000NULL"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(spec);
  }

  const merged = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.startSort - b.startSort);
    let current = null;
    for (const spec of group) {
      if (current && spec.startSort <= current.endSort + 1) {
        current.endSort = Math.max(current.endSort, spec.endSort);
      } else {
        if (current) merged.push(current);
        current = { ...spec };
      }
    }
    if (current) merged.push(current);
  }
  return merged;
}

module.exports = { subtractRanges, coalesceFragmentSpecs };
