import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { useWorkspace } from "../../hooks/useWorkspace";

function normalizeSubject(raw) {
  return {
    id: raw.id,
    name: raw.name,
    teacher: raw.teacher ?? raw.teacher_name ?? "",
    color: raw.color ?? "#2dd4bf",
  };
}

function getTodayIndex() {
  return new Date().getDay();
}

function timeNowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function useDashboardData() {
  const {
    timetables,
    activeId,
    activeWorkspace,
    selectWorkspace,
    loading: loadingWorkspaces,
    error: workspaceError,
  } = useWorkspace();

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const [workspace, setWorkspace] = useState(null);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [subjectsById, setSubjectsById] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadSubjects() {
      setLoadingSubjects(true);
      try {
        const { data: subjData } = await api.get("/subjects");
        if (cancelled) return;

        const subjectMap = {};
        (subjData.subjects ?? []).forEach((subject) => {
          const normalized = normalizeSubject(subject);
          subjectMap[normalized.id] = normalized;
        });
        setSubjectsById(subjectMap);
      } catch (err) {
        console.error("Dashboard subjects load error:", err);
        if (!cancelled) setError("Couldn't load your subjects right now.");
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }

    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeId == null) {
      setWorkspace(null);
      setSlots([]);
      setEntries([]);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const { data } = await api.get(`/timetables/${activeId}`);
        if (cancelled) return;

        setWorkspace({
          ...data.timetable,
          my_group: activeWorkspace?.my_group ?? data.timetable.my_group,
        });
        setSlots(data.slots ?? []);
        setEntries(data.entries ?? []);
      } catch (err) {
        console.error("Dashboard detail load error:", err);
        if (!cancelled) setError("Couldn't load that workspace's schedule.");
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };

  }, [activeId]);

  useEffect(() => {
    if (!activeWorkspace) return;
    setWorkspace((current) => {
      if (!current || String(current.id) !== String(activeWorkspace.id)) return current;
      if ((current.my_group ?? null) === (activeWorkspace.my_group ?? null)) return current;
      return { ...current, my_group: activeWorkspace.my_group ?? null };
    });
  }, [activeWorkspace]);

  const visibleEntries = useMemo(() => {
    if (!workspace) return [];

    const myGroup = workspace.my_group ?? workspace.myGroup ?? null;

    return entries.filter((entry) => {
      const groupTag = entry.group_tag ?? entry.groupTag ?? "all";
      return groupTag === "all" || !myGroup || groupTag === myGroup;
    });
  }, [workspace, entries]);

  const todaySessions = useMemo(() => {
    if (!workspace) return [];

    const todayIdx = getTodayIndex();
    const slotsById = {};

    slots.forEach((slot) => {
      slotsById[slot.id] = slot;
    });

    return visibleEntries
      .filter(
        (entry) =>
          Number(entry.day_of_week ?? entry.dayOfWeek) === todayIdx
      )
      .map((entry) => {
        const startSlotId =
          entry.start_slot_id ??
          entry.startSlotId ??
          entry.slot_id ??
          entry.slotId;

        const endSlotId =
          entry.end_slot_id ??
          entry.endSlotId ??
          startSlotId;

        const startSlot = slotsById[startSlotId];
        const endSlot = slotsById[endSlotId] ?? startSlot;

        const subjectId = entry.subject_id ?? entry.subjectId;
        const subject = subjectsById[subjectId];
        const groupTag = entry.group_tag ?? entry.groupTag ?? "all";

        return {
          key: `${startSlotId}-${endSlotId}-${groupTag}`,
          start: startSlot?.start_time ?? startSlot?.startTime ?? null,
          end: endSlot?.end_time ?? endSlot?.endTime ?? null,
          subjectName: subject?.name ?? entry.subject_name ?? "Unknown subject",
          teacher: subject?.teacher ?? entry.subject_teacher ?? "",
          color: subject?.color ?? entry.subject_color ?? "#2dd4bf",
          room: entry.room ?? null,
          groupTag,
        };
      })
      .filter((session) => session.start && session.end)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [workspace, slots, visibleEntries, subjectsById]);

  const weekStats = useMemo(() => {
    if (!workspace) return { total: 0, busiestDay: null };

    const countByDay = {};

    visibleEntries.forEach((entry) => {
      const day = Number(entry.day_of_week ?? entry.dayOfWeek);
      countByDay[day] = (countByDay[day] || 0) + 1;
    });

    const total = Object.values(countByDay).reduce((sum, count) => sum + count, 0);

    let busiestDay = null;
    Object.entries(countByDay).forEach(([day, count]) => {
      if (!busiestDay || count > busiestDay.count) {
        busiestDay = { day: Number(day), count };
      }
    });

    return {
      total,
      busiestDay: busiestDay
        ? { label: DAY_LABELS[busiestDay.day], count: busiestDay.count }
        : null,
    };
  }, [workspace, visibleEntries]);

  const nowMin = timeNowMinutes();

  const currentKey = todaySessions.find(
    (session) =>
      toMinutes(session.start) <= nowMin && nowMin < toMinutes(session.end)
  )?.key;

  const nextSession = todaySessions.find(
    (session) => toMinutes(session.start) > nowMin
  );

  return {
    loading: loadingWorkspaces || loadingSubjects || loadingDetail,
    error: error || workspaceError,
    timetables,
    activeId,
    selectWorkspace,
    workspace,
    todaySessions,
    currentKey,
    nextSession,
    weekStats,
    todayLabel: DAY_LABELS[getTodayIndex()],
  };
}
