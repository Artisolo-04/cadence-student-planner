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
      `SELECT subject_id, slot_id, end_slot_id, day_of_week, group_tag, room
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
      `SELECT subject_id, slot_id, end_slot_id, day_of_week, group_tag, room
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

    const entries = snapResult.rows[0].entries_json;

    await client.query(
      `DELETE FROM timetable_entries WHERE timetable_id = $1`,
      [timetableId]
    );

    if (entries.length > 0) {
      const values = [];
      const params = [timetableId];
      entries.forEach((e) => {
        const base = params.length;
        values.push(
          `($1, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
        );
        params.push(e.subject_id, e.slot_id, e.end_slot_id, e.day_of_week, e.group_tag, e.room);
      });
      await client.query(
        `INSERT INTO timetable_entries
           (timetable_id, subject_id, slot_id, end_slot_id, day_of_week, group_tag, room)
         VALUES ${values.join(", ")}`,
        params
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
