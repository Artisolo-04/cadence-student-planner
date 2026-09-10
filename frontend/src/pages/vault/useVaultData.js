import { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";

const SENTINEL_TITLE = ".vault_sentinel";

function stripSentinelItems(groups) {
  return (groups || []).map((group) => ({
    ...group,
    items: (group.items || []).filter((item) => item.title !== SENTINEL_TITLE),
  }));
}

export function useVaultData() {
  const [bySubject, setBySubject] = useState([]);
  const [byFolder, setByFolder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/vault");
      setBySubject(stripSentinelItems(data.bySubject));
      setByFolder(stripSentinelItems(data.byFolder));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  const addItem = useCallback(
    async ({ subjectId, folderName, resourceType, title, urlPath }) => {
      const { data } = await api.post("/vault/items", {
        subjectId: subjectId || undefined,
        folderName: folderName || undefined,
        resourceType,
        title,
        urlPath,
      });
      await fetchVault();
      return data;
    },
    [fetchVault]
  );

  const removeItem = useCallback(
    async (id) => {
      await api.delete(`/vault/items/${id}`);
      await fetchVault();
    },
    [fetchVault]
  );

  const removeFolder = useCallback(
    async (folderName) => {
      await api.delete(`/vault/folders/${encodeURIComponent(folderName)}`);
      await fetchVault();
    },
    [fetchVault]
  );

  const removeSubjectVault = useCallback(
    async (subjectId) => {
      await api.delete(`/vault/subjects/${subjectId}`);
      await fetchVault();
    },
    [fetchVault]
  );

  const renameFolder = useCallback(
    (oldFolderName, newFolderName, itemIds) => {
      const idSet = new Set(itemIds);

      setByFolder((prev) => {
        const rest = prev.filter(
          (g) => g.folderName !== oldFolderName && g.folderName !== newFolderName
        );
        const oldGroup = prev.find((g) => g.folderName === oldFolderName);
        const targetGroup = prev.find((g) => g.folderName === newFolderName);

        const movedItems = (oldGroup?.items || [])
          .filter((item) => idSet.has(item.id))
          .map((item) => ({ ...item, folder_name: newFolderName }));
        const remainingOldItems = (oldGroup?.items || []).filter((item) => !idSet.has(item.id));

        const mergedById = new Map();
        for (const item of targetGroup?.items || []) mergedById.set(item.id, item);
        for (const item of movedItems) mergedById.set(item.id, item);

        const next = [...rest];
        if (remainingOldItems.length > 0) {
          next.push({ folderName: oldFolderName, items: remainingOldItems });
        }
        next.push({ folderName: newFolderName, items: Array.from(mergedById.values()) });
        return next;
      });

      const persist = async () => {
        try {
          await Promise.all(
            itemIds.map((id) => api.patch(`/vault/items/${id}`, { folderName: newFolderName }))
          );
        } catch (err) {
          await fetchVault();
          throw err;
        }
      };

      return persist();
    },
    [fetchVault]
  );

  return {
    bySubject,
    byFolder,
    loading,
    error,
    refetch: fetchVault,
    addItem,
    removeItem,
    removeFolder,
    removeSubjectVault,
    renameFolder,
  };
}
