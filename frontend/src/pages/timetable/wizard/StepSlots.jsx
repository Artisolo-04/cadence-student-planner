import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Clock3, Plus, Sparkles, Trash2 } from "lucide-react";
import api from "../../../lib/api";
import Button from "../../../components/ui/Button";
import ClearSlotsModal from "./ClearSlotsModal";
import PresetGeneratorModal from "./PresetGeneratorModal";

const inputClass =
  "h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-1 focus-visible:ring-[var(--color-ring)]";

function addMinutes(time, minutes) {
  const [hours, minutesPart] = time.split(":").map(Number);
  const total = hours * 60 + minutesPart + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeValue(value) {
  return (value || "").slice(0, 5);
}

const StepSlots = forwardRef(function StepSlots(
  { workspaceId, initialSlots = [], onNext },
  ref
) {
  const [slots, setSlots] = useState(initialSlots);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  const [presetStart, setPresetStart] = useState("08:30");
  const [presetDuration, setPresetDuration] = useState("60");
  const [presetBreak, setPresetBreak] = useState("10");
  const [presetCount, setPresetCount] = useState("6");

  const scrollRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const orderedSlots = useMemo(
    () => [...slots].sort((a, b) => a.sort_order - b.sort_order),
    [slots]
  );

  function updateScrollFades() {
    const element = scrollRef.current;
    if (!element) return;

    setShowTopFade(element.scrollTop > 4);
    setShowBottomFade(
      element.scrollTop + element.clientHeight < element.scrollHeight - 4
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollFades);
    window.addEventListener("resize", updateScrollFades);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollFades);
    };
  }, [orderedSlots.length]);

  useImperativeHandle(ref, () => ({
    next: (nextStep = 4) => handleNext(nextStep),
  }));

  async function createSlot(payload) {
    const { data } = await api.post(`/timetables/${workspaceId}/slots`, payload);
    return data.slot;
  }

  function updateLocalSlot(slotId, field, value) {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot))
    );
  }

  async function handleNext(nextStep = 4) {
    if (!slots.length) {
      setError("Add at least one slot before continuing.");
      return;
    }

    setError("");
    setAdding(true);

    try {
      const savedSlots = await Promise.all(
        slots.map(async (slot) => {
          const startTime = timeValue(slot.start_time);
          const endTime = timeValue(slot.end_time);

          if (!startTime || !endTime || startTime >= endTime) {
            throw new Error("Each slot needs an end time after its start time.");
          }

          const { data } = await api.patch(
            `/timetables/${workspaceId}/slots/${slot.id}`,
            {
              label: slot.label?.trim() || null,
              startTime,
              endTime,
            }
          );

          return data.slot;
        })
      );

      setSlots(savedSlots);
      onNext(savedSlots, nextStep);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong saving the slots.");
    } finally {
      setAdding(false);
    }
  }

  async function handleGeneratePreset() {
    const duration = Number(presetDuration);
    const breakMinutes = Number(presetBreak) || 0;
    const count = Number(presetCount);

    if (!presetStart || !Number.isFinite(duration) || duration < 1 || !Number.isInteger(count) || count < 1 || count > 12) {
      setError("Choose a start time, a positive duration, and between 1 and 12 slots.");
      return;
    }

    setError("");
    setAdding(true);

    try {
      let cursor = presetStart;
      const created = [];

      for (let index = 0; index < count; index += 1) {
        const startTime = cursor;
        const endTime = addMinutes(startTime, duration);

        created.push(
          await createSlot({
            label: `S${slots.length + index + 1}`,
            startTime,
            endTime,
          })
        );

        cursor = addMinutes(endTime, breakMinutes);
      }

      setSlots((current) => [...current, ...created]);
      setPresetModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong generating slots.");
    } finally {
      setAdding(false);
    }
  }

  async function handleAddCustom() {
    setError("");
    setAdding(true);

    try {
      const lastSlot = orderedSlots.at(-1);
      const startTime = lastSlot ? timeValue(lastSlot.end_time) : presetStart;
      const endTime = addMinutes(startTime, Number(presetDuration));

      const slot = await createSlot({
        label: `S${slots.length + 1}`,
        startTime,
        endTime,
      });

      setSlots((current) => [...current, slot]);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong adding the slot.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(slotId) {
    setError("");

    try {
      await api.delete(`/timetables/${workspaceId}/slots/${slotId}`);
      setSlots((current) => current.filter((slot) => slot.id !== slotId));
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong removing the slot.");
    }
  }

  async function handleClearAll() {
    if (!slots.length) return;

    setError("");
    setClearModalOpen(false);
    setClearing(true);

    try {
      await Promise.all(
        slots.map((slot) => api.delete(`/timetables/${workspaceId}/slots/${slot.id}`))
      );
      setSlots([]);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong clearing the slots.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid h-full grid-rows-[minmax(0,1fr)] items-stretch gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Step 3
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">
              Build your time slots
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Generate a schedule, then fine-tune each slot below.
            </p>
          </div>

          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            Each slot defines a recurring time block across your active days. Use the
            preset generator for an evenly spaced schedule, or add slots one by one
            and adjust the label and times to match your routine.
          </p>

          {error && (
            <p className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          )}
        </section>

        <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Your slots</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                {slots.length === 0 ? "No slots yet" : `${slots.length} ${slots.length === 1 ? "slot" : "slots"} ready`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {slots.length > 0 && (
                <button type="button" onClick={() => setClearModalOpen(true)} disabled={clearing}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-50">
                  <Trash2 size={14} />
                  {clearing ? "Clearing..." : "Clear all"}
                </button>
              )}

              <Button type="button" variant="secondary" className="h-8 shrink-0 rounded-md !transition-colors"
                onClick={() => setPresetModalOpen(true)} disabled={adding || clearing}>
                <Sparkles size={16} />
                Generate slots
              </Button>

              <Button
                type="button"
                variant="primary"
                className="h-8 shrink-0 rounded-md !transition-colors"
                onClick={handleAddCustom}
                disabled={adding || clearing}
              >
                <Plus size={16} />
                Add slot
              </Button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 p-2 px-4">
            <div
              ref={scrollRef}
              onScroll={updateScrollFades}
              className="h-full overflow-y-auto scrollbar-cadence py-3 pr-4"
            >
              {orderedSlots.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {orderedSlots.map((slot, index) => (
                      <tr key={slot.id} className="border-b border-[var(--color-border)] last:border-b-0">
                        <td className="px-5 py-2">
                          <input aria-label={`Label for slot ${index + 1}`} value={slot.label || ""}
                            placeholder={`Slot ${index + 1}`}
                            onChange={(event) => updateLocalSlot(slot.id, "label", event.target.value)}
                            className={inputClass} />
                        </td>
                        <td className="px-5 py-2">
                          <input aria-label={`Start time for slot ${index + 1}`} type="time"
                            value={timeValue(slot.start_time)}
                            onChange={(event) => updateLocalSlot(slot.id, "start_time", event.target.value)}
                            className={inputClass} />
                        </td>
                        <td className="px-5 py-2">
                          <input aria-label={`End time for slot ${index + 1}`} type="time"
                            value={timeValue(slot.end_time)}
                            onChange={(event) => updateLocalSlot(slot.id, "end_time", event.target.value)}
                            className={inputClass} />
                        </td>
                        <td className="px-5 py-2 text-right">
                          <button type="button" onClick={() => handleRemove(slot.id)}
                            aria-label={`Remove slot ${index + 1}`} title="Remove slot"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-5 text-center">
                  <Clock3 size={22} className="mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-sm font-medium text-[var(--color-text)]">Your schedule will appear here</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Generate a preset or add a slot to get started.
                  </p>
                </div>
              )}
            </div>

            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                showTopFade ? "opacity-100" : "opacity-0"
              }`}
            />

            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-25 bg-gradient-to-t from-[var(--color-surface)] to-transparent transition-opacity duration-200 ${
                showBottomFade ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        </aside>
      </div>

      <PresetGeneratorModal
        open={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        generating={adding}
        presetStart={presetStart}
        setPresetStart={setPresetStart}
        presetDuration={presetDuration}
        setPresetDuration={setPresetDuration}
        presetBreak={presetBreak}
        setPresetBreak={setPresetBreak}
        presetCount={presetCount}
        setPresetCount={setPresetCount}
        onGenerate={handleGeneratePreset}
      />

      <ClearSlotsModal
        open={clearModalOpen}
        slotCount={slots.length}
        clearing={clearing}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearAll}
      />
    </div>
  );
});

export default StepSlots;
