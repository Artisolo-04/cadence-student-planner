import { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { publishWorkspaceGroupChange } from "../../lib/workspaceGroupSync";

export function useSettingsData() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [savingGroup, setSavingGroup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get("/timetables");
        if (cancelled) return;

        const list = data.timetables ?? [];
        setWorkspaces(list);

        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        console.error("Settings workspaces load error:", err);
        if (!cancelled) setError("Couldn't load your workspaces right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

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
  };
}
