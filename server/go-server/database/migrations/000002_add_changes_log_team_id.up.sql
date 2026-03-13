-- Add team_id to changes_log for filtering changes by team (idempotent).
-- Safe to run on DBs that already have the column (e.g. from schema.sql).
DROP PROCEDURE IF EXISTS _migrate_000002_add_team_id;
DELIMITER //
CREATE PROCEDURE _migrate_000002_add_team_id()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'changes_log' AND COLUMN_NAME = 'team_id') = 0 THEN
    ALTER TABLE changes_log ADD COLUMN team_id INT NULL AFTER changed_at;
    ALTER TABLE changes_log ADD INDEX idx_team_id (team_id);
  END IF;
END//
DELIMITER ;
CALL _migrate_000002_add_team_id();
DROP PROCEDURE IF EXISTS _migrate_000002_add_team_id;
