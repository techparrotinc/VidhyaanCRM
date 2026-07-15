import * as SQLite from 'expo-sqlite'
import { api, ApiError } from './api'
import { recordError } from './crash-reporting'
import type { AttendanceStatusValue } from './attendance'

/**
 * Offline attendance queue (mobile-app-plan §4.5): a teacher's submit tries
 * the network first; on failure the register queues in SQLite and syncs
 * later. The server's upsert on (orgId, studentId, date, sessionKey) is
 * already idempotent, so a queued row can be POSTed again on retry with no
 * dedup key needed on this side — same rows in, same result out.
 *
 * Deliberately narrow, per the plan's own decree: offline = attendance only,
 * not a generic sync framework.
 */

export type QueuedRegister = {
  date: string
  sessionId?: string
  entries: Array<{ studentId: string; status: AttendanceStatusValue }>
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('vidhyaan-offline.db').then(async (db) => {
      await db.execAsync(
        `CREATE TABLE IF NOT EXISTS attendance_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payload TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0
        );`
      )
      return db
    })
  }
  return dbPromise
}

export async function enqueueRegister(payload: QueuedRegister): Promise<void> {
  const db = await getDb()
  await db.runAsync('INSERT INTO attendance_queue (payload, createdAt) VALUES (?, ?)', [
    JSON.stringify(payload),
    Date.now()
  ])
}

export async function queuedCount(): Promise<number> {
  const db = await getDb()
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM attendance_queue')
  return row?.count ?? 0
}

const MAX_ATTEMPTS = 5

/**
 * Attempts to POST every queued register in order. A row that fails again
 * (still offline) stays queued for the next call; a row that's failed
 * MAX_ATTEMPTS times is dropped (with a crash-report breadcrumb) rather
 * than retried forever — a stale register from days ago silently
 * overwriting today's re-marked attendance would be worse than losing it.
 */
export async function syncAttendanceQueue(): Promise<{ synced: number; remaining: number }> {
  const db = await getDb()
  const rows = await db.getAllAsync<{ id: number; payload: string; attempts: number }>(
    'SELECT id, payload, attempts FROM attendance_queue ORDER BY id ASC'
  )

  let synced = 0
  for (const row of rows) {
    try {
      const payload: QueuedRegister = JSON.parse(row.payload)
      await api('/api/v1/attendance/register', { method: 'POST', body: JSON.stringify(payload) })
      await db.runAsync('DELETE FROM attendance_queue WHERE id = ?', [row.id])
      synced++
    } catch (err) {
      // A real rejection (bad request, forbidden) will never succeed on
      // retry — drop it immediately instead of burning attempts on
      // something that isn't a connectivity problem.
      const permanent = err instanceof ApiError && err.status < 500
      const attempts = row.attempts + 1
      if (permanent || attempts >= MAX_ATTEMPTS) {
        recordError(err, `attendance-queue-drop:${permanent ? 'rejected' : 'max-attempts'}`)
        await db.runAsync('DELETE FROM attendance_queue WHERE id = ?', [row.id])
      } else {
        await db.runAsync('UPDATE attendance_queue SET attempts = ? WHERE id = ?', [attempts, row.id])
      }
    }
  }

  const remaining = await queuedCount()
  return { synced, remaining }
}
