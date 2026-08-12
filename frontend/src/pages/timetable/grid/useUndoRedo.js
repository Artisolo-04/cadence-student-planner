import { useCallback, useRef, useState } from "react";

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const busyRef = useRef(false);

  const push = useCallback((command) => {
    setUndoStack((stack) => [...stack, command]);
    setRedoStack([]);
  }, []);

  const reset = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(
    async (applyUndo) => {
      if (busyRef.current) return;
      if (undoStack.length === 0) return;
      busyRef.current = true;
      const command = undoStack[undoStack.length - 1];
      setUndoStack((stack) => stack.slice(0, -1));
      try {
        await applyUndo(command);
        setRedoStack((stack) => [...stack, command]);
      } catch (err) {
        setUndoStack((stack) => [...stack, command]);
        throw err;
      } finally {
        busyRef.current = false;
      }
    },
    [undoStack]
  );

  const redo = useCallback(
    async (applyRedo) => {
      if (busyRef.current) return;
      if (redoStack.length === 0) return;
      busyRef.current = true;
      const command = redoStack[redoStack.length - 1];
      setRedoStack((stack) => stack.slice(0, -1));
      try {
        await applyRedo(command);
        setUndoStack((stack) => [...stack, command]);
      } catch (err) {
        setRedoStack((stack) => [...stack, command]);
        throw err;
      } finally {
        busyRef.current = false;
      }
    },
    [redoStack]
  );

  return {
    canUndo: undoStack.length > 0 && !busyRef.current,
    canRedo: redoStack.length > 0 && !busyRef.current,
    push,
    undo,
    redo,
    reset,
  };
}
