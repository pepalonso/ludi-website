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

CREATE TABLE competitions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  start_date DATE         NOT NULL,
  end_date   DATE         NOT NULL
);

CREATE TABLE groups (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT                NOT NULL,
  category       VARCHAR(50)        NOT NULL,
  gender         VARCHAR(50)        NOT NULL,
  FOREIGN KEY (competition_id) REFERENCES competitions(id)
);

CREATE TABLE subgroups (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  group_id         INT                NOT NULL,
  name             VARCHAR(10)        NOT NULL,
  qualifiers_count INT                NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE courts (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(255) NOT NULL
);

CREATE TABLE match_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  court_id INT NOT NULL,
  FOREIGN KEY (court_id) REFERENCES courts(id)
);

CREATE TABLE matches (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  match_slot_id     INT            NOT NULL,
  team_A       INT            NOT NULL,
  team_B       INT            NOT NULL,
  group_id     INT            NOT NULL,
  team_A_score INT DEFAULT NULL,
  team_B_score INT DEFAULT NULL,
  FOREIGN KEY (match_slot_id) REFERENCES match_slots(id),
  FOREIGN KEY (team_A)   REFERENCES equips(id),
  FOREIGN KEY (team_B)   REFERENCES equips(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE regular_matches (
  match_id    INT PRIMARY KEY,
  subgroup_id INT NOT NULL,
  FOREIGN KEY (match_id)    REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id)
);

CREATE TABLE elimination_matches (
  match_id               INT PRIMARY KEY,
  elim_round             VARCHAR(50)     NOT NULL,
  team_A_source_subgroup INT DEFAULT NULL,
  team_A_source_rank     INT DEFAULT NULL,
  team_A_previous_match  INT DEFAULT NULL,
  team_B_source_subgroup INT DEFAULT NULL,
  team_B_source_rank     INT DEFAULT NULL,
  team_B_previous_match  INT DEFAULT NULL,
  FOREIGN KEY (match_id)                REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_A_source_subgroup)  REFERENCES subgroups(id),
  FOREIGN KEY (team_B_source_subgroup)  REFERENCES subgroups(id),
  FOREIGN KEY (team_A_previous_match)   REFERENCES matches(id),
  FOREIGN KEY (team_B_previous_match)   REFERENCES matches(id)
);
