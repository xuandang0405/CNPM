-- Create password_reset_requests table for admin approval workflow
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(36) NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);