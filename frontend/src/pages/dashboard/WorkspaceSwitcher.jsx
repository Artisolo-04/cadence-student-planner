import Dropdown from "../../components/ui/Dropdown";

export default function WorkspaceSwitcher({ timetables, activeId, onSelect }) {
  if (!timetables || timetables.length <= 1) return null;

  return (
    <Dropdown
      id="dashboard-workspace"
      value={activeId}
      onChange={(e) => onSelect(Number(e.target.value))}
      options={timetables.map((t) => ({ value: t.id, label: t.name }))}
      placeholder="Select workspace..."
      className="min-w-[180px]"
    />
  );
}
