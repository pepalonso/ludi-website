USE ludi_inscripcions;

-- 1. Create new clubs table with proper design
CREATE TABLE new_clubs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE
);

-- 2. Populate new clubs table with unique club names from equips
INSERT INTO new_clubs (nom)
SELECT DISTINCT club FROM equips;

-- 3. Alter equips table to replace club name with club_id
ALTER TABLE equips
DROP COLUMN club;

ALTER TABLE equips
ADD COLUMN club_id INT;

-- 4. Set the correct club_id for each team in equips
UPDATE equips e
JOIN new_clubs c ON e.club = c.nom
SET e.club_id = c.id;

-- 5. Add foreign key constraint
ALTER TABLE equips
ADD CONSTRAINT fk_club
FOREIGN KEY (club_id) REFERENCES new_clubs(id);

-- 6. Drop old clubs table
DROP TABLE clubs;

-- 7. Rename new_clubs to clubs
RENAME TABLE new_clubs TO clubs;
