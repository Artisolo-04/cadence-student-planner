import { useMemo, useState } from "react";
import { comparePriority } from "../homeworkUtils";

const DEFAULT_FILTERS = {
  search: "",
  subjectIds: [],
  priorities: [],
  statuses: [],
  due: "all",
  sort: "due_date-asc",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDueDate(dueDate) {
  const iso = String(dueDate).slice(0, 10);
  return new Date(`${iso}T00:00:00`);
}

function isDueToday(dueDate) {
  return parseDueDate(dueDate).getTime() === startOfToday().getTime();
}

function isDueThisWeek(dueDate) {
  const today = startOfToday();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const due = parseDueDate(dueDate);
  return due >= today && due <= weekEnd;
}

export default function useHomeworkFilters(homework) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleInList(key, value) {
    setFilters((current) => {
      const list = current[key];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...current, [key]: next };
    });
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
  }

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    let result = homework.filter((item) => {
      if (search) {
        const haystack = `${item.title} ${item.notes || ""} ${item.subject_name || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.subjectIds.length && !filters.subjectIds.includes(item.subject_id)) return false;
      if (filters.priorities.length && !filters.priorities.includes(item.priority)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;

      if (filters.due === "overdue" && !(item.status !== "done" && parseDueDate(item.due_date) < startOfToday())) return false;
      if (filters.due === "today" && !isDueToday(item.due_date)) return false;
      if (filters.due === "week" && !isDueThisWeek(item.due_date)) return false;
      if (filters.due === "none" && item.due_date) return false;

      return true;
    });

    const [sortKey, sortDir] = filters.sort.split("-");
    result = [...result].sort((a, b) => {
      let diff = 0;
      if (sortKey === "due_date") {
        diff = new Date(a.due_date) - new Date(b.due_date);
      } else if (sortKey === "priority") {
        diff = comparePriority(a, b);
      } else if (sortKey === "subject") {
        diff = (a.subject_name || "").localeCompare(b.subject_name || "");
      } else if (sortKey === "created") {
        diff = new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }
      return sortDir === "desc" ? -diff : diff;
    });

    return result;
  }, [homework, filters]);

  const activeCount =
    (filters.search ? 1 : 0) +
    filters.subjectIds.length +
    filters.priorities.length +
    filters.statuses.length +
    (filters.due !== "all" ? 1 : 0);

  return { filters, setFilter, toggleInList, reset, filtered, activeCount };
}
