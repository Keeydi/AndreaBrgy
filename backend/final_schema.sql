-- =====================================================
-- AndreaBrgy Complete Database Schema
-- MySQL/MariaDB Compatible
-- Version: 1.0.0
-- Last Updated: 2024
-- =====================================================

-- =====================================================
-- STEP 1: Create Database (Uncomment if needed)
-- =====================================================
-- CREATE DATABASE IF NOT EXISTS andreabrgy 
--     CHARACTER SET utf8mb4 
--     COLLATE utf8mb4_unicode_ci;
-- 
-- USE andreabrgy;

-- =====================================================
-- STEP 2: Drop Existing Tables (Optional - for fresh install)
-- =====================================================
-- WARNING: This will delete all data!
-- Uncomment only if you want to start fresh
/*
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;
*/

-- =====================================================
-- STEP 3: Create Tables
-- =====================================================

-- =====================================================
-- Table: users
-- Description: User accounts with authentication and roles
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
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: alerts
-- Description: Public alerts and announcements
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
    
    -- Indexes
    INDEX idx_alerts_type (type),
    INDEX idx_alerts_priority (priority),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_created_by (created_by),
    INDEX idx_alerts_created_at (created_at),
    INDEX idx_alert_status_created (status, created_at),
    
    -- Foreign Keys
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: reports
-- Description: Incident reports from residents
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
    
    -- Indexes
    INDEX idx_reports_type (type),
    INDEX idx_reports_status (status),
    INDEX idx_reports_created_by (created_by),
    INDEX idx_reports_created_at (created_at),
    INDEX idx_report_status_created (status, created_at),
    INDEX idx_report_user_created (created_by, created_at),
    
    -- Foreign Keys
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: system_logs
-- Description: System activity and audit logs
-- =====================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    user_id INT NULL,
    details TEXT NULL,
    timestamp DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    
    -- Indexes
    INDEX idx_system_logs_action (action),
    INDEX idx_system_logs_user_id (user_id),
    INDEX idx_system_logs_timestamp (timestamp),
    INDEX idx_log_timestamp_action (timestamp, action),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- STEP 4: Migration Scripts (For Existing Databases)
-- =====================================================

-- Add official_response column to reports if it doesn't exist
-- This is safe to run multiple times (will error if column exists, but that's fine)
SET @dbname = DATABASE();
SET @tablename = "reports";
SET @columnname = "official_response";
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    "SELECT 'Column already exists.' AS result;",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT NULL AFTER status;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- STEP 5: Verify Schema
-- =====================================================
-- Run these queries to verify the schema was created correctly:

-- SELECT 'Users table' AS table_name, COUNT(*) AS row_count FROM users
-- UNION ALL
-- SELECT 'Alerts table', COUNT(*) FROM alerts
-- UNION ALL
-- SELECT 'Reports table', COUNT(*) FROM reports
-- UNION ALL
-- SELECT 'System logs table', COUNT(*) FROM system_logs;

-- Show table structures
-- DESCRIBE users;
-- DESCRIBE alerts;
-- DESCRIBE reports;
-- DESCRIBE system_logs;

-- =====================================================
-- STEP 6: Demo Data (Optional)
-- =====================================================
-- Uncomment below to insert demo users
-- Note: Passwords are hashed with bcrypt
-- Default passwords (for testing only):
-- Admin: admin123
-- Official: official123
-- Resident: resident123

/*
-- Generate bcrypt hashes for these passwords:
-- admin123 -> $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5
-- official123 -> $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5
-- resident123 -> $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5

INSERT INTO users (email, password_hash, name, role, phone, address) VALUES
('admin@brgykorokan.gov.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Barangay Captain', 'ADMIN', '+63 912 345 6789', 'Barangay Hall'),
('official@brgykorokan.gov.ph', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Barangay Secretary', 'OFFICIAL', '+63 912 345 6790', 'Barangay Hall'),
('pedro@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', 'Pedro Santos', 'RESIDENT', '+63 912 345 6791', 'Zone 3, Barangay Korokan')
ON DUPLICATE KEY UPDATE email=email;
*/

-- =====================================================
-- Schema Information
-- =====================================================
-- Database: andreabrgy
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Engine: InnoDB
-- 
-- Tables:
--   1. users - User accounts and authentication
--   2. alerts - Public alerts and announcements
--   3. reports - Incident reports from residents
--   4. system_logs - System activity logs
--
-- Total Indexes: 20+
-- Foreign Keys: 3
--
-- =====================================================
-- End of Schema
-- =====================================================

