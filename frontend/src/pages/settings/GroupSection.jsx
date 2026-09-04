import Dropdown from "../../components/ui/Dropdown";
import { useSettingsData } from "./useSettingsData";

const GROUP_OPTIONS = [
  { value: "none", label: "No group (see everything)" },
  { value: "g1", label: "Group 1" },
  { value: "g2", label: "Group 2" },
];

export default function GroupSection() {
  const {
    workspaces,
    loading,
    error,
    selectedId,
    setSelectedId,
    selectedWorkspace,
    updateGroup,
    savingGroup,
    activeId,
  } = useSettingsData();

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">My group</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Loading your workspaces...</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">My group</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          You don't have any timetables yet. Create one first, then come back to set your group.
        </p>
      </div>
    );
  }

  const currentGroup = selectedWorkspace?.my_group ?? "none";
  const isSelectedActive = String(selectedId) === String(activeId);

  // Dropdown only renders plain-text option labels, so the in-list marker
  // is a text suffix rather than a styled badge — the real badge renders
  // below, outside that constraint.
  const workspaceOptions = workspaces.map((w) => ({
    value: w.id,
    label: String(w.id) === String(activeId) ? `${w.name} · Active` : w.name,
  }));

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">My group</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Pick which group's sessions show up for you in each workspace.
      </p>

      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-1.5">
          <Dropdown
            id="settings-workspace"
            label="Workspace"
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            options={workspaceOptions}
          />
          {isSelectedActive && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg py-1 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              Currently active workspace
            </span>
          )}
        </div>

        <Dropdown
          id="settings-group"
          label="Group"
          value={currentGroup}
          onChange={(e) => updateGroup(e.target.value === "none" ? null : e.target.value)}
          options={GROUP_OPTIONS}
        />
        {savingGroup && <p className="text-xs text-[var(--color-text-muted)]">Saving...</p>}
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      </div>
    </div>
  );
}
