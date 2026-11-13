import { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";

export default function useAnalyticsData(days) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedDays, setLoadedDays] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: overview } = await api.get("/analytics/overview", { params: { days } });
        if (!cancelled) {
          setData(overview);
          setLoadedDays(days);
        }
      } catch (err) {
        console.error("Analytics load error:", err);
        if (!cancelled) setError(err.response?.data?.error ?? "Couldn't load your analytics right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [days, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { data, loading, error, reload, loadedDays };
}
