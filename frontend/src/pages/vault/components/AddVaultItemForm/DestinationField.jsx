import { Folder, Landmark } from "lucide-react";
import Dropdown from "../../../../components/ui/Dropdown";
import LockedDestination from "./LockedDestination";
import FolderCombobox from "./FolderCombobox";

export default function DestinationField({
  effectiveDestination,
  isLocked,
  lockedTarget,
  subjectId,
  setSubjectId,
  subjectOptions,
  folderName,
  setFolderName,
  folderOptions,
}) {
  if (effectiveDestination === "subject") {
    return isLocked ? (
      <LockedDestination icon={Landmark} label="University track" name={lockedTarget.name} />
    ) : (
      <Dropdown
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        options={subjectOptions}
        placeholder="No subjects available"
      />
    );
  }

  return isLocked ? (
    <LockedDestination icon={Folder} label="Custom workspace" name={lockedTarget.name} />
  ) : (
    <FolderCombobox value={folderName} onChange={setFolderName} options={folderOptions} />
  );
}
