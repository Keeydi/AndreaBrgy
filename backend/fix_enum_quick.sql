-- Quick SQL script to fix enum case mismatch
-- Run this in your MySQL client (MySQL Workbench, HeidiSQL, or command line)

-- Step 1: Update existing data to uppercase
UPDATE users SET role = 'ADMIN' WHERE role = 'admin';
UPDATE users SET role = 'OFFICIAL' WHERE role = 'official';
UPDATE users SET role = 'RESIDENT' WHERE role = 'resident';

-- Step 2: Modify the enum column to use uppercase values
ALTER TABLE users 
MODIFY COLUMN role ENUM('ADMIN', 'OFFICIAL', 'RESIDENT') 
NOT NULL DEFAULT 'RESIDENT';

-- Step 3: Verify (optional - run this to check)
SELECT DISTINCT role FROM users;
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';

