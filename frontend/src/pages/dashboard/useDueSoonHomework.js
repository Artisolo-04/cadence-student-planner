import { useEffect, useState } from "react";
import api from "../../lib/api";
import { isOverdue } from "../homework/homeworkUtils";

function diffDaysFromToday(dueDate) {
  const isoDate = String(dueDate).slice(0, 10);
  const due = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function bucketHomework(list, totalLimit) {
  const overdue = [];
  const active = [];
  const future = [];

  list.forEach((item) => {
    if (item.status === "done") return;
    if (!item.due_date) {
      future.push(item);
      return;
    }
    if (isOverdue(item.due_date, item.status)) {
      overdue.push(item);
      return;
    }
    const diff = diffDaysFromToday(item.due_date);
    if (diff <= 2) active.push(item);
    else future.push(item);
  });

  const byDueDateAsc = (a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  };

  overdue.sort(byDueDateAsc);
  active.sort(byDueDateAsc);
  future.sort(byDueDateAsc);

  // Fill up to totalLimit items across the whole queue, priority order:
  // overdue first, then active, then future — never per-bucket, always global.
  let remaining = totalLimit;
  const takeOverdue = overdue.slice(0, remaining);
  remaining -= takeOverdue.length;
  const takeActive = active.slice(0, remaining);
  remaining -= takeActive.length;
  const takeFuture = future.slice(0, remaining);

  return {
    overdue: takeOverdue,
    active: takeActive,
    future: takeFuture,
    overdueTotal: overdue.length,
    activeTotal: active.length,
    futureTotal: future.length,
  };
}

export function useDueSoonHomework(totalLimit = 3) {
  const [buckets, setBuckets] = useState({
    overdue: [],
    active: [],
    future: [],
    overdueTotal: 0,
    activeTotal: 0,
    futureTotal: 0,
  });
  const [stats, setStats] = useState({ total: 0, done: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get("/homework");
        if (cancelled) return;

        const doneCount = data.filter((h) => h.status === "done").length;
        const overdueCount = data.filter((h) => isOverdue(h.due_date, h.status)).length;

        setStats({ total: data.length, done: doneCount, overdue: overdueCount });
        setBuckets(bucketHomework(data, totalLimit));
      } catch (err) {
        console.error("DueSoon load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [totalLimit]);

  return { buckets, stats, loading };
}
