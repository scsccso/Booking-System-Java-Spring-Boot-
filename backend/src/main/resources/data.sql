-- ── Seed Users ──────────────────────────────────────────────
-- Using MERGE KEY(id) to avoid both PK and UK conflicts on re-runs
MERGE INTO users (id, username, password, role) KEY (id)
VALUES
    (1, 'user01',  '123456', 'USER'),
    (2, 'user02',  '123456', 'USER'),
    (3, 'admin01', '123456', 'ADMIN');

-- ── Seed Resources ───────────────────────────────────────────
MERGE INTO resource (id, name, type, status) KEY (id)
VALUES
    (1,  'Focus Desk A1',       'DESK', 'ACTIVE'),
    (2,  'Focus Desk A2',       'DESK', 'ACTIVE'),
    (3,  'Focus Desk A3',       'DESK', 'ACTIVE'),
    (4,  'Focus Desk B1',       'DESK', 'ACTIVE'),
    (5,  'Standing Desk B2',    'DESK', 'ACTIVE'),
    (6,  'Meeting Room Alpha',  'ROOM', 'ACTIVE'),
    (7,  'Meeting Room Beta',   'ROOM', 'ACTIVE'),
    (8,  'Conference Suite',    'ROOM', 'ACTIVE');
