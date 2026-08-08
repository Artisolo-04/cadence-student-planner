import { useRef, useState } from "react";
import api from "../../../lib/api";
import Button from "../../../components/ui/Button";
import WizardProgress from "./WizardProgress";
import StepName from "./StepName";
import StepDays from "./StepDays";
import StepSlots from "./StepSlots";
import StepPreview from "./StepPreview";

const TOTAL_STEPS = 4;

export default function TimetableWizard({ mode = "create", workspace = null, onComplete, onCancel }) {
  const isEdit = mode === "edit";
  const editTimetable = workspace?.timetable ?? workspace;
  const editDays = workspace?.days ?? editTimetable?.days ?? [];
  const editSlots = workspace?.slots ?? editTimetable?.slots ?? [];

  const [step, setStep] = useState(isEdit ? 4 : 1);
  const [contentVisible, setContentVisible] = useState(true);
  const [workspaceId, setWorkspaceId] = useState(isEdit ? editTimetable?.id ?? null : null);
  const [name, setName] = useState(isEdit ? editTimetable?.name ?? "" : "");
  const [days, setDays] = useState(isEdit ? editDays.map((day) => day.day_of_week) : []);
  const [slots, setSlots] = useState(isEdit ? editSlots : []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const nameStepRef = useRef(null);
  const daysStepRef = useRef(null);
  const slotsStepRef = useRef(null);

  function goToStep(nextStep) {
    setError("");
    setContentVisible(false);
    window.setTimeout(() => {
      setStep(nextStep);
      setContentVisible(true);
    }, 150);
  }

  async function handleNameSubmit(trimmedName, nextStep = 2) {
    setError("");
    setSaving(true);

    try {
      if (isEdit) {
        await api.patch(`/timetables/${workspaceId}`, { name: trimmedName });
        setName(trimmedName);
      } else {
        const { data } = await api.post("/timetables", { name: trimmedName });
        setWorkspaceId(data.timetable.id);
        setName(data.timetable.name);
      }
      goToStep(nextStep);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDaysSubmit(selectedDays, nextStep = 3) {
    setError("");
    setSaving(true);

    try {
      await api.put(`/timetables/${workspaceId}/days`, { days: selectedDays });
      setDays(selectedDays);
      goToStep(nextStep);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSlotsNext(currentSlots, nextStep = 4) {
    setSlots(currentSlots);
    goToStep(nextStep);
  }

  function handleStepChange(nextStep) {
    if (!isEdit || saving || nextStep === step) return;

    if (step === 1) nameStepRef.current?.next(nextStep);
    else if (step === 2) daysStepRef.current?.next(nextStep);
    else if (step === 3) slotsStepRef.current?.next(nextStep);
    else goToStep(nextStep);
  }

  async function handlePreviewFinish() {
    setError("");
    setSaving(true);

    try {
      const { data } = await api.get(`/timetables/${workspaceId}`);
      onComplete(data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleFooterBack() {
    if (step === 1) {
      onCancel();
    } else if (isEdit) {
      handleStepChange(step - 1);
    } else {
      goToStep(step - 1);
    }
  }

  function handleFooterNext() {
    if (saving) return;

    if (step === 1) nameStepRef.current?.next();
    else if (step === 2) daysStepRef.current?.next();
    else if (step === 3) slotsStepRef.current?.next();
    else handlePreviewFinish();
  }

  const nextLabel =
    step === 4
      ? saving
        ? "Saving..."
        : isEdit
          ? "Finish editing"
          : "Generate timetable"
      : saving
        ? "Saving..."
        : "Continue";

  return (
    <section className="mx-auto flex h-full w-full max-w-6xl">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <header className="shrink-0 border-b border-[var(--color-border)] px-5 py-5 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {isEdit ? "Edit timetable" : "New timetable"}
            </p>
            <WizardProgress
              currentStep={step}
              totalSteps={TOTAL_STEPS}
              onStepChange={isEdit ? handleStepChange : undefined}
              disabled={saving}
            />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5 py-7 sm:px-12">
          <div className={`flex h-full w-full items-center justify-center transition-opacity duration-150 ${
            contentVisible ? "opacity-100" : "opacity-0"
          }`}>
            <div className="h-full w-full [&>form]:mx-auto [&>div]:mx-auto">
              {error && (
                <p className="mx-auto mb-4 max-w-md rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-center text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}

              {step === 1 && <StepName ref={nameStepRef} initialValue={name} onNext={handleNameSubmit} />}
              {step === 2 && <StepDays ref={daysStepRef} initialValue={days} workspaceName={name} onNext={handleDaysSubmit} />}
              {step === 3 && (
                <StepSlots
                  ref={slotsStepRef}
                  workspaceId={workspaceId}
                  initialSlots={slots}
                  onNext={handleSlotsNext}
                />
              )}
              {step === 4 && <StepPreview name={name} days={days} slots={slots} />}
            </div>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Button type="button" variant="secondary" onClick={handleFooterBack} disabled={saving}>
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button type="button" onClick={handleFooterNext} disabled={saving}>
              {nextLabel}
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
}
