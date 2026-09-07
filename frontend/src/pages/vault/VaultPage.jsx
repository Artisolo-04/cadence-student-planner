import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import api from "../../lib/api";
import { useVaultData } from "./useVaultData";
import VaultFolderCard from "./VaultFolderCard";
import AddVaultItemForm from "./AddVaultItemForm";
import Button from "../../components/ui/Button";

export default function VaultPage() {
  const { bySubject, byFolder, loading, error, addItem, removeItem } = useVaultData();
  const [formOpen, setFormOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/subjects")
      .then(({ data }) => {
        if (!cancelled) setAllSubjects(data.subjects || []);
      })
      .catch((err) => {
        console.error("Load subjects for vault error:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;
    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(element.scrollTop + element.clientHeight < element.scrollHeight - 4);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [bySubject, byFolder, loading]);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl min-h-0 flex-col gap-5">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Vault Workspace</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Your documents and links, organized by subject or custom folder.
          </p>
        </div>
        <Button type="button" onClick={() => setFormOpen(true)} className="shrink-0">
          <Plus size={16} />
          Add resource
        </Button>
      </header>

      {error && (
        <div className="shrink-0 rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="h-full overflow-y-auto rounded-xl p-3 pr-4 scrollbar-cadence sm:p-5 sm:pr-6"
        >
          {loading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading vault…</p>
          ) : (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  University tracks
                </h2>
                {bySubject.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No subject-linked resources yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {bySubject.map((group) => (
                      <VaultFolderCard
                        key={group.subjectId}
                        title={group.subjectName}
                        itemCount={group.items.length}
                        items={group.items}
                        accent="var(--color-primary)"
                        onDeleteItem={removeItem}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Custom folders
                </h2>
                {byFolder.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No custom folders yet. Add a resource above and choose "Custom folder" to create one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {byFolder.map((group) => (
                      <VaultFolderCard
                        key={group.folderName}
                        title={group.folderName}
                        itemCount={group.items.length}
                        items={group.items}
                        accent="var(--color-accent)"
                        onDeleteItem={removeItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 top-2 z-10 h-12 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showTopFade ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-2 bottom-2 z-10 h-16 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
            showBottomFade ? "opacity-100" : "opacity-0"
          }`}
        />
      </section>

      <AddVaultItemForm
        open={formOpen}
        subjects={allSubjects}
        onSubmit={addItem}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
