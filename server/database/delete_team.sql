-- First delete all related records from tables that reference the team
DELETE FROM intolerancies WHERE id_equip = 34;
DELETE FROM jugadors WHERE id_equip = 34;
DELETE FROM entrenadors WHERE id_equip = 34;
DELETE FROM registration_tokens WHERE team_id = 34;
DELETE FROM wa_tokens WHERE team_id = 34;
DELETE FROM qr_tokens WHERE team_id = 34;
DELETE FROM fitxes_documents WHERE id_equip = 34;
DELETE FROM edit_sessions WHERE team_id = 34;

-- Finally delete the team itself
DELETE FROM equips WHERE id = 34;