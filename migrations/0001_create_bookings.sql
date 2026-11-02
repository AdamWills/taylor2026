-- Book a Visit requests, saved before the notification email is sent so a
-- failed or lost email never loses a request. See src/worker.ts.
-- Rows are deleted 90 days after they arrive (the hourly cron).
CREATE TABLE bookings (
	id TEXT PRIMARY KEY,
	created_at INTEGER NOT NULL, -- ms since epoch
	booking TEXT NOT NULL, -- the validated form, as JSON
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
	attempts INTEGER NOT NULL DEFAULT 0,
	last_error TEXT,
	sent_at INTEGER
);

CREATE INDEX bookings_unsent ON bookings (status, created_at);
CREATE INDEX bookings_created ON bookings (created_at);
