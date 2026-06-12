-- Add optional dinner turn and dormitory id for teams (idempotent).
DROP PROCEDURE IF EXISTS _migrate_000003_dinner_dormitory;
DELIMITER //
CREATE PROCEDURE _migrate_000003_dinner_dormitory()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'dinner_turn') = 0 THEN
    ALTER TABLE teams ADD COLUMN dinner_turn INT NULL AFTER observations;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'dormitory_id') = 0 THEN
    ALTER TABLE teams ADD COLUMN dormitory_id VARCHAR(255) NULL AFTER dinner_turn;
  END IF;
END//
DELIMITER ;
CALL _migrate_000003_dinner_dormitory();
DROP PROCEDURE IF EXISTS _migrate_000003_dinner_dormitory;
