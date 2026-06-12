DROP PROCEDURE IF EXISTS _migrate_000003_dinner_dormitory_down;
DELIMITER //
CREATE PROCEDURE _migrate_000003_dinner_dormitory_down()
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'dormitory_id') > 0 THEN
    ALTER TABLE teams DROP COLUMN dormitory_id;
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'dinner_turn') > 0 THEN
    ALTER TABLE teams DROP COLUMN dinner_turn;
  END IF;
END//
DELIMITER ;
CALL _migrate_000003_dinner_dormitory_down();
DROP PROCEDURE IF EXISTS _migrate_000003_dinner_dormitory_down;
