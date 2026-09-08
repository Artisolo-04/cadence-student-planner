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

  return { bySubject, byFolder, loading, error, refetch: fetchVault, addItem, removeItem };
}
