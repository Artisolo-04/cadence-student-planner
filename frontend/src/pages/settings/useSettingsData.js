import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import {
  publishWorkspaceGroupChange,
  WORKSPACE_LIST_CHANGED_EVENT,
} from "../../lib/workspaceGroupSync";
import { useWorkspace } from "../../hooks/useWorkspace";

export function useSettingsData() {
  const { activeId } = useWorkspace();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedIdState] = useState(null);
  const [savingGroup, setSavingGroup] = useState(false);

  const hasUserSelectedRef = useRef(false);

  const setSelectedId = useCallback((id) => {
    hasUserSelectedRef.current = true;
    setSelectedIdState(id);
  }, []);

  const load = useCallback(
    async ({ preserveSelection } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get("/timetables");
        const list = data.timetables ?? [];
        setWorkspaces(list);

        setSelectedIdState((current) => {
          if (preserveSelection && current != null && list.some((w) => w.id === current)) {
            return current;
          }
          if (list.length === 0) return null;
          if (hasUserSelectedRef.current && current != null && list.some((w) => w.id === current)) {
            return current;
          }

          const activeMatch = list.find((w) => String(w.id) === String(activeId));
          return activeMatch ? activeMatch.id : list[0].id;
        });
      } catch (err) {
        console.error("Settings workspaces load error:", err);
        setError("Couldn't load your workspaces right now.");
      } finally {
        setLoading(false);
      }
    },
    [activeId]
  );

  useEffect(() => {
    load();
    
  }, []);

  useEffect(() => {
    if (hasUserSelectedRef.current) return;
    if (activeId == null) return;

    setSelectedIdState((current) => {
      if (String(current) === String(activeId)) return current;
      const match = workspaces.find((w) => String(w.id) === String(activeId));
      return match ? match.id : current;
    });
  }, [activeId, workspaces]);

  useEffect(() => {
    function handleListChanged() {
      load({ preserveSelection: true });
    }

    window.addEventListener(WORKSPACE_LIST_CHANGED_EVENT, handleListChanged);
    return () => window.removeEventListener(WORKSPACE_LIST_CHANGED_EVENT, handleListChanged);
  }, [load]);

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.id === selectedId) ?? null;

  const updateGroup = useCallback(
    async (myGroup) => {
      if (!selectedId) return;

      setSavingGroup(true);
      setError(null);

      try {
        const { data } = await api.patch(`/timetables/${selectedId}/my-group`, {
          myGroup,
        });

        setWorkspaces((previous) =>
          previous.map((workspace) =>
            workspace.id === selectedId ? data.timetable : workspace
          )
        );

        publishWorkspaceGroupChange({
          workspaceId: data.timetable.id,
          myGroup: data.timetable.my_group,
        });
      } catch (err) {
        console.error("Update group error:", err);
        setError("Couldn't update your group right now.");
      } finally {
        setSavingGroup(false);
      }
    },
    [selectedId]
  );

  return {
    workspaces,
    loading,
    error,
    selectedId,
    setSelectedId,
    selectedWorkspace,
    updateGroup,
    savingGroup,
    activeId,
  };
}
