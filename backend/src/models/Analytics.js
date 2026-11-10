const pool = require("../config/db");

function buildWorkspaces(rows, requestedGroup) {
  const workspaces = new Map();

  for (const row of rows) {
    const timetableId = Number(row.timetable_id);
    let workspace = workspaces.get(timetableId);

    if (!workspace) {
      workspace = {
        timetableId,
        name: row.timetable_name,
        myGroup: row.my_group,
        selectedGroup: requestedGroup ?? row.my_group ?? null,
        schedules: new Map(),
      };
      workspaces.set(timetableId, workspace);
    }

    const groupTag = row.group_tag;
    let schedule = workspace.schedules.get(groupTag);
    if (!schedule) {
      schedule = {
        groupTag,
        weeklyMinutes: 0,
        classCount: 0,
        days: new Map(),
        subjects: new Map(),
      };
      workspace.schedules.set(groupTag, schedule);
    }

    if (row.day_of_week == null) continue;

    const dayOfWeek = Number(row.day_of_week);
    const classCount = Number(row.class_count);
    const plannedMinutes = Number(row.planned_minutes);

    schedule.weeklyMinutes += plannedMinutes;
    schedule.classCount += classCount;

    const day = schedule.days.get(dayOfWeek) || {
      dayOfWeek,
      scheduledMinutes: 0,
      classCount: 0,
    };
    day.scheduledMinutes += plannedMinutes;
    day.classCount += classCount;
    schedule.days.set(dayOfWeek, day);

    if (row.subject_id != null) {
      const subjectId = Number(row.subject_id);
      const subject = schedule.subjects.get(subjectId) || {
        subjectId,
        name: row.subject_name,
        color: row.subject_color,
        scheduledMinutes: 0,
        classCount: 0,
      };
      subject.scheduledMinutes += plannedMinutes;
      subject.classCount += classCount;
      schedule.subjects.set(subjectId, subject);
    }
  }

  return [...workspaces.values()].map((workspace) => ({
    timetableId: workspace.timetableId,
    name: workspace.name,
    myGroup: workspace.myGroup,
    selectedGroup: workspace.selectedGroup,
    schedules: [...workspace.schedules.values()].map((schedule) => ({
      groupTag: schedule.groupTag,
      weeklyMinutes: schedule.weeklyMinutes,
      classCount: schedule.classCount,
      activeDays: schedule.days.size,
      byDay: [...schedule.days.values()].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      bySubject: [...schedule.subjects.values()].sort(
        (a, b) => b.scheduledMinutes - a.scheduledMinutes ||
          String(a.name).localeCompare(String(b.name))
      ),
    })),
  }));
}

