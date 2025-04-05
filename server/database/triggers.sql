-- Triggers for jugadors (players)
DELIMITER //

CREATE TRIGGER log_jugadors_insert
AFTER INSERT ON jugadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, new_data)
    VALUES (
        'jugador',
        NEW.id,
        'INSERT',
        JSON_OBJECT('nom', NEW.nom, 'cognoms', NEW.cognoms, 'talla_samarreta', NEW.talla_samarreta, 'id_equip', NEW.id_equip)
    );
END //

CREATE TRIGGER log_jugadors_update
BEFORE UPDATE ON jugadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data, new_data)
    VALUES (
        'jugador',
        OLD.id,
        'UPDATE',
        JSON_OBJECT('nom', OLD.nom, 'cognoms', OLD.cognoms, 'talla_samarreta', OLD.talla_samarreta, 'id_equip', OLD.id_equip),
        JSON_OBJECT('nom', NEW.nom, 'cognoms', NEW.cognoms, 'talla_samarreta', NEW.talla_samarreta, 'id_equip', NEW.id_equip)
    );
END //

CREATE TRIGGER log_jugadors_delete
BEFORE DELETE ON jugadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data)
    VALUES (
        'jugador',
        OLD.id,
        'DELETE',
        JSON_OBJECT('nom', OLD.nom, 'cognoms', OLD.cognoms, 'talla_samarreta', OLD.talla_samarreta, 'id_equip', OLD.id_equip)
    );
END //

-- Triggers for entrenadors (coaches)
CREATE TRIGGER log_entrenadors_insert
AFTER INSERT ON entrenadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, new_data)
    VALUES (
        'entrenador',
        NEW.id,
        'INSERT',
        JSON_OBJECT('nom', NEW.nom, 'cognoms', NEW.cognoms, 'talla_samarreta', NEW.talla_samarreta, 'es_principal', NEW.es_principal, 'id_equip', NEW.id_equip)
    );
END //

-- Triggers for entrenadors UPDATE
CREATE TRIGGER log_entrenadors_update
BEFORE UPDATE ON entrenadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data, new_data)
    VALUES (
        'entrenador',
        OLD.id,
        'UPDATE',
        JSON_OBJECT('nom', OLD.nom, 'cognoms', OLD.cognoms, 'talla_samarreta', OLD.talla_samarreta, 'es_principal', OLD.es_principal, 'id_equip', OLD.id_equip),
        JSON_OBJECT('nom', NEW.nom, 'cognoms', NEW.cognoms, 'talla_samarreta', NEW.talla_samarreta, 'es_principal', NEW.es_principal, 'id_equip', NEW.id_equip)
    );
END //

-- Triggers for entrenadors DELETE
CREATE TRIGGER log_entrenadors_delete
BEFORE DELETE ON entrenadors
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data)
    VALUES (
        'entrenador',
        OLD.id,
        'DELETE',
        JSON_OBJECT('nom', OLD.nom, 'cognoms', OLD.cognoms, 'talla_samarreta', OLD.talla_samarreta, 'es_principal', OLD.es_principal, 'id_equip', OLD.id_equip)
    );
END //

-- Triggers for intolerancies
CREATE TRIGGER log_intolerancies_insert
AFTER INSERT ON intolerancies
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, new_data)
    VALUES (
        'intolerancia',
        NEW.id,
        'INSERT',
        JSON_OBJECT('nom', NEW.nom, 'id_equip', NEW.id_equip)
    );
END //

-- Triggers for INTOLERANCIES UPDATE
CREATE TRIGGER log_intolerancies_update
BEFORE UPDATE ON intolerancies
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data, new_data)
    VALUES (
        'intolerancia',
        OLD.id,
        'UPDATE',
        JSON_OBJECT('nom', OLD.nom, 'id_equip', OLD.id_equip),
        JSON_OBJECT('nom', NEW.nom, 'id_equip', NEW.id_equip)
    );
END //


-- Triggers for INTOLERANCIES DELETE
CREATE TRIGGER log_intolerancies_delete
BEFORE DELETE ON intolerancies
FOR EACH ROW
BEGIN
    INSERT INTO changes_log (entity_type, entity_id, action, old_data)
    VALUES (
        'intolerancia',
        OLD.id,
        'DELETE',
        JSON_OBJECT('nom', OLD.nom, 'id_equip', OLD.id_equip)
    );
END //

DELIMITER ;
