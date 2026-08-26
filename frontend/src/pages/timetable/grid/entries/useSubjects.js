import { useEffect, useState } from "react";
import api from "../../../../lib/api";

export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  useEffect(() => {
    api
      .get("/subjects")
      .then(({ data }) => setSubjects(data.subjects))
      .catch((err) => console.error("Load subjects error:", err));
  }, []);
  return subjects;
}
