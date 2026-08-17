import { useState } from "react";
import HomeworkBoard from "./board/HomeworkBoard";
import FilterBar from "./filters/FilterBar";
import FilterDrawer from "./filters/FilterDrawer";
import useHomeworkFilters from "./filters/useHomeworkFilters";
import DeleteHomeworkModal from "./list/DeleteHomeworkModal";
import HomeworkTable from "./list/HomeworkTable";
import ListHeader from "./list/ListHeader";
export default function HomeworkList({
  homework,
  subjects,
  onAddNew,
  onEdit,
  onDelete,
  onToggleDone,
  onStatusChange,
  onReorder,
}) {
  const [view, setView] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters, setFilter, toggleInList, reset, filtered, activeCount } = useHomeworkFilters(homework);
  async function handleDelete() {
    if (!selectedItem) return;
    setError("");
    setDeleting(true);
    try {
      await onDelete(selectedItem.id);
      setSelectedItem(null);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong deleting the homework.");
    } finally {
      setDeleting(false);
    }
  }
  function askDelete(item) {
    setError("");
    setSelectedItem(item);
  }
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-4">
      <ListHeader view={view} onViewChange={setView} onAddNew={onAddNew} />
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        activeCount={activeCount}
        open={filtersOpen}
        onToggle={() => setFiltersOpen((o) => !o)}
      />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
        {view === "list" && (
          <HomeworkTable
            items={filtered}
            onEdit={onEdit}
            onDelete={askDelete}
            onToggleDone={onToggleDone}
            onStatusChange={onStatusChange}
          />
        )}
        {view === "board" && (
          <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <HomeworkBoard
              homework={filtered}
              onEdit={onEdit}
              onDelete={askDelete}
              onStatusChange={onStatusChange}
              onReorder={onReorder}
            />
          </div>
        )}

        <FilterDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          setFilter={setFilter}
          toggleInList={toggleInList}
          reset={reset}
          activeCount={activeCount}
          subjects={subjects}
        />
      </div>
      <DeleteHomeworkModal
        item={selectedItem}
        deleting={deleting}
        error={error}
        onCancel={() => setSelectedItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
