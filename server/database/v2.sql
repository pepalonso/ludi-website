-- Alter the existing 'equips' table to add the 'categoria' column.
USE ludi_inscripcions;

ALTER TABLE equips
  ADD COLUMN categoria VARCHAR(255) NOT NULL AFTER email;
  
-- Create the new 'wa_tokens' table.
CREATE TABLE wa_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (team_id) REFERENCES equips(id)
);
