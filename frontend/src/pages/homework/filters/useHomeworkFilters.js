import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { STATUS_OPTIONS, comparePriority, isDueLater, isDueNextWeek, isDueToday, isOverdue } from "../homeworkUtils";

const DEFAULT_FILTERS = {
  search: "",
  subjectIds: [],
  priorities: [],
  statuses: [],
  due: "all",
  sort: "due_date-asc",
};

const DUE_VALUES = ["overdue", "today", "week", "later", "none"];
const STATUS_VALUES = STATUS_OPTIONS.map((o) => o.value);

export default function useHomeworkFilters(homework) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const due = searchParams.get("due");
    const statuses = (searchParams.get("status") || "").split(",").filter((s) => STATUS_VALUES.includes(s));
    return { ...DEFAULT_FILTERS, due: DUE_VALUES.includes(due) ? due : DEFAULT_FILTERS.due, statuses };
  });

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
    setFilters((current) => ({ ...DEFAULT_FILTERS, sort: current.sort }));
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

      if (filters.due === "overdue" && !isOverdue(item.due_date, item.status)) return false;
      if (filters.due === "today" && !isDueToday(item.due_date)) return false;
      if (filters.due === "week" && !isDueNextWeek(item.due_date)) return false;
      if (filters.due === "later" && !isDueLater(item.due_date)) return false;
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

  const dueCounts = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const base = homework.filter((item) => {
      if (search) {
        const haystack = `${item.title} ${item.notes || ""} ${item.subject_name || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.subjectIds.length && !filters.subjectIds.includes(item.subject_id)) return false;
      if (filters.priorities.length && !filters.priorities.includes(item.priority)) return false;
      if (filters.statuses.length && !filters.statuses.includes(item.status)) return false;
      return true;
    });
    return {
      all: base.length,
      overdue: base.filter((i) => isOverdue(i.due_date, i.status)).length,
      today: base.filter((i) => isDueToday(i.due_date)).length,
      week: base.filter((i) => isDueNextWeek(i.due_date)).length,
      later: base.filter((i) => isDueLater(i.due_date)).length,
      none: base.filter((i) => !i.due_date).length,
    };
  }, [homework, filters.search, filters.subjectIds, filters.priorities, filters.statuses]);

  const activeCount =
    filters.subjectIds.length +
    filters.priorities.length +
    filters.statuses.length +
    (filters.due !== "all" ? 1 : 0);

  return { filters, setFilter, toggleInList, reset, filtered, activeCount, dueCounts };
}
