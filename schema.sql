CREATE TABLE IF NOT EXISTS submissions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  submitted_at   TEXT    NOT NULL,
  form_name      TEXT    NOT NULL DEFAULT 'contact',
  first_name     TEXT,
  last_name      TEXT,
  email          TEXT,
  phone          TEXT,
  message        TEXT,
  street         TEXT,
  city           TEXT,
  postal_code    TEXT,
  notes          TEXT,
  club_selection TEXT,
  raw_data       TEXT,
  ip_address     TEXT,
  user_agent     TEXT
);
