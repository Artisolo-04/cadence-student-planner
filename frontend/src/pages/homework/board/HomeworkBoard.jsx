import { motion } from "motion/react";
import BoardColumn from "./BoardColumn";
import { COLUMNS } from "./boardConstants";

export default function HomeworkBoard({ homework, onEdit, onStatusChange }) {
  const columns = COLUMNS.map((col) => ({
    ...col,
    items: homework
      .filter((h) => h.status === col.key)
      .slice()
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
  }));

  return (
    <motion.div layoutScroll className="flex h-full min-h-0 gap-3 overflow-x-auto scrollbar-cadence pb-1">
      {columns.map((col) => (
        <BoardColumn key={col.key} column={col} items={col.items} onEdit={onEdit} onStatusChange={onStatusChange} />
      ))}
    </motion.div>
  );
}
