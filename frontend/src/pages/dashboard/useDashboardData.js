import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";
import {
  WORKSPACE_GROUP_CHANGED_EVENT,
  WORKSPACE_GROUP_SYNC_KEY,
} from "../../lib/workspaceGroupSync";

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

  const latestGroupByWorkspaceRef = useRef(new Map());

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

        const subjectMap = {};
        (subjData.subjects ?? []).forEach((subject) => {
          const normalized = normalizeSubject(subject);
          subjectMap[normalized.id] = normalized;
        });
        setSubjectsById(subjectMap);

        if (list.length > 0) {
          const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
          const initial = list.find((item) => String(item.id) === lastId) ?? list[0];
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

        const workspaceId = String(activeId);
        const hasSynchronizedGroup =
          latestGroupByWorkspaceRef.current.has(workspaceId);
        const synchronizedGroup =
          latestGroupByWorkspaceRef.current.get(workspaceId);

        setWorkspace(
          hasSynchronizedGroup
            ? { ...data.timetable, my_group: synchronizedGroup }
            : data.timetable
        );
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
    function applyGroupChange(detail) {
      if (
        !detail ||
        detail.workspaceId == null ||
        String(detail.workspaceId) !== String(activeId)
      ) {
        return;
      }

      const nextGroup = detail.myGroup ?? null;
      const workspaceId = String(detail.workspaceId);

      latestGroupByWorkspaceRef.current.set(workspaceId, nextGroup);

      setWorkspace((current) => {
        if (!current || String(current.id) !== workspaceId) return current;
        if ((current.my_group ?? null) === nextGroup) return current;

        return { ...current, my_group: nextGroup };
      });

      setTimetables((current) =>
        current.map((item) =>
          String(item.id) === workspaceId
            ? { ...item, my_group: nextGroup }
            : item
        )
      );
    }

    function handleCustomGroupChange(event) {
      applyGroupChange(event.detail);
    }

    function handleStorageGroupChange(event) {
      if (!event.newValue || event.key !== WORKSPACE_GROUP_SYNC_KEY) return;

      try {
        applyGroupChange(JSON.parse(event.newValue));
      } catch (error) {
        console.warn("Ignoring invalid workspace group synchronization event:", error);
      }
    }

    window.addEventListener(
      WORKSPACE_GROUP_CHANGED_EVENT,
      handleCustomGroupChange
    );
    window.addEventListener("storage", handleStorageGroupChange);

    return () => {
      window.removeEventListener(
        WORKSPACE_GROUP_CHANGED_EVENT,
        handleCustomGroupChange
      );
      window.removeEventListener("storage", handleStorageGroupChange);
    };
  }, [activeId]);

  const selectWorkspace = useCallback((id) => {
    setActiveId(id);
    localStorage.setItem(LAST_WORKSPACE_KEY, String(id));
  }, []);

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
    loading: loadingList || loadingDetail,
    error,
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
