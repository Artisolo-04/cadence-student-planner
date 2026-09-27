import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useVaultData } from "../vault/useVaultData";
import ResourcePreviewSidebar from "../vault/folderExplorer/ResourcePreviewSidebar";
import DueSoonCard from "./DueSoonCard";
import VaultQuickAccessCard from "./VaultQuickAccessCard";
import { flattenVault } from "./vaultAccess";

export default function InterceptVaultStack({ buckets, loading }) {
  const { bySubject, byFolder, loading: vaultLoading } = useVaultData();
  const files = useMemo(() => flattenVault(bySubject, byFolder), [bySubject, byFolder]);
  const [previewItem, setPreviewItem] = useState(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[repeat(2,minmax(0,1fr))] gap-4 lg:grid-cols-2 lg:grid-rows-1">
      <DueSoonCard buckets={buckets} loading={loading} vaultFiles={files} onOpenFile={setPreviewItem} />
      <VaultQuickAccessCard files={files} loading={vaultLoading} onOpen={setPreviewItem} />

      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[70] [&>*]:pointer-events-auto">
          <ResourcePreviewSidebar item={previewItem} onClose={() => setPreviewItem(null)} />
        </div>,
        document.body
      )}
    </div>
  );
}
