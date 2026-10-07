import { useEffect } from "react";

// Closes the subject picker when edit mode ends (Save Changes, cancel...) while a cell is still active.
export default function ClosePickerOnExit({ active, onClose }) {
  useEffect(() => {
    if (active) onClose();
  }, [active, onClose]);
  return null;
}
