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

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text)] mb-1">My group</h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Pick which group's sessions show up for you in each workspace.
      </p>

      <div className="flex flex-col gap-4 max-w-md">
        <Dropdown
          id="settings-workspace"
          label="Workspace"
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
        />
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
