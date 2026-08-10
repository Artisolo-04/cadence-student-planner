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

function buildState(entriesForCell) {
  const all = findEntryForGroup(entriesForCell, "all");
  const g1 = findEntryForGroup(entriesForCell, "g1");
  const g2 = findEntryForGroup(entriesForCell, "g2");
  return {
    all: all ? { subject_id: all.subject_id, name: all.subject_name, room: all.room } : null,
    g1: g1 ? { subject_id: g1.subject_id, name: g1.subject_name, room: g1.room } : null,
    g2: g2 ? { subject_id: g2.subject_id, name: g2.subject_name, room: g2.room } : null,
  };
}

export function planEntrySave({
  cellEntries = [],
  sourceGroupTag,
  targetGroupTag,
  subjectId,
  room,
}) {
  const normalizedRoom = room?.trim() || null;
  const currentState = buildState(cellEntries);

  const simulatedState = {
    all: currentState.all ? { ...currentState.all } : null,
    g1: currentState.g1 ? { ...currentState.g1 } : null,
    g2: currentState.g2 ? { ...currentState.g2 } : null,
  };

  if (targetGroupTag === "all") {
    simulatedState.all = { subject_id: subjectId, name: null, room: null };
    simulatedState.g1 = null;
    simulatedState.g2 = null;
  } else if (targetGroupTag === "g1" || targetGroupTag === "g2") {
    simulatedState[targetGroupTag] = { subject_id: subjectId, name: null, room: null };
  }

  const deletions = new Set();
  const warnings = [];
  let swap = null;
  let finalGroupTag = targetGroupTag;
  let actionType = "other";

  const siblingGroupTag = targetGroupTag === "g1" ? "g2" : "g1";
  const siblingCurrent = currentState[siblingGroupTag];
  const sourceCurrent = sourceGroupTag ? (sourceGroupTag === "all" ? currentState.all : currentState[sourceGroupTag]) : null;
  const targetCurrent = targetGroupTag === "all" ? currentState.all : currentState[targetGroupTag];

  function pushDeletion(gTag, msg) {
    deletions.add(gTag);
    if (msg) warnings.push(msg);
  }

  function buildResult(reason) {
    return {
      deletions: Array.from(deletions),
      swap,
      warnings,
      needsConfirm: warnings.length > 0 || Boolean(swap),
      finalGroupTag,
      noop: false,
      actionType,
      debug: {
        reason,
        currentState,
        simulatedState,
      },
    };
  }

  if (targetCurrent && targetCurrent.subject_id === subjectId) {
    const convertingToAllRemoves = targetGroupTag === "all" && (currentState.g1 || currentState.g2);
    const roomChanged = (targetCurrent.room || null) !== normalizedRoom;

    if (!convertingToAllRemoves && !roomChanged) {
      return {
        deletions: [],
        swap: null,
        warnings: [],
        needsConfirm: false,
        finalGroupTag,
        noop: true,
        actionType: "noop",
        debug: { reason: "exact match at target -> noop", currentState, simulatedState },
      };
    }
  }

  if (targetGroupTag === "all") {
    const isSafeExpandFromG1 =
      currentState.g1?.subject_id === subjectId && !currentState.g2;
    const isSafeExpandFromG2 =
      currentState.g2?.subject_id === subjectId && !currentState.g1;

    if (isSafeExpandFromG1 || isSafeExpandFromG2) {
      deletions.add(isSafeExpandFromG1 ? "g1" : "g2");
      finalGroupTag = "all";
      actionType = "expand";
      return buildResult("expand-group-to-all");
    }

    if (currentState.g1) pushDeletion("g1", `G1's separate subject ("${currentState.g1.name}") will be removed.`);
    if (currentState.g2) pushDeletion("g2", `G2's separate subject ("${currentState.g2.name}") will be removed.`);
    finalGroupTag = "all";
    actionType = "convert";
    return buildResult("convert-to-all");
  }

  if (
    sourceGroupTag === "all" &&
    sourceCurrent &&
    sourceCurrent.subject_id !== subjectId &&
    (targetGroupTag === "g1" || targetGroupTag === "g2")
  ) {
    swap = {
      groupTag: siblingGroupTag,
      subjectId: sourceCurrent.subject_id,
      room: sourceCurrent.room,
    };
    warnings.push(
      `This will split the shared slot: ${targetGroupTag.toUpperCase()} will become the selected subject, and ${siblingGroupTag.toUpperCase()} will keep "${sourceCurrent.name}".`
    );
    actionType = "split";
    finalGroupTag = targetGroupTag;
    return buildResult("split-shared-subject");
  }

  if (
    sourceGroupTag &&
    sourceGroupTag !== targetGroupTag &&
    sourceCurrent &&
    sourceCurrent.subject_id === subjectId &&
    !targetCurrent
  ) {
    deletions.add(sourceGroupTag);
    actionType = "move";
    finalGroupTag = targetGroupTag;
    return buildResult("move-source-to-target");
  }

  if (
    sourceGroupTag &&
    sourceGroupTag !== targetGroupTag &&
    sourceCurrent &&
    sourceCurrent.subject_id === subjectId &&
    targetCurrent &&
    targetCurrent.subject_id !== subjectId
  ) {
    swap = {
      groupTag: sourceGroupTag,
      subjectId: targetCurrent.subject_id,
      room: targetCurrent.room,
    };
    warnings.push(
      `${targetGroupTag.toUpperCase()} currently has "${targetCurrent.name}". Continuing will swap the two groups: "${sourceCurrent.name}" goes to ${targetGroupTag.toUpperCase()} and "${targetCurrent.name}" goes to ${sourceGroupTag.toUpperCase()}.`
    );
    actionType = "swap";
    finalGroupTag = targetGroupTag;
    return buildResult("swap-group-subjects");
  }

  if (siblingCurrent && siblingCurrent.subject_id === subjectId) {
    if (sourceGroupTag && sourceGroupTag !== targetGroupTag && sourceCurrent && sourceCurrent.subject_id && sourceCurrent.subject_id !== subjectId) {
      swap = {
        groupTag: sourceGroupTag,
        subjectId: sourceCurrent.subject_id,
        room: sourceCurrent.room,
      };
      warnings.push(
        `${siblingGroupTag.toUpperCase()} currently has "${siblingCurrent.name}". Continuing will move "${siblingCurrent.name}" into ${targetGroupTag.toUpperCase()} and place "${sourceCurrent.name}" into ${siblingGroupTag.toUpperCase()}.`
      );
      actionType = "swap";
      finalGroupTag = targetGroupTag;
      return buildResult("swap-intent-detected");
    }

    finalGroupTag = "all";
    pushDeletion(siblingGroupTag, `Both groups would have the same subject ("${siblingCurrent.name}"). Saving will merge them into a single All slot instead.`);
    actionType = "merge";
    return buildResult("duplicate-merge");
  }

  if (targetCurrent && targetCurrent.subject_id && targetCurrent.subject_id !== subjectId) {
    pushDeletion(targetGroupTag, `${targetGroupTag.toUpperCase()} currently has "${targetCurrent.name}". Saving will remove it and replace with the selected subject.`);
    actionType = "overwrite";
    finalGroupTag = targetGroupTag;
    return buildResult("overwrite");
  }

  actionType = "other";
  finalGroupTag = targetGroupTag;
  return buildResult("fallback-assign");
}
