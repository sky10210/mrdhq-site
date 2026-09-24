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

-- Apply this migration once to an existing database (skip ALTER statements on fresh schema if fields already exist).
ALTER TABLE employees ADD COLUMN parent_name TEXT;
ALTER TABLE employees ADD COLUMN parent_email TEXT;
ALTER TABLE shifts ADD COLUMN block INTEGER NOT NULL DEFAULT 3;
ALTER TABLE shifts ADD COLUMN duty_a TEXT NOT NULL DEFAULT '';
ALTER TABLE shifts ADD COLUMN duty_b TEXT NOT NULL DEFAULT '';
ALTER TABLE shifts ADD COLUMN duty_c TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS agreements (employee_id INTEGER PRIMARY KEY REFERENCES employees(id),envelope_id TEXT NOT NULL,status TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT,employee_id INTEGER NOT NULL REFERENCES employees(id),topic TEXT NOT NULL,token_hash TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS note_messages (id INTEGER PRIMARY KEY AUTOINCREMENT,note_id INTEGER NOT NULL REFERENCES notes(id),author TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_note_messages ON note_messages(note_id,id);
