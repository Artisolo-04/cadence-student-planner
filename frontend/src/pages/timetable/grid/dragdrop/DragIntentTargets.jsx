import { useDroppable } from "@dnd-kit/core";

export function DragIntentTargets({ cellKey, g1Disabled = false, g2Disabled = false }) {

  const g1 = useDroppable({ id: `cell::${cellKey}::g1`, disabled: g1Disabled });
  const all = useDroppable({ id: `cell::${cellKey}::all` });
  const g2 = useDroppable({ id: `cell::${cellKey}::g2`, disabled: g2Disabled });

  return (
    <div className="absolute inset-0 z-20">
      <div className="grid h-full grid-cols-[1fr_3fr_1fr]">
        <div ref={g1.setNodeRef} className="h-full" />
        <div ref={all.setNodeRef} className="h-full" />
        <div ref={g2.setNodeRef} className="h-full" />
      </div>
    </div>
  );
}
