import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function useAnalyticsData(timetableId, myGroup) {
  const [status, setStatus] = useState("loading"); 
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!timetableId) return;
    let cancelled = false;

    setStatus("loading");
    api
      .get(`/timetables/${timetableId}/analytics`)
      .then(({ data: payload }) => {
        if (cancelled) return;
        setData(payload);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Load analytics error:", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };

  }, [timetableId]);

  return { status, data };
}
