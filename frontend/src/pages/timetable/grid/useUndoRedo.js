import { useCallback, useRef, useState } from "react";

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

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

  const push = useCallback((command) => {
    setUndoStack((stack) => [...stack, command]);
    setRedoStack([]);
  }, []);

  const reset = useCallback(() => {
    busyRef.current = false;
    setUndoStack([]);
    setRedoStack([]);
    setBusy(false);
  }, []);

  const undo = useCallback(
    async (applyUndo) => {
      if (busyRef.current) return;
      if (undoStack.length === 0) return;
      if (!acquire()) return;
      const command = undoStack[undoStack.length - 1];
      setUndoStack((stack) => stack.slice(0, -1));
      try {
        await applyUndo(command);
        setRedoStack((stack) => [...stack, command]);
      } catch (err) {
        setUndoStack((stack) => [...stack, command]);
        throw err;
      } finally {
        release();
      }
    },
    [undoStack, acquire, release]
  );

  const redo = useCallback(
    async (applyRedo) => {
      if (busyRef.current) return;
      if (redoStack.length === 0) return;
      if (!acquire()) return;
      const command = redoStack[redoStack.length - 1];
      setRedoStack((stack) => stack.slice(0, -1));
      try {
        await applyRedo(command);
        setUndoStack((stack) => [...stack, command]);
      } catch (err) {
        setRedoStack((stack) => [...stack, command]);
        throw err;
      } finally {
        release();
      }
    },
    [redoStack, acquire, release]
  );

  return {
    canUndo: undoStack.length > 0 && !busy,
    canRedo: redoStack.length > 0 && !busy,
    busy,
    acquire,
    release,
    push,
    undo,
    redo,
    reset,
  };
}
