USE ludi_inscripcions;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE registration_tokens;
TRUNCATE TABLE wa_tokens;
TRUNCATE TABLE qr_tokens;
TRUNCATE TABLE fitxes_documents;
TRUNCATE TABLE entrenadors;
TRUNCATE TABLE jugadors;
TRUNCATE TABLE intolerancies;
TRUNCATE TABLE equips;
TRUNCATE TABLE clubs;

SET FOREIGN_KEY_CHECKS = 1;
