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
