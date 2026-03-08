-- Tournament Management System Database Schema
-- Generic schema for tournament applications

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS tournament;
USE tournament;

-- Clubs table
CREATE TABLE clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    category ENUM('Pre-mini', 'Mini', 'Pre-infantil', 'Infantil', 'Cadet', 'Júnior') NOT NULL,
    phone VARCHAR(255) NOT NULL,
    gender ENUM('Masculí', 'Femení') NOT NULL,
    club_id INT NOT NULL,
    observations TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending_payment', 'canceled', 'active') DEFAULT 'pending_payment',
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Players table
CREATE TABLE players (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    shirt_size ENUM('8', '10', '12', '14', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL') NOT NULL,
    team_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team_id (team_id)
);

-- Coaches table
CREATE TABLE coaches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    is_head_coach BOOLEAN NOT NULL DEFAULT FALSE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    shirt_size ENUM('8', '10', '12', '14', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL') NOT NULL,
    phone VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    team_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team_id (team_id)
);

-- Allergies table
CREATE TABLE allergies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_id INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    INDEX idx_player_id (player_id)
);

-- Documents table
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    INDEX idx_team_id (team_id),
    INDEX idx_document_type (document_type),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Registration tokens for team access
CREATE TABLE registration_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- QR code access tokens
CREATE TABLE qr_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    access_level ENUM('view', 'edit', 'admin') DEFAULT 'view',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_qr_code (qr_code),
    INDEX idx_expires_at (expires_at)
);

-- Edit sessions for team modifications (2FA: pin_hash + contact_method; session_token after validation)
CREATE TABLE edit_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) NOT NULL,
    contact_method ENUM('email', 'whatsapp', 'admin') NOT NULL DEFAULT 'email',
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_team_id (team_id)
);

-- Admin sessions
CREATE TABLE admin_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- Changes log for audit trail
CREATE TABLE changes_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_action (action),
    INDEX idx_changed_at (changed_at)
);