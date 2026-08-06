import { useState } from "react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import Dropdown from "../components/ui/Dropdown";
import Modal from "../components/ui/Modal";
import ThemeToggle from "../components/ui/ThemeToggle";

export default function UiKitPreview() {
  const [checked, setChecked] = useState(false);
  const [day, setDay] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
        <span className="font-semibold text-[var(--color-primary)]">Cadence</span>
        <ThemeToggle />
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Buttons</h2>
          <div className="flex gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Input</h2>
          <Input id="demo-input" label="Full name" placeholder="e.g. Jane Doe" />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Checkbox</h2>
          <Checkbox
            id="demo-check"
            label="Monday"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Dropdown</h2>
          <Dropdown
            id="demo-dropdown"
            label="Faculty"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            options={[
              { value: "cs", label: "Computer Science" },
              { value: "eng", label: "Engineering" },
              { value: "med", label: "Medicine" },
            ]}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Modal</h2>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example modal"
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
              </>
            }
          >
            <p className="text-sm text-[var(--color-text-muted)]">
              This is the modal base component.
            </p>
          </Modal>
        </section>
      </main>
    </div>
  );
}
