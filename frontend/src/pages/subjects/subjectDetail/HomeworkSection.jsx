import { Plus } from "lucide-react";
import Checkbox from "../../../components/ui/Checkbox";
import Input from "../../../components/ui/Input";
import { PRIORITY_STYLES } from "../../homework/homeworkUtils";

export default function HomeworkSection({
  homework,
  togglingIds,
  newTitle,
  setNewTitle,
  addingHomework,
  addError,
  onSubmit,
  onToggle,
  fade,
}) {
  return (
    <section className="flex min-h-0 flex-1 basis-0 flex-col">
      <h4 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Homework
      </h4>

      <form onSubmit={onSubmit} className="mb-3 flex shrink-0 items-center gap-2">
        <div className="flex-1">
          <Input
            id="quick-add-homework"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task…"
            disabled={addingHomework}
          />
        </div>
        <button
          type="submit"
          disabled={!newTitle.trim() || addingHomework}
          aria-label="Add task"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-muted)]"
        >
          <Plus size={16} />
        </button>
      </form>
      {addError && (
        <p className="mb-2 shrink-0 text-xs text-[var(--color-danger)]">{addError}</p>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={fade.ref}
          onScroll={fade.onScroll}
          className="h-full overflow-y-auto scrollbar-cadence pr-1"
        >
          {homework.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No homework linked yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {homework.map((hw) => {
                const isDone = hw.status === "done";
                const isToggling = togglingIds.has(hw.id);
                const priority = PRIORITY_STYLES[hw.priority] || PRIORITY_STYLES.normal;
                return (
                  <li
                    key={hw.id}
                    className="group rounded-lg border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-text)_4%,transparent)] px-3 py-2 text-sm transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`hw-${hw.id}`}
                        checked={isDone}
                        disabled={isToggling}
                        onChange={() => onToggle(hw)}
                        className="shrink-0"
                      />

                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                        style={{
                          backgroundColor: priority.color,
                          boxShadow: `0 0 6px color-mix(in srgb, ${priority.color} 55%, transparent)`,
                        }}
                        title={`${priority.label || hw.priority || "Normal"} priority`}
                      />

                      <span
                        className={`flex-1 font-medium line-clamp-1 transition-all duration-200 ${
                          isDone
                            ? "text-[var(--color-text-muted)] line-through opacity-40"
                            : "text-[var(--color-text)] opacity-100"
                        }`}
                      >
                        {hw.title}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        {hw.due_date?.slice(0, 10)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            fade.showTop ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            fade.showBottom ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </section>
  );
}
