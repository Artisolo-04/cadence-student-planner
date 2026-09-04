import { createContext, useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import {
  WORKSPACE_GROUP_CHANGED_EVENT,
  WORKSPACE_GROUP_SYNC_KEY,
  publishWorkspaceListChanged,
} from "../lib/workspaceGroupSync";

export const WorkspaceContext = createContext(null);

const LAST_WORKSPACE_KEY = "cadence_last_workspace";

export function WorkspaceProvider({ children }) {
  const [timetables, setTimetables] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTimetables = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get("/timetables");
      const list = data.timetables ?? [];
      setTimetables(list);

      setActiveId((current) => {
        if (current != null && list.some((t) => String(t.id) === String(current))) {
          return current;
        }
        if (list.length === 0) return null;
        const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
        const initial = list.find((item) => String(item.id) === lastId) ?? list[0];
        return initial.id;
      });

      publishWorkspaceListChanged();
    } catch (err) {
      console.error("Workspace list load error:", err);
      setError("Couldn't load your workspaces right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetables();
  }, [loadTimetables]);

  const selectWorkspace = useCallback((id) => {
    setActiveId(id);
    localStorage.setItem(LAST_WORKSPACE_KEY, String(id));
  }, []);

  useEffect(() => {
    function applyGroupChange(detail) {
      if (!detail || detail.workspaceId == null) return;
      const workspaceId = String(detail.workspaceId);
      const nextGroup = detail.myGroup ?? null;

      setTimetables((current) =>
        current.map((item) =>
          String(item.id) === workspaceId ? { ...item, my_group: nextGroup } : item
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
      } catch (err) {
        console.warn("Ignoring invalid workspace group synchronization event:", err);
      }
    }

    window.addEventListener(WORKSPACE_GROUP_CHANGED_EVENT, handleCustomGroupChange);
    window.addEventListener("storage", handleStorageGroupChange);

    return () => {
      window.removeEventListener(WORKSPACE_GROUP_CHANGED_EVENT, handleCustomGroupChange);
      window.removeEventListener("storage", handleStorageGroupChange);
    };
  }, []);

  const activeWorkspace =
    timetables.find((t) => String(t.id) === String(activeId)) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        timetables,
        activeId,
        activeWorkspace,
        selectWorkspace,
        refreshTimetables: loadTimetables,
        loading,
        error,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
