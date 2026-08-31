import api from "../../../../lib/api";

export async function applyEntryBatch(timetableId, operations) {
  const { data } = await api.post(`/timetables/${timetableId}/entries/batch`, {
    operations,
  });
  return data;
}
