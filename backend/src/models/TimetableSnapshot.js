const pool = require("../config/db");

async function ensureBaselineSnapshot(timetableId) {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      `SELECT 1 FROM timetable_snapshots WHERE timetable_id = $1 LIMIT 1`,
      [timetableId]
    );
    if (existing.rows.length > 0) return;

    const entries = await client.query(
      `SELECT id, subject_id, slot_id, end_slot_id, day_of_week, group_tag, room
       FROM timetable_entries WHERE timetable_id = $1`,
      [timetableId]
    );

    await client.query(
      `INSERT INTO timetable_snapshots (timetable_id, version, entries_json)
       VALUES ($1, 0, $2::jsonb)
       ON CONFLICT (timetable_id, version) DO NOTHING`,
      [timetableId, JSON.stringify(entries.rows)]
    );
  } finally {
    client.release();
  }
}

async function recordSnapshot(timetableId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ttResult = await client.query(
      `SELECT current_version FROM timetables WHERE id = $1 FOR UPDATE`,
      [timetableId]
    );
    if (ttResult.rows.length === 0) {
      throw new Error("Timetable not found");
    }
    const currentVersion = ttResult.rows[0].current_version;
    const newVersion = currentVersion + 1;

    await client.query(
      `DELETE FROM timetable_snapshots WHERE timetable_id = $1 AND version > $2`,
      [timetableId, currentVersion]
    );

    const entries = await client.query(
      `SELECT id, subject_id, slot_id, end_slot_id, day_of_week, group_tag, room
       FROM timetable_entries WHERE timetable_id = $1`,
      [timetableId]
    );

    await client.query(
      `INSERT INTO timetable_snapshots (timetable_id, version, entries_json)
       VALUES ($1, $2, $3::jsonb)`,
      [timetableId, newVersion, JSON.stringify(entries.rows)]
    );

    await client.query(
      `UPDATE timetables SET current_version = $2 WHERE id = $1`,
      [timetableId, newVersion]
    );

    await client.query("COMMIT");
    return newVersion;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function restoreVersion(timetableId, targetVersion) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ttResult = await client.query(
      `SELECT current_version FROM timetables WHERE id = $1 FOR UPDATE`,
      [timetableId]
    );
    if (ttResult.rows.length === 0) {
      throw new Error("Timetable not found");
    }

    const snapResult = await client.query(
      `SELECT entries_json FROM timetable_snapshots
       WHERE timetable_id = $1 AND version = $2`,
      [timetableId, targetVersion]
    );
    if (snapResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return null;
    }
    const targetEntries = snapResult.rows[0].entries_json;

    const currentResult = await client.query(
      `SELECT id, subject_id, slot_id, end_slot_id, day_of_week, group_tag, room
       FROM timetable_entries WHERE timetable_id = $1 FOR UPDATE`,
      [timetableId]
    );

    const currentById = new Map(currentResult.rows.map((r) => [r.id, r]));
    const targetById = new Map(targetEntries.map((e) => [e.id, e]));

    await client.query("SET CONSTRAINTS timetable_entries_unique_span DEFERRED");

    const toDelete = [...currentById.keys()].filter((id) => !targetById.has(id));
    if (toDelete.length > 0) {
      await client.query(
        `DELETE FROM timetable_entries WHERE timetable_id = $1 AND id = ANY($2::int[])`,
        [timetableId, toDelete]
      );
    }

    for (const [id, target] of targetById) {
      const curr = currentById.get(id);
      if (!curr) continue;
      const changed =
        curr.subject_id !== target.subject_id ||
        curr.slot_id !== target.slot_id ||
        curr.end_slot_id !== target.end_slot_id ||
        curr.day_of_week !== target.day_of_week ||
        curr.group_tag !== target.group_tag ||
        curr.room !== target.room;
      if (changed) {
        await client.query(
          `UPDATE timetable_entries
           SET subject_id = $3, slot_id = $4, end_slot_id = $5,
               day_of_week = $6, group_tag = $7, room = $8, updated_at = NOW()
           WHERE timetable_id = $1 AND id = $2`,
          [
            timetableId, id, target.subject_id, target.slot_id,
            target.end_slot_id, target.day_of_week, target.group_tag, target.room,
          ]
        );
      }
    }

    const toInsert = [...targetById.values()].filter((t) => !currentById.has(t.id));
    if (toInsert.length > 0) {
      const values = [];
      const params = [timetableId];
      toInsert.forEach((e) => {
        const base = params.length;
        values.push(
          `($1, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
        );
        params.push(e.id, e.subject_id, e.slot_id, e.end_slot_id, e.day_of_week, e.group_tag, e.room);
      });
      await client.query(
        `INSERT INTO timetable_entries
           (timetable_id, id, subject_id, slot_id, end_slot_id, day_of_week, group_tag, room)
         VALUES ${values.join(", ")}`,
        params
      );

      await client.query(
        `SELECT setval(
           pg_get_serial_sequence('timetable_entries', 'id'),
           GREATEST((SELECT COALESCE(MAX(id), 1) FROM timetable_entries), 1)
         )`
      );
    }

    await client.query(
      `UPDATE timetables SET current_version = $2 WHERE id = $1`,
      [timetableId, targetVersion]
    );

    await client.query("COMMIT");
    return targetVersion;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getMaxVersion(timetableId) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(version), 0) AS max_version
     FROM timetable_snapshots WHERE timetable_id = $1`,
    [timetableId]
  );
  return result.rows[0].max_version;
}

module.exports = {
  ensureBaselineSnapshot,
  recordSnapshot,
  restoreVersion,
  getMaxVersion,
};
