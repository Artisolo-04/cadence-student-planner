import { useState } from "react";

const DEFAULT_OPTIONS = {
  groupVisibility: "both",
  showTeacher: false,
  showRoom: false,
};

function storageKey(timetableId) {
  return `cadence-timetable-view-options:${timetableId}`;
}

function readOptions(timetableId) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(timetableId)));
    return { ...DEFAULT_OPTIONS, ...stored };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

export default function useTimetableViewOptions(timetableId) {
  const [optionsByTimetable, setOptionsByTimetable] = useState({});

  const viewOptions = timetableId
    ? optionsByTimetable[timetableId] || readOptions(timetableId)
    : DEFAULT_OPTIONS;

  function setViewOption(name, value) {
    if (!timetableId) return;

    const current = optionsByTimetable[timetableId] || readOptions(timetableId);
    const next = { ...current, [name]: value };

    localStorage.setItem(storageKey(timetableId), JSON.stringify(next));
    setOptionsByTimetable((previous) => ({
      ...previous,
      [timetableId]: next,
    }));
  }

  return { viewOptions, setViewOption };
}
