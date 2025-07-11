CREATE TABLE clubs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL
);

CREATE TABLE equips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    telefon VARCHAR(255) NOT NULL,
    sexe VARCHAR(50) NOT NULL,
    club_id INT NOT NULL,
    observacions TEXT,
    data_incripcio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id)
);

CREATE TABLE intolerancies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    id_equip INT NOT NULL,
    FOREIGN KEY (id_equip) REFERENCES equips(id)
);

CREATE TABLE jugadors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    cognoms VARCHAR(255) NOT NULL,
    talla_samarreta VARCHAR(10) NOT NULL,
    id_equip INT NOT NULL,
    FOREIGN KEY (id_equip) REFERENCES equips(id)
);

CREATE TABLE entrenadors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    cognoms VARCHAR(255) NOT NULL,
    talla_samarreta VARCHAR(10) NOT NULL,
    es_principal BOOLEAN NOT NULL DEFAULT false,
    id_equip INT NOT NULL,
    FOREIGN KEY (id_equip) REFERENCES equips(id)
);

CREATE TABLE registration_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    last_used_at DATETIME NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (team_id) REFERENCES equips(id)
);

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

CREATE TABLE qr_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (team_id) REFERENCES equips(id)
);

CREATE TABLE fitxes_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2083) NOT NULL,
    id_equip INT NOT NULL,
    FOREIGN KEY (id_equip) REFERENCES equips(id)
);

-- Create the centralized changes log table
CREATE TABLE changes_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_data LONGTEXT,
    new_data LONGTEXT
);

CREATE TABLE edit_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    contact_method ENUM('email', 'whatsapp') NOT NULL,
    contact_address VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME DEFAULT NULL,
    FOREIGN KEY (team_id) REFERENCES equips(id)
);
