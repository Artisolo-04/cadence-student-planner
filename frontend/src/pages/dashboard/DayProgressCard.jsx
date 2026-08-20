import DayTimeline from "./DayTimeline";

export default function DayProgressCard({ sessions = [] }) {
  return (
    <div className="flex min-h-0 flex-1">
      <DayTimeline sessions={sessions} />
    </div>
  );
}
