import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { saveSubjectsShape } from "./subjectsShape";

export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/subjects")
      .then(({ data }) => {
        if (alive) {
          saveSubjectsShape(data.subjects);
          setSubjects(data.subjects);
        }
      })
      .catch((err) => console.error("Load subjects error:", err))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { subjects, loading };
}
