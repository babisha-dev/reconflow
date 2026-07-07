-- ═══════════════════════════════════════════════════════
-- Smart Reconciliation & Audit System — MySQL Schema
-- Run in XAMPP phpMyAdmin or: mysql -u root < schema.sql
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS smart_reconciliation
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_reconciliation;

-- ── 1. Users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         BIGINT        AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(100)  NOT NULL UNIQUE,
    email      VARCHAR(255)  NOT NULL UNIQUE,
    password   VARCHAR(255)  NOT NULL,
    role       ENUM('ADMIN','ANALYST','VIEWER') NOT NULL DEFAULT 'VIEWER',
    full_name  VARCHAR(255),
    active     BOOLEAN       DEFAULT TRUE,
    created_at DATETIME      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── 2. Upload Jobs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS upload_jobs (
    id                   BIGINT       AUTO_INCREMENT PRIMARY KEY,
    file_name            VARCHAR(255),
    file_hash            VARCHAR(64),
    uploaded_by          BIGINT,
    uploaded_by_username VARCHAR(100),
    total_records        INT          DEFAULT 0,
    processed_records    INT          DEFAULT 0,
    status               ENUM('PROCESSING','COMPLETED','FAILED') DEFAULT 'PROCESSING',
    error_message        TEXT,
    started_at           DATETIME,
    completed_at         DATETIME,
    created_at           DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_hash  (file_hash),
    INDEX idx_status     (status)
) ENGINE=InnoDB;

-- ── 3. Records (uploaded + system) ───────────────────
CREATE TABLE IF NOT EXISTS records (
    id               BIGINT        AUTO_INCREMENT PRIMARY KEY,
    transaction_id   VARCHAR(255)  NOT NULL,
    amount           DECIMAL(18,2),
    reference_number VARCHAR(255),
    transaction_date DATE,
    description      TEXT,
    currency         VARCHAR(10),
    account_number   VARCHAR(100),
    upload_job_id    BIGINT,
    is_system_record BOOLEAN       DEFAULT FALSE,
    additional_data  TEXT,
    created_at       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id   (transaction_id),
    INDEX idx_reference_number (reference_number),
    INDEX idx_upload_job_id    (upload_job_id),
    INDEX idx_is_system        (is_system_record)
) ENGINE=InnoDB;

-- ── 4. Reconciliation Results ─────────────────────────
CREATE TABLE IF NOT EXISTS reconciliation_results (
    id                    BIGINT      AUTO_INCREMENT PRIMARY KEY,
    transaction_id        VARCHAR(255),
    upload_job_id         BIGINT,
    uploaded_record_id    BIGINT,
    system_record_id      BIGINT,
    match_status          ENUM('MATCHED','PARTIALLY_MATCHED','NOT_MATCHED','DUPLICATE') NOT NULL,
    uploaded_amount       DECIMAL(18,2),
    system_amount         DECIMAL(18,2),
    amount_variance       DECIMAL(18,2),
    mismatched_fields     TEXT,
    manually_resolved_by  VARCHAR(100),
    manual_note           TEXT,
    resolved_at           DATETIME,
    created_at            DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_recon_txn    (transaction_id),
    INDEX idx_recon_job    (upload_job_id),
    INDEX idx_match_status (match_status)
) ENGINE=InnoDB;

-- ── 5. Audit Logs (immutable — never update or delete) ─
CREATE TABLE IF NOT EXISTS audit_logs (
    id                    BIGINT      AUTO_INCREMENT PRIMARY KEY,
    entity_type           VARCHAR(100),
    entity_id             BIGINT,
    action                VARCHAR(100),
    performed_by          VARCHAR(100),
    performed_by_username VARCHAR(100),
    old_value             TEXT,
    new_value             TEXT,
    source                VARCHAR(50),
    ip_address            VARCHAR(50),
    timestamp             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity    (entity_type, entity_id),
    INDEX idx_performer (performed_by),
    INDEX idx_ts        (timestamp),
    INDEX idx_action    (action)
) ENGINE=InnoDB;

-- ── Seed: 10 System Records for reconciliation testing ─
INSERT INTO records (transaction_id, amount, reference_number,
    transaction_date, description, currency, is_system_record)
VALUES
  ('TXN001', 1500.00, 'REF001', '2024-01-15', 'Payment for services',   'USD', TRUE),
  ('TXN002', 2500.00, 'REF002', '2024-01-16', 'Equipment purchase',     'USD', TRUE),
  ('TXN003',  750.50, 'REF003', '2024-01-17', 'Office supplies',        'USD', TRUE),
  ('TXN004', 3200.00, 'REF004', '2024-01-18', 'Consulting fee',         'USD', TRUE),
  ('TXN005',  980.00, 'REF005', '2024-01-19', 'Software license',       'USD', TRUE),
  ('TXN006', 1200.00, 'REF006', '2024-01-20', 'Travel expenses',        'USD', TRUE),
  ('TXN007', 4500.00, 'REF007', '2024-01-21', 'Hardware purchase',      'USD', TRUE),
  ('TXN008',  330.00, 'REF008', '2024-01-22', 'Maintenance fee',        'USD', TRUE),
  ('TXN009', 2100.00, 'REF009', '2024-01-23', 'Marketing campaign',     'USD', TRUE),
  ('TXN010',  650.00, 'REF010', '2024-01-24', 'Training costs',         'USD', TRUE);

SELECT 'Schema created and seeded successfully!' AS result;
