-- CASHS Student Store D1 migration. No student lunch numbers in plaintext.
CREATE TABLE IF NOT EXISTS employees (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 lunch_hash TEXT NOT NULL UNIQUE,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shifts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 employee_id INTEGER NOT NULL REFERENCES employees(id),
 shift_date TEXT NOT NULL,
 day_type TEXT NOT NULL CHECK(day_type IN ('A','B','Other')),
 start_time TEXT NOT NULL,
 end_time TEXT NOT NULL,
 role TEXT NOT NULL,
 duties TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date,employee_id);
CREATE TABLE IF NOT EXISTS attendance (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 employee_id INTEGER NOT NULL REFERENCES employees(id),
 shift_id INTEGER REFERENCES shifts(id),
 in_at TEXT NOT NULL,
 out_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_open_punch ON attendance(employee_id) WHERE out_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance(in_at);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL
);
