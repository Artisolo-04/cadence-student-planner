import { useEffect, useState } from "react";
import api from "../../lib/api";

export function useDueSoonHomework(limit = 4) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get("/homework");
        if (cancelled) return;
        const upcoming = data.filter((h) => h.status !== "done").slice(0, limit);
        setHomework(upcoming);
      } catch (err) {
        console.error("DueSoon load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { homework, loading };
}