async function getAnalyticsOverview(userId, { days, timetableId, groupTag }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    if (timetableId !== null) {
      const owned = await client.query(
        "SELECT 1 FROM timetables WHERE id = $1 AND user_id = $2",
        [timetableId, userId]
      );
      if (owned.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
    }

    const workloadResult = await client.query(
      `SELECT t.id AS timetable_id, t.name AS timetable_name, t.my_group,
              groups.group_tag, e.day_of_week, e.subject_id,
              s.name AS subject_name, s.color AS subject_color,
              COUNT(e.id)::int AS class_count,
              COALESCE(
                ROUND(SUM(
                  CASE
                    WHEN slot_start.id IS NOT NULL
                     AND slot_end.id IS NOT NULL
                     AND slot_end.sort_order >= slot_start.sort_order
                    THEN EXTRACT(EPOCH FROM (slot_end.end_time - slot_start.start_time)) / 60
                    ELSE 0
                  END
                ))::int,
                0
              ) AS planned_minutes
       FROM timetables t
       CROSS JOIN (VALUES ('all'::text), ('g1'::text), ('g2'::text)) AS groups(group_tag)
       LEFT JOIN timetable_entries e
         ON e.timetable_id = t.id
        AND (e.group_tag = 'all' OR e.group_tag = groups.group_tag)
        AND EXISTS (
          SELECT 1 FROM subjects owned_s
          WHERE owned_s.id = e.subject_id AND owned_s.user_id = t.user_id
        )
       LEFT JOIN timetable_slots slot_start
         ON slot_start.id = e.slot_id AND slot_start.timetable_id = t.id
       LEFT JOIN timetable_slots slot_end
         ON slot_end.id = e.end_slot_id AND slot_end.timetable_id = t.id
       LEFT JOIN subjects s
         ON s.id = e.subject_id AND s.user_id = t.user_id
       WHERE t.user_id = $1
         AND ($2::integer IS NULL OR t.id = $2)
         AND (
           ($3::text IS NOT NULL AND groups.group_tag = $3::text)
           OR ($3::text IS NULL AND t.my_group IS NOT NULL AND groups.group_tag = t.my_group)
           OR ($3::text IS NULL AND t.my_group IS NULL)
         )
       GROUP BY t.id, t.name, t.my_group, groups.group_tag,
                e.day_of_week, e.subject_id, s.name, s.color
       ORDER BY t.id, groups.group_tag, e.day_of_week, s.name`,
      [userId, timetableId, groupTag]
    );

    const activityResult = await client.query(
      `SELECT to_char(days.day::date, 'YYYY-MM-DD') AS date,
              COUNT(snapshots.id)::int AS snapshot_count
       FROM generate_series(
         CURRENT_DATE - ($2::int - 1),
         CURRENT_DATE,
         INTERVAL '1 day'
       ) AS days(day)
       LEFT JOIN timetable_snapshots snapshots
         ON snapshots.created_at >= days.day::date
        AND snapshots.created_at < days.day::date + INTERVAL '1 day'
        AND EXISTS (
          SELECT 1 FROM timetables t
          WHERE t.id = snapshots.timetable_id
            AND t.user_id = $1
            AND ($3::integer IS NULL OR t.id = $3)
        )
       GROUP BY days.day
       ORDER BY days.day`,
      [userId, days, timetableId]
    );

    const homeworkSummaryResult = await client.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'todo')::int AS todo,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
              COUNT(*) FILTER (WHERE status = 'done')::int AS done,
              COUNT(*) FILTER (
                WHERE status <> 'done' AND due_date < CURRENT_DATE
              )::int AS overdue,
              COUNT(*) FILTER (
                WHERE status <> 'done' AND due_date = CURRENT_DATE
              )::int AS due_today,
              COUNT(*) FILTER (
                WHERE status <> 'done'
                  AND due_date >= CURRENT_DATE
                  AND due_date < CURRENT_DATE + 7
              )::int AS due_next_7_days
       FROM homework
       WHERE user_id = $1`,
      [userId]
    );

    const homeworkPriorityResult = await client.query(
      `SELECT priority, COUNT(*)::int AS count
       FROM homework
       WHERE user_id = $1
       GROUP BY priority
       ORDER BY priority`,
      [userId]
    );

    const homeworkDueResult = await client.query(
      `SELECT to_char(days.day::date, 'YYYY-MM-DD') AS date,
              COUNT(h.id)::int AS total,
              COUNT(h.id) FILTER (WHERE h.status = 'todo')::int AS todo,
              COUNT(h.id) FILTER (WHERE h.status = 'in_progress')::int AS in_progress,
              COUNT(h.id) FILTER (WHERE h.status = 'done')::int AS done
       FROM generate_series(
         CURRENT_DATE,
         CURRENT_DATE + ($2::int - 1),
         INTERVAL '1 day'
       ) AS days(day)
       LEFT JOIN homework h
         ON h.user_id = $1 AND h.due_date = days.day::date
       GROUP BY days.day
       ORDER BY days.day`,
      [userId, days]
    );

    const homeworkCreatedResult = await client.query(
      `SELECT to_char(days.day::date, 'YYYY-MM-DD') AS date,
              COUNT(h.id)::int AS count
       FROM generate_series(
         CURRENT_DATE - ($2::int - 1),
         CURRENT_DATE,
         INTERVAL '1 day'
       ) AS days(day)
       LEFT JOIN homework h
         ON h.user_id = $1
        AND h.created_at >= days.day::date
        AND h.created_at < days.day::date + INTERVAL '1 day'
       GROUP BY days.day
       ORDER BY days.day`,
      [userId, days]
    );

    const vaultSummaryResult = await client.query(
      `SELECT COUNT(*)::int AS total_resources,
              COUNT(*) FILTER (WHERE resource_type = 'link')::int AS link_count,
              COUNT(*) FILTER (WHERE resource_type <> 'link')::int AS file_count,
              COALESCE(SUM(file_size_bytes), 0)::text AS storage_bytes
       FROM subject_resources
       WHERE user_id = $1`,
      [userId]
    );

    const vaultTypeResult = await client.query(
      `SELECT resource_type, COUNT(*)::int AS count,
              COALESCE(SUM(file_size_bytes), 0)::text AS storage_bytes
       FROM subject_resources
       WHERE user_id = $1
       GROUP BY resource_type
       ORDER BY resource_type`,
      [userId]
    );

    const vaultDestinationResult = await client.query(
      `SELECT CASE WHEN r.subject_id IS NULL THEN 'folder' ELSE 'subject' END AS destination_type,
              r.subject_id, s.name AS subject_name, r.folder_name,
              COUNT(*)::int AS count,
              COALESCE(SUM(r.file_size_bytes), 0)::text AS storage_bytes
       FROM subject_resources r
       LEFT JOIN subjects s
         ON s.id = r.subject_id AND s.user_id = r.user_id
       WHERE r.user_id = $1
       GROUP BY r.subject_id, s.name, r.folder_name
       ORDER BY destination_type, subject_name, r.folder_name`,
      [userId]
    );

    await client.query("COMMIT");

    const homework = homeworkSummaryResult.rows[0];
    const totalHomework = Number(homework.total);
    const completedHomework = Number(homework.done);

    return {
      generatedAt: new Date().toISOString(),
      windowDays: days,
      workspaces: buildWorkspaces(workloadResult.rows, groupTag),
      timetableActivity: activityResult.rows.map((row) => ({
        date: row.date,
        snapshotCount: Number(row.snapshot_count),
      })),
      homework: {
        total: totalHomework,
        byStatus: {
          todo: Number(homework.todo),
          inProgress: Number(homework.in_progress),
          done: completedHomework,
        },
        byPriority: homeworkPriorityResult.rows.map((row) => ({
          priority: row.priority,
          count: Number(row.count),
        })),
        completionPercent: totalHomework === 0
          ? 0
          : Math.round((completedHomework / totalHomework) * 1000) / 10,
        overdue: Number(homework.overdue),
        dueToday: Number(homework.due_today),
        dueNext7Days: Number(homework.due_next_7_days),
        dueByDate: homeworkDueResult.rows.map((row) => ({
          date: row.date,
          total: Number(row.total),
          todo: Number(row.todo),
          inProgress: Number(row.in_progress),
          done: Number(row.done),
        })),
        createdByDate: homeworkCreatedResult.rows.map((row) => ({
          date: row.date,
          count: Number(row.count),
        })),
      },
      vault: {
        totalResources: Number(vaultSummaryResult.rows[0].total_resources),
        linkCount: Number(vaultSummaryResult.rows[0].link_count),
        fileCount: Number(vaultSummaryResult.rows[0].file_count),
        storageBytes: vaultSummaryResult.rows[0].storage_bytes,
        byType: vaultTypeResult.rows.map((row) => ({
          resourceType: row.resource_type,
          count: Number(row.count),
          storageBytes: row.storage_bytes,
        })),
        byDestination: vaultDestinationResult.rows.map((row) => ({
          destinationType: row.destination_type,
          subjectId: row.subject_id == null ? null : Number(row.subject_id),
          subjectName: row.subject_name,
          folderName: row.folder_name,
          count: Number(row.count),
          storageBytes: row.storage_bytes,
        })),
      },
      dataCoverage: {
        plannedTimetableTime: true,
        actualStudySessions: false,
        currentHomeworkState: true,
        homeworkStatusHistory: false,
        timetableSnapshotHistory: true,
      },
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("ANALYTICS ROLLBACK ERROR:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { getAnalyticsOverview };
