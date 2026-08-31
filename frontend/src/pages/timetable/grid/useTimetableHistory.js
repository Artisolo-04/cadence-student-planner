import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../lib/api";

export function useTimetableHistory({
  timetableId,
  initialVersion = 0,
  initialMaxVersion = 0,
  replaceEntries,
}) {
  const [currentVersion, setCurrentVersion] = useState(initialVersion);
  const [maxVersion, setMaxVersion] = useState(initialMaxVersion);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    busyRef.current = false;
    setBusy(false);
    setCurrentVersion(initialVersion);
    setMaxVersion(initialMaxVersion);
  }, [timetableId, initialVersion, initialMaxVersion]);

  const acquire = useCallback(() => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    return true;
  }, []);

  const release = useCallback(() => {
    busyRef.current = false;
    setBusy(false);
  }, []);

  const recordMutation = useCallback((version) => {
    setCurrentVersion(version);
    setMaxVersion(version);
  }, []);

  const undo = useCallback(async () => {
    if (busyRef.current || currentVersion <= 0 || !acquire()) return;

    try {
      const { data } = await api.post(`/timetables/${timetableId}/entries/undo`);
      replaceEntries(data.entries, data.currentVersion);
      setCurrentVersion(data.currentVersion);
    } finally {
      release();
    }
  }, [acquire, currentVersion, release, replaceEntries, timetableId]);

  const redo = useCallback(async () => {
    if (busyRef.current || currentVersion >= maxVersion || !acquire()) return;

    try {
      const { data } = await api.post(`/timetables/${timetableId}/entries/redo`);
      replaceEntries(data.entries, data.currentVersion);
      setCurrentVersion(data.currentVersion);
    } finally {
      release();
    }
  }, [acquire, currentVersion, maxVersion, release, replaceEntries, timetableId]);

  return {
    busy,
    canUndo: currentVersion > 0 && !busy,
    canRedo: currentVersion < maxVersion && !busy,
    acquire,
    release,
    recordMutation,
    undo,
    redo,
  };
}
