import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import ScheduleDetails from "./ScheduleDetails";
import { hoursToLabel } from "./chartTokens";
import useScrollFade from "./useScrollFade";

export default function FacultyBars({ faculty = [], rawEntries = [], slots = [] }) {
  const [selected, setSelected] = useState(null);
  const { scrollRef, showTopFade, showBottomFade, updateScrollFades } =
    useScrollFade(faculty);

  if (!faculty.length) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No teachers assigned yet.
      </p>
    );
  }

  const maxHours = Math.max(
    1,
    ...faculty.map((item) => Number(item.weeklyHours || 0))
  );

  const selectedEntries = selected
    ? rawEntries.filter((entry) => entry.teacher === selected.teacher)
    : [];

  const fadeTop = showTopFade ? "20px" : "0px";
  const fadeBottom = showBottomFade ? "20px" : "0px";
  const fadeMask = `linear-gradient(to bottom, transparent 0, black ${fadeTop}, black calc(100% - ${fadeBottom}), transparent 100%)`;

  return (
    <>
      <section className="flex h-full min-h-0 flex-col">
        <div
          ref={scrollRef}
          onScroll={updateScrollFades}
          className="scrollbar-cadence overflow-visible rounded-md lg:h-full lg:overflow-y-scroll lg:pr-2"
          style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
        >
          <div className="flex flex-col gap-2">
            {faculty.map((teacher, index) => {
              const loadPercent = Math.max(
                4,
                (Number(teacher.weeklyHours || 0) / maxHours) * 100
              );

              return (
                <button
                  key={teacher.teacher}
                  type="button"
                  onClick={() => setSelected(teacher)}
                  title={`Open ${teacher.teacher}'s teaching schedule`}
                  className="group flex w-full flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 px-3 py-2.5 text-left transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-[var(--color-surface-alt)]/80"
                >
                  <div className="flex min-w-0 items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {teacher.teacher}
                    </p>
                    <p className="shrink-0 text-xs font-medium tabular-nums text-[var(--color-success)]">
                      {hoursToLabel(teacher.weeklyHours)}
                    </p>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-success)]/10">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${loadPercent}%`,
                        background:
                          "linear-gradient(90deg, var(--color-success) 0%, var(--color-success-strong) 100%)",
                        transitionDelay: `${Math.min(index * 35, 280)}ms`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {teacher.subjectCount}{" "}
                    {teacher.subjectCount === 1 ? "subject" : "subjects"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.teacher || "Faculty schedule"}
        elevated
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Weekly time" value={hoursToLabel(selected.weeklyHours)} />
              <Metric
                label="Subjects"
                value={`${selected.subjectCount} ${
                  selected.subjectCount === 1 ? "subject" : "subjects"
                }`}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                Teaching schedule
              </p>
              <ScheduleDetails entries={selectedEntries} slots={slots} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)]/40 p-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}
