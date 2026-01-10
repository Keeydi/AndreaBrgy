-- =====================================================
-- AndreaBrgy Database Schema
-- MySQL/MariaDB Compatible
-- =====================================================

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS andreabrgy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE andreabrgy;

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'OFFICIAL', 'RESIDENT') NOT NULL DEFAULT 'RESIDENT',
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('emergency', 'announcement', 'warning', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    status ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'active',
    created_by INT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_alerts_type (type),
    INDEX idx_alerts_priority (priority),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created_by (created_by),
    INDEX idx_alerts_created_at (created_at),
    INDEX idx_alert_status_created (status, created_at),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: reports
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('emergency', 'crime', 'infrastructure', 'health', 'flood', 'complaint', 'request', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(500) NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'pending',
    official_response TEXT NULL,
    created_by INT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL ON UPDATE CURRENT_TIMESTAMP(6),
    resolved_at DATETIME(6) NULL,
    INDEX idx_reports_type (type),
    INDEX idx_reports_status (status),
    INDEX idx_reports_created_by (created_by),
    INDEX idx_reports_created_at (created_at),
    INDEX idx_report_status_created (status, created_at),
    INDEX idx_report_user_created (created_by, created_at),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: system_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id INT NULL,
    details TEXT NULL,
    timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_system_logs_action (action),
    INDEX idx_system_logs_user_id (user_id),
    INDEX idx_system_logs_timestamp (timestamp),
    INDEX idx_log_timestamp_action (timestamp, action),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Demo Users (Optional - uncomment to insert)
-- =====================================================
-- Note: Passwords are hashed with bcrypt
-- Default passwords:
-- Admin: admin123
-- Official: official123
-- Resident: resident123

/*
INSERT INTO users (email, password_hash, name, role, phone, address) VALUES
('admin@brgykorokan.gov.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Barangay Captain', 'ADMIN', '+63 912 345 6789', 'Barangay Hall'),
('official@brgykorokan.gov.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Barangay Secretary', 'OFFICIAL', '+63 912 345 6790', 'Barangay Hall'),
('pedro@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Pedro Santos', 'RESIDENT', '+63 912 345 6791', 'Zone 3, Barangay Korokan')
ON DUPLICATE KEY UPDATE email=email;
*/

-- =====================================================
-- End of Schema
-- =====================================================


