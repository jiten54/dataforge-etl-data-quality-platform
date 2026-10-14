-- ============================================================================
-- DataForge ETL Platform: Core Schema Definition (MySQL 8.0+)
-- Author: DataForge Engineering Team (Athena Tech Specification)
-- Architecture: Multi-tier Medallion-Style (Raw / Staging / Production Star Schema)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS dataforge_dw
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dataforge_dw;

-- ----------------------------------------------------------------------------
-- 1. Pipeline Run Audit & Metadata Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    pipeline_name VARCHAR(128) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RECOVERED') NOT NULL DEFAULT 'PENDING',
    source_type VARCHAR(32) NOT NULL,
    extract_watermark_start DATETIME NULL,
    extract_watermark_end DATETIME NULL,
    rows_extracted INT NOT NULL DEFAULT 0,
    rows_valid INT NOT NULL DEFAULT 0,
    rows_quarantined INT NOT NULL DEFAULT 0,
    rows_loaded INT NOT NULL DEFAULT 0,
    rows_updated INT NOT NULL DEFAULT 0,
    execution_duration_sec DECIMAL(10, 4) NOT NULL DEFAULT 0.0,
    memory_peak_mb DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    error_message TEXT NULL,
    stack_trace MEDIUMTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pipeline_runs_created_at (created_at DESC),
    INDEX idx_pipeline_runs_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Data Quality Quarantine / Dead-Letter Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quarantined_records (
    quarantine_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    natural_key VARCHAR(128) NULL,
    rejection_code VARCHAR(64) NOT NULL,
    rejection_reason VARCHAR(512) NOT NULL,
    raw_payload JSON NOT NULL,
    quarantined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_quarantine_run (run_id),
    INDEX idx_quarantine_entity (entity_name),
    INDEX idx_quarantine_code (rejection_code),
    CONSTRAINT fk_quarantine_run FOREIGN KEY (run_id) 
        REFERENCES pipeline_runs (run_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. Staging Tables (Transient, Idempotent Load Staging)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stg_customers (
    customer_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    postal_code VARCHAR(20) NULL,
    registration_date DATETIME NOT NULL,
    customer_tier ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') NOT NULL DEFAULT 'BRONZE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    batch_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (customer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stg_products (
    product_id INT NOT NULL,
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_discontinued BOOLEAN NOT NULL DEFAULT FALSE,
    batch_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (product_id),
    UNIQUE KEY uq_stg_product_sku (sku)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stg_orders (
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    order_status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stg_order_items (
    order_item_id INT NOT NULL,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    batch_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (order_item_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Analytical Dimensional Warehouse Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_customers (
    customer_sk BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(205) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    postal_code VARCHAR(20) NULL,
    registration_date DATETIME NOT NULL,
    customer_tier ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') NOT NULL DEFAULT 'BRONZE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_batch_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uq_dim_customer_id (customer_id),
    INDEX idx_dim_customers_tier (customer_tier),
    INDEX idx_dim_customers_state (state)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dim_products (
    product_sk BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL,
    margin_amount DECIMAL(12, 2) GENERATED ALWAYS AS (unit_price - cost_price) STORED,
    margin_percent DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN unit_price > 0 THEN ROUND(((unit_price - cost_price) / unit_price) * 100, 2) ELSE 0.00 END
    ) STORED,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_discontinued BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_batch_id VARCHAR(64) NOT NULL,
    UNIQUE KEY uq_dim_product_id (product_id),
    UNIQUE KEY uq_dim_product_sku (sku),
    INDEX idx_dim_products_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fct_orders (
    order_id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL,
    order_date_key INT GENERATED ALWAYS AS (YEAR(order_date) * 10000 + MONTH(order_date) * 100 + DAY(order_date)) STORED,
    order_status ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    item_count INT NOT NULL DEFAULT 0,
    calculated_subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_batch_id VARCHAR(64) NOT NULL,
    INDEX idx_fct_orders_customer (customer_id),
    INDEX idx_fct_orders_date (order_date),
    INDEX idx_fct_orders_status (order_status),
    CONSTRAINT fk_fct_orders_customer FOREIGN KEY (customer_id) 
        REFERENCES dim_customers (customer_id) ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fct_order_items (
    order_item_id INT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    gross_margin DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_batch_id VARCHAR(64) NOT NULL,
    INDEX idx_fct_order_items_order (order_id),
    INDEX idx_fct_order_items_product (product_id),
    CONSTRAINT fk_fct_order_items_order FOREIGN KEY (order_id) 
        REFERENCES fct_orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_fct_order_items_product FOREIGN KEY (product_id) 
        REFERENCES dim_products (product_id) ON UPDATE CASCADE
) ENGINE=InnoDB;
