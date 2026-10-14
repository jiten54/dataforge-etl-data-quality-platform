-- ============================================================================
-- DataForge ETL Platform: Analytical Reporting Queries
-- Author: DataForge Engineering Team (Athena Tech Specification)
-- Purpose: Production analytical and business intelligence queries
-- ============================================================================

USE dataforge_dw;

-- ----------------------------------------------------------------------------
-- Report 1: Executive Revenue & Order Health Summary
-- ----------------------------------------------------------------------------
-- Calculates Monthly Gross Revenue, Net Revenue, Delivered Count, Cancellation Rate, and AOV
SELECT 
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'DELIVERED' THEN o.order_id END) AS delivered_orders,
    COUNT(DISTINCT CASE WHEN o.order_status = 'CANCELLED' THEN o.order_id END) AS cancelled_orders,
    ROUND(COUNT(DISTINCT CASE WHEN o.order_status = 'CANCELLED' THEN o.order_id END) * 100.0 / COUNT(DISTINCT o.order_id), 2) AS cancellation_rate_pct,
    ROUND(SUM(o.total_amount), 2) AS gross_revenue,
    ROUND(SUM(CASE WHEN o.order_status NOT IN ('CANCELLED', 'RETURNED') THEN o.total_amount ELSE 0 END), 2) AS net_revenue,
    ROUND(AVG(CASE WHEN o.order_status NOT IN ('CANCELLED', 'RETURNED') THEN o.total_amount ELSE NULL END), 2) AS average_order_value
FROM fct_orders o
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY order_month DESC;

-- ----------------------------------------------------------------------------
-- Report 2: Customer Lifetime Value (LTV) & Tier Distribution
-- ----------------------------------------------------------------------------
-- Surfaces Top Customers by Spend, Frequency, and Recency
SELECT 
    c.customer_id,
    c.full_name,
    c.email,
    c.customer_tier,
    c.city,
    c.state,
    COUNT(o.order_id) AS total_orders_placed,
    COALESCE(ROUND(SUM(o.total_amount), 2), 0.00) AS lifetime_spent,
    COALESCE(ROUND(AVG(o.total_amount), 2), 0.00) AS avg_basket_size,
    MAX(o.order_date) AS most_recent_order_date
FROM dim_customers c
LEFT JOIN fct_orders o 
    ON c.customer_id = o.customer_id 
    AND o.order_status NOT IN ('CANCELLED')
GROUP BY 
    c.customer_id, c.full_name, c.email, c.customer_tier, c.city, c.state
ORDER BY lifetime_spent DESC
LIMIT 50;

-- ----------------------------------------------------------------------------
-- Report 3: Product Category Profitability & Margin Velocity
-- ----------------------------------------------------------------------------
-- Joins Order Items with Product Catalog to evaluate Margins and Units Sold
SELECT 
    p.category,
    COUNT(DISTINCT p.product_id) AS active_products_in_catalog,
    SUM(oi.quantity) AS total_units_sold,
    ROUND(SUM(oi.line_total), 2) AS gross_sales_amount,
    ROUND(SUM(oi.quantity * p.cost_price), 2) AS total_cogs,
    ROUND(SUM(oi.line_total - (oi.quantity * p.cost_price)), 2) AS gross_profit,
    ROUND(
        (SUM(oi.line_total - (oi.quantity * p.cost_price)) / NULLIF(SUM(oi.line_total), 0)) * 100, 
        2
    ) AS profit_margin_pct
FROM fct_order_items oi
JOIN dim_products p ON oi.product_id = p.product_id
JOIN fct_orders o ON oi.order_id = o.order_id
WHERE o.order_status NOT IN ('CANCELLED')
GROUP BY p.category
ORDER BY gross_profit DESC;

-- ----------------------------------------------------------------------------
-- Report 4: Data Quality & Quarantine Defect Breakdown
-- ----------------------------------------------------------------------------
-- Aggregates failure reasons to provide actionable insights for source data engineers
SELECT 
    q.entity_name,
    q.rejection_code,
    COUNT(*) AS total_quarantined_records,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM quarantined_records), 2) AS defect_share_pct,
    MIN(q.quarantined_at) AS first_observed_at,
    MAX(q.quarantined_at) AS last_observed_at
FROM quarantined_records q
GROUP BY q.entity_name, q.rejection_code
ORDER BY total_quarantined_records DESC;

-- ----------------------------------------------------------------------------
-- Report 5: Pipeline Run SLA & Execution Health Audit
-- ----------------------------------------------------------------------------
-- Tracks duration, throughput (rows/sec), and status trends for SLA compliance
SELECT 
    run_id,
    batch_id,
    status,
    source_type,
    rows_extracted,
    rows_valid,
    rows_quarantined,
    rows_loaded,
    rows_updated,
    execution_duration_sec,
    ROUND(rows_extracted / NULLIF(execution_duration_sec, 0), 0) AS extraction_throughput_rps,
    memory_peak_mb,
    created_at
FROM pipeline_runs
ORDER BY created_at DESC
LIMIT 20;
