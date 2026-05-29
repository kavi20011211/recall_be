-- Recall Backend — Full Database Schema
-- Run: mysql -u root -p recall_db < schema.sql

CREATE TABLE IF NOT EXISTS merchants (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id   VARCHAR(255)  UNIQUE NOT NULL,
    owner_phone   VARCHAR(20)   NOT NULL,
    business_name VARCHAR(255)  NOT NULL,
    business_phone VARCHAR(20),
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id       VARCHAR(255) NOT NULL,
    phone_number      VARCHAR(20)  NOT NULL,
    first_name        VARCHAR(100),
    opt_out           BOOLEAN      DEFAULT FALSE,
    consent_timestamp DATETIME     NOT NULL,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_merchant_customer (merchant_id, phone_number),
    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id)
);

CREATE TABLE IF NOT EXISTS visits (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    customer_id        INT         NOT NULL,
    service_type       VARCHAR(50) NOT NULL,
    reminder_date      DATE        NOT NULL,
    sms_sent           BOOLEAN     DEFAULT FALSE,
    sms_sent_at        DATETIME,
    sms_failure_reason TEXT,
    created_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE OR REPLACE VIEW weekly_digest_data AS
SELECT
    m.merchant_id,
    m.business_name,
    m.owner_phone,
    COUNT(DISTINCT c.id) AS total_customers,
    COALESCE(SUM(
        CASE WHEN v.sms_sent = TRUE
          AND v.sms_sent_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        THEN 1 ELSE 0 END
    ), 0) AS reminders_sent_last_7_days,
    COUNT(DISTINCT CASE
        WHEN v.sms_sent = TRUE
          AND v.sms_sent_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND c.opt_out = FALSE
        THEN c.id END
    ) AS customers_who_returned,
    COUNT(DISTINCT CASE
        WHEN v.reminder_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          AND v.sms_sent = FALSE
        THEN c.id END
    ) AS customers_with_reminders_due_next_7_days
FROM merchants m
LEFT JOIN customers c ON m.merchant_id = c.merchant_id
LEFT JOIN visits v ON c.id = v.customer_id
GROUP BY m.merchant_id, m.business_name, m.owner_phone;
