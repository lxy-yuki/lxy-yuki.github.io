CREATE TABLE IF NOT EXISTS players (
    device_hash TEXT PRIMARY KEY,
    qualified_at TEXT NOT NULL,
    qualified_day TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_qualified_at
ON players(qualified_at);

CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_players INTEGER NOT NULL DEFAULT 0,
    first_qualified_at TEXT,
    last_qualified_at TEXT,
    updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO stats (
    id, total_players, first_qualified_at, last_qualified_at, updated_at
) VALUES (1, 0, NULL, NULL, '1970-01-01T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS daily_counts (
    day TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_shares_token_hash
ON shares(token_hash);

CREATE INDEX IF NOT EXISTS idx_shares_created_at
ON shares(created_at DESC);
