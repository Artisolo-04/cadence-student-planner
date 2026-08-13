import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

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
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const LAST_WORKSPACE_KEY = "cadence_last_workspace";

export function useDashboardData() {
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const [timetables, setTimetables] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [workspace, setWorkspace] = useState(null);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [subjectsById, setSubjectsById] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      setLoadingList(true);
      setError(null);
      try {
        const [{ data: listData }, { data: subjData }] = await Promise.all([
          api.get("/timetables"),
          api.get("/subjects"),
        ]);
        if (cancelled) return;

        const list = listData.timetables ?? [];
        setTimetables(list);

        const map = {};
        (subjData.subjects ?? []).forEach((s) => {
          const n = normalizeSubject(s);
          map[n.id] = n;
        });
        setSubjectsById(map);

        if (list.length > 0) {
          const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
          const initial = list.find((t) => String(t.id) === lastId) ?? list[0];
          setActiveId(initial.id);
        }
      } catch (err) {
        console.error("Dashboard list load error:", err);
        if (!cancelled) setError("Couldn't load your workspaces right now.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    loadList();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeId == null) return;
    let cancelled = false;
    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const { data } = await api.get(`/timetables/${activeId}`);
        if (cancelled) return;
        setWorkspace(data.timetable);
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

  const selectWorkspace = useCallback((id) => {
    setActiveId(id);
    localStorage.setItem(LAST_WORKSPACE_KEY, String(id));
  }, []);

  const todaySessions = useMemo(() => {
    if (!workspace) return [];
    const todayIdx = getTodayIndex();
    const myGroup = workspace.my_group ?? workspace.myGroup ?? null;

    const slotsById = {};
    slots.forEach((s) => (slotsById[s.id] = s));

    return entries
      .filter((e) => (e.day_of_week ?? e.dayOfWeek) === todayIdx)
      .filter((e) => {
        const tag = e.group_tag ?? e.groupTag ?? "all";
        return tag === "all" || !myGroup || tag === myGroup;
      })
      .map((e) => {
        const slotId = e.slot_id ?? e.slotId;
        const slot = slotsById[slotId];
        const subjectId = e.subject_id ?? e.subjectId;
        const subject = subjectsById[subjectId];
        return {
          key: `${slotId}-${e.group_tag ?? e.groupTag ?? "all"}`,
          start: slot?.start_time ?? slot?.startTime ?? null,
          end: slot?.end_time ?? slot?.endTime ?? null,
          subjectName: subject?.name ?? "Unknown subject",
          teacher: subject?.teacher ?? "",
          color: subject?.color ?? "#2dd4bf",
          room: e.room ?? null,
          groupTag: e.group_tag ?? e.groupTag ?? "all",
        };
      })
      .filter((s) => s.start)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [workspace, slots, entries, subjectsById]);

  const nowMin = timeNowMinutes();
  const currentKey = todaySessions.find(
    (s) => toMinutes(s.start) <= nowMin && nowMin < toMinutes(s.end)
  )?.key;
  const nextSession = todaySessions.find((s) => toMinutes(s.start) > nowMin);

  return {
    loading: loadingList || loadingDetail,
    error,
    timetables,
    activeId,
    selectWorkspace,
    workspace,
    todaySessions,
    currentKey,
    nextSession,
    todayLabel: DAY_LABELS[getTodayIndex()],
  };
}
