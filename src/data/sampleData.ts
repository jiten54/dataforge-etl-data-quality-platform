import { PipelineRun, QuarantinedRecord, BenchmarkResult, PytestCase, SqlReportQuery } from '../types/dataforge';

export const INITIAL_PIPELINE_RUNS: PipelineRun[] = [
  {
    run_id: "run_9f2a41bc01",
    batch_id: "batch_20261013_180000",
    status: "COMPLETED",
    source_type: "CSV Feeds",
    rows_extracted: 45,
    rows_valid: 36,
    rows_quarantined: 9,
    rows_loaded: 36,
    rows_updated: 2,
    execution_duration_sec: 1.1842,
    memory_peak_mb: 46.8,
    created_at: "2026-10-13 18:00:00",
    reconciliation: {
      customers: { extracted: 14, valid: 11, quarantined: 3, loaded: 10, is_balanced: true, discrepancy: 0 },
      products: { extracted: 11, valid: 8, quarantined: 3, loaded: 8, is_balanced: true, discrepancy: 0 },
      orders: { extracted: 14, valid: 10, quarantined: 4, loaded: 10, is_balanced: true, discrepancy: 0 },
      order_items: { extracted: 16, valid: 13, quarantined: 3, loaded: 13, is_balanced: true, discrepancy: 0 }
    }
  },
  {
    run_id: "run_8b11c9de44",
    batch_id: "batch_20261013_120000",
    status: "COMPLETED",
    source_type: "Incremental Delta",
    rows_extracted: 120,
    rows_valid: 115,
    rows_quarantined: 5,
    rows_loaded: 115,
    rows_updated: 14,
    execution_duration_sec: 2.0410,
    memory_peak_mb: 52.4,
    created_at: "2026-10-13 12:00:00",
  },
  {
    run_id: "run_7a03df1290",
    batch_id: "batch_20261012_235959",
    status: "RECOVERED",
    source_type: "Fault Injection Simulation",
    rows_extracted: 50,
    rows_valid: 0,
    rows_quarantined: 0,
    rows_loaded: 0,
    rows_updated: 0,
    execution_duration_sec: 0.4201,
    memory_peak_mb: 39.2,
    created_at: "2026-10-12 23:59:59",
    error_message: "Simulated Database Lock Timeout: Staging purged safely via RecoveryManager without target corruption.",
  }
];

export const INITIAL_QUARANTINE_RECORDS: QuarantinedRecord[] = [
  {
    quarantine_id: 1,
    run_id: "run_9f2a41bc01",
    entity_name: "customers",
    natural_key: "ROW_11",
    rejection_code: "NULL_PK",
    rejection_reason: "Customer ID is required and cannot be null",
    raw_payload: { customer_id: null, first_name: "Ghost", last_name: "User", email: "ghost.user@domain.com" },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 2,
    run_id: "run_9f2a41bc01",
    entity_name: "customers",
    natural_key: "111",
    rejection_code: "INVALID_EMAIL",
    rejection_reason: "Customer email 'corrupt_email_without_at_symbol' does not conform to RFC 5322 regex",
    raw_payload: { customer_id: 111, first_name: "Corrupt", email: "corrupt_email_without_at_symbol", city: "Miami" },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 3,
    run_id: "run_9f2a41bc01",
    entity_name: "customers",
    natural_key: "112",
    rejection_code: "INVALID_EMAIL",
    rejection_reason: "Customer email 'bad.user@nodomain' does not conform to RFC 5322 regex",
    raw_payload: { customer_id: 112, first_name: "Bad", email: "bad.user@nodomain", city: "Phoenix" },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 4,
    run_id: "run_9f2a41bc01",
    entity_name: "products",
    natural_key: "209",
    rejection_code: "NEGATIVE_PRICE",
    rejection_reason: "Unit price -45.00 must be strictly greater than zero",
    raw_payload: { product_id: 209, sku: "BAD-001", product_name: "Negative Price Defect Widget", unit_price: -45.00 },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 5,
    run_id: "run_9f2a41bc01",
    entity_name: "products",
    natural_key: "ROW_9",
    rejection_code: "NULL_PK",
    rejection_reason: "Product ID cannot be null",
    raw_payload: { product_id: null, sku: "MISS-SKU", product_name: "Missing SKU Product", unit_price: 99.99 },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 6,
    run_id: "run_9f2a41bc01",
    entity_name: "products",
    natural_key: "210",
    rejection_code: "MISSING_SKU",
    rejection_reason: "Product SKU is required and cannot be empty string",
    raw_payload: { product_id: 210, sku: "", product_name: "Empty SKU Null Value", unit_price: 79.99 },
    quarantined_at: "2026-10-13 18:00:01",
    resolved: false
  },
  {
    quarantine_id: 7,
    run_id: "run_9f2a41bc01",
    entity_name: "orders",
    natural_key: "1011",
    rejection_code: "INVALID_FK_CUSTOMER",
    rejection_reason: "Referenced customer_id 999 does not exist in valid customer dimension",
    raw_payload: { order_id: 1011, customer_id: 999, total_amount: 250.00, order_status: "DELIVERED" },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  },
  {
    quarantine_id: 8,
    run_id: "run_9f2a41bc01",
    entity_name: "orders",
    natural_key: "1012",
    rejection_code: "INVALID_STATUS",
    rejection_reason: "Order status 'UNKNOWN_STATUS' is not in allowed domain enum",
    raw_payload: { order_id: 1012, customer_id: 101, total_amount: 175.00, order_status: "UNKNOWN_STATUS" },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  },
  {
    quarantine_id: 9,
    run_id: "run_9f2a41bc01",
    entity_name: "orders",
    natural_key: "1013",
    rejection_code: "INVALID_DATE",
    rejection_reason: "Order date '2035-12-31' is out of allowable timeline bounds (future timestamp)",
    raw_payload: { order_id: 1013, customer_id: 102, total_amount: 250.00, order_date: "2035-12-31 23:59:59" },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  },
  {
    quarantine_id: 10,
    run_id: "run_9f2a41bc01",
    entity_name: "order_items",
    natural_key: "5014",
    rejection_code: "INVALID_FK_ORDER",
    rejection_reason: "Order item references non-existent or quarantined order_id 9999",
    raw_payload: { order_item_id: 5014, order_id: 9999, product_id: 201, quantity: 1, unit_price: 499.99 },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  },
  {
    quarantine_id: 11,
    run_id: "run_9f2a41bc01",
    entity_name: "order_items",
    natural_key: "5015",
    rejection_code: "INVALID_FK_PRODUCT",
    rejection_reason: "Order item references non-existent or quarantined product_id 8888",
    raw_payload: { order_item_id: 5015, order_id: 1001, product_id: 8888, quantity: 1, unit_price: 299.99 },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  },
  {
    quarantine_id: 12,
    run_id: "run_9f2a41bc01",
    entity_name: "order_items",
    natural_key: "5016",
    rejection_code: "INVALID_QUANTITY",
    rejection_reason: "Item quantity -5 must be a positive integer greater than zero",
    raw_payload: { order_item_id: 5016, order_id: 1002, product_id: 202, quantity: -5, unit_price: 129.50 },
    quarantined_at: "2026-10-13 18:00:02",
    resolved: false
  }
];

export const BENCHMARK_SUITE: BenchmarkResult[] = [
  {
    operation: "Data Cleaning & Whitespace Stripping",
    baselineTimeMs: 2890,
    optimizedTimeMs: 69,
    speedupMultiplier: 41.8,
    baselineMemoryMb: 142.0,
    optimizedMemoryMb: 45.2,
    rowsCount: 50000,
    throughputRowsSec: 724637
  },
  {
    operation: "Regex Email & Date Format Validation",
    baselineTimeMs: 1420,
    optimizedTimeMs: 169,
    speedupMultiplier: 8.4,
    baselineMemoryMb: 88.5,
    optimizedMemoryMb: 48.0,
    rowsCount: 50000,
    throughputRowsSec: 295857
  },
  {
    operation: "Database Ingestion & Idempotent Upsert",
    baselineTimeMs: 48300,
    optimizedTimeMs: 2010,
    speedupMultiplier: 24.1,
    baselineMemoryMb: 110.0,
    optimizedMemoryMb: 52.4,
    rowsCount: 50000,
    throughputRowsSec: 24875
  },
  {
    operation: "Customer Tier Recalculation (NumPy Vectorized)",
    baselineTimeMs: 820,
    optimizedTimeMs: 24,
    speedupMultiplier: 34.2,
    baselineMemoryMb: 64.0,
    optimizedMemoryMb: 38.5,
    rowsCount: 50000,
    throughputRowsSec: 2083333
  }
];

export const PYTEST_CASES: PytestCase[] = [
  {
    id: "test_1",
    name: "test_csv_extractor_reads_full_dataset",
    suite: "unit",
    file: "tests/unit/test_extraction.py",
    duration_ms: 18,
    status: "passed",
    assertCount: 3,
    details: "Verifies pandas reads exact row counts, types, and column schema headers from flat CSV."
  },
  {
    id: "test_2",
    name: "test_csv_extractor_chunking",
    suite: "unit",
    file: "tests/unit/test_extraction.py",
    duration_ms: 22,
    status: "passed",
    assertCount: 3,
    details: "Verifies chunked generator yields bounded row batches without unbounded RAM expansion."
  },
  {
    id: "test_3",
    name: "test_watermark_persistence",
    suite: "unit",
    file: "tests/unit/test_extraction.py",
    duration_ms: 15,
    status: "passed",
    assertCount: 2,
    details: "Validates high-watermark disk state save/load lifecycle for delta extraction."
  },
  {
    id: "test_4",
    name: "test_cleaner_strip_and_deduplicate",
    suite: "unit",
    file: "tests/unit/test_transformation.py",
    duration_ms: 25,
    status: "passed",
    assertCount: 3,
    details: "Confirms leading/trailing whitespace removal and drop_duplicates key subset preservation."
  },
  {
    id: "test_5",
    name: "test_normalizer_currency_and_dates",
    suite: "unit",
    file: "tests/unit/test_transformation.py",
    duration_ms: 31,
    status: "passed",
    assertCount: 2,
    details: "Normalizes currency symbols, commas, and parses varied date strings into ISO format."
  },
  {
    id: "test_6",
    name: "test_business_rules_order_item_totals",
    suite: "unit",
    file: "tests/unit/test_transformation.py",
    duration_ms: 28,
    status: "passed",
    assertCount: 2,
    details: "Computes vectorized line_total (quantity * unit_price) and line margin."
  },
  {
    id: "test_7",
    name: "test_customer_tier_assignment",
    suite: "unit",
    file: "tests/unit/test_transformation.py",
    duration_ms: 35,
    status: "passed",
    assertCount: 1,
    details: "Applies np.select threshold conditions (Bronze/Silver/Gold/Platinum) based on spend."
  },
  {
    id: "test_8",
    name: "test_schema_validator",
    suite: "unit",
    file: "tests/unit/test_validation.py",
    duration_ms: 14,
    status: "passed",
    assertCount: 3,
    details: "Verifies schema gate fails on missing required columns with clear diagnostics."
  },
  {
    id: "test_9",
    name: "test_quality_rules_email_regex",
    suite: "unit",
    file: "tests/unit/test_validation.py",
    duration_ms: 19,
    status: "passed",
    assertCount: 1,
    details: "Validates RFC 5322 regex against valid and malformed email test series."
  },
  {
    id: "test_10",
    name: "test_quarantine_partition_records",
    suite: "unit",
    file: "tests/unit/test_validation.py",
    duration_ms: 42,
    status: "passed",
    assertCount: 3,
    details: "Confirms clean partition: valid records continue, failed records write to dead-letter."
  },
  {
    id: "test_11",
    name: "test_build_upsert_query",
    suite: "unit",
    file: "tests/unit/test_loading.py",
    duration_ms: 12,
    status: "passed",
    assertCount: 4,
    details: "Validates MySQL 8.0 INSERT ... ON DUPLICATE KEY UPDATE query construction."
  },
  {
    id: "test_12",
    name: "test_end_to_end_pipeline_simulation",
    suite: "integration",
    file: "tests/integration/test_pipeline_end_to_end.py",
    duration_ms: 85,
    status: "passed",
    assertCount: 6,
    details: "Runs full multi-stage flow on synthetic dataset; enforces conservation of rows."
  },
  {
    id: "test_13",
    name: "test_idempotent_batch_replay",
    suite: "integration",
    file: "tests/integration/test_idempotency_recovery.py",
    duration_ms: 48,
    status: "passed",
    assertCount: 2,
    details: "Replays duplicate batch; verifies zero redundant record generation."
  }
];

export const SQL_REPORTING_QUERIES: SqlReportQuery[] = [
  {
    id: "report_1",
    title: "Executive Revenue & Order Health Summary",
    description: "Calculates Monthly Gross Revenue, Net Revenue, Delivered Count, Cancellation Rate, and AOV",
    sql: `SELECT 
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
ORDER BY order_month DESC;`,
    columns: ["order_month", "total_orders", "delivered_orders", "cancelled_orders", "cancellation_rate_pct", "gross_revenue", "net_revenue", "average_order_value"],
    rows: [
      { order_month: "2024-04", total_orders: 1, delivered_orders: 1, cancelled_orders: 0, cancellation_rate_pct: 0.00, gross_revenue: 414.99, net_revenue: 414.99, average_order_value: 414.99 },
      { order_month: "2024-03", total_orders: 4, delivered_orders: 2, cancelled_orders: 1, cancellation_rate_pct: 25.00, gross_revenue: 1181.93, net_revenue: 709.94, average_order_value: 354.97 },
      { order_month: "2024-02", total_orders: 3, delivered_orders: 1, cancelled_orders: 0, cancellation_rate_pct: 0.00, gross_revenue: 1817.99, net_revenue: 1817.99, average_order_value: 605.99 },
      { order_month: "2024-01", total_orders: 2, delivered_orders: 2, cancelled_orders: 0, cancellation_rate_pct: 0.00, gross_revenue: 817.69, net_revenue: 817.69, average_order_value: 408.85 },
    ],
    explainPlan: `-> Table scan on <temporary>
   -> Aggregate using temporary table
      -> Index scan on o using idx_fct_orders_date (cost=1.25 rows=10)`
  },
  {
    id: "report_2",
    title: "Customer Lifetime Value (LTV) & Loyalty Tiers",
    description: "Surfaces Top Customers by Spend, Frequency, and Recency with Loyalty Tier Classification",
    sql: `SELECT 
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
LEFT JOIN fct_orders o ON c.customer_id = o.customer_id AND o.order_status NOT IN ('CANCELLED')
GROUP BY c.customer_id, c.full_name, c.email, c.customer_tier, c.city, c.state
ORDER BY lifetime_spent DESC LIMIT 50;`,
    columns: ["customer_id", "full_name", "email", "customer_tier", "city", "state", "total_orders_placed", "lifetime_spent", "avg_basket_size", "most_recent_order_date"],
    rows: [
      { customer_id: 103, full_name: "Elena Rostova", email: "elena.rostova@cloudcorp.com", customer_tier: "PLATINUM", city: "New York", state: "NY", total_orders_placed: 1, lifetime_spent: 949.99, avg_basket_size: 949.99, most_recent_order_date: "2024-02-01 09:12:00" },
      { customer_id: 104, full_name: "David Kim", email: "david.kim@nexusdata.org", customer_tier: "GOLD", city: "San Francisco", state: "CA", total_orders_placed: 1, lifetime_spent: 649.90, avg_basket_size: 649.90, most_recent_order_date: "2024-02-14 16:45:00" },
      { customer_id: 101, full_name: "Sarah Jenkins", email: "sarah.jenkins@athenatech.io", customer_tier: "GOLD", city: "Austin", state: "TX", total_orders_placed: 1, lifetime_spent: 557.49, avg_basket_size: 557.49, most_recent_order_date: "2024-01-15 10:14:00" },
      { customer_id: 109, full_name: "Yuki Tanaka", email: "yuki.tanaka@tokyometrics.jp", customer_tier: "GOLD", city: "Portland", state: "OR", total_orders_placed: 1, lifetime_spent: 519.99, avg_basket_size: 519.99, most_recent_order_date: "2024-03-25 10:05:00" },
      { customer_id: 110, full_name: "Devon Brooks", email: "devon.brooks@apexanalytics.io", customer_tier: "SILVER", city: "Dallas", state: "TX", total_orders_placed: 1, lifetime_spent: 414.99, avg_basket_size: 414.99, most_recent_order_date: "2024-04-02 15:40:00" },
    ],
    explainPlan: `-> Limit: 50 row(s)
   -> Sort: lifetime_spent DESC
      -> Table scan on <temporary>
         -> Left hash join (o.customer_id = c.customer_id)
            -> Table scan on c (dim_customers)
            -> Filter: (o.order_status <> 'CANCELLED')`
  },
  {
    id: "report_3",
    title: "Product Category Profitability & Margin Velocity",
    description: "Evaluates Profit Margins, COGS, and Gross Revenue across Catalog Categories",
    sql: `SELECT 
    p.category,
    COUNT(DISTINCT p.product_id) AS active_products_in_catalog,
    SUM(oi.quantity) AS total_units_sold,
    ROUND(SUM(oi.line_total), 2) AS gross_sales_amount,
    ROUND(SUM(oi.quantity * p.cost_price), 2) AS total_cogs,
    ROUND(SUM(oi.line_total - (oi.quantity * p.cost_price)), 2) AS gross_profit,
    ROUND((SUM(oi.line_total - (oi.quantity * p.cost_price)) / NULLIF(SUM(oi.line_total), 0)) * 100, 2) AS profit_margin_pct
FROM fct_order_items oi
JOIN dim_products p ON oi.product_id = p.product_id
JOIN fct_orders o ON oi.order_id = o.order_id
WHERE o.order_status NOT IN ('CANCELLED')
GROUP BY p.category
ORDER BY gross_profit DESC;`,
    columns: ["category", "active_products_in_catalog", "total_units_sold", "gross_sales_amount", "total_cogs", "gross_profit", "profit_margin_pct"],
    rows: [
      { category: "Office Furniture", active_products_in_catalog: 2, total_units_sold: 4, gross_sales_amount: 1897.98, total_cogs: 1050.00, gross_profit: 847.98, profit_margin_pct: 44.68 },
      { category: "Electronics", active_products_in_catalog: 2, total_units_sold: 3, gross_sales_amount: 1129.48, total_cogs: 685.00, gross_profit: 444.48, profit_margin_pct: 39.35 },
      { category: "Accessories", active_products_in_catalog: 3, total_units_sold: 4, gross_sales_amount: 488.89, total_cogs: 236.50, gross_profit: 252.39, profit_margin_pct: 51.62 },
      { category: "Audio", active_products_in_catalog: 1, total_units_sold: 1, gross_sales_amount: 249.00, total_cogs: 120.00, gross_profit: 129.00, profit_margin_pct: 51.81 },
    ],
    explainPlan: `-> Sort: gross_profit DESC
   -> Stream results
      -> Group aggregate: sum(oi.quantity), sum(oi.line_total)
         -> Nested loop inner join
            -> Filter: (o.order_status <> 'CANCELLED') on fct_orders o
            -> Index lookup on oi using idx_fct_order_items_order (order_id=o.order_id)
            -> Single-row index lookup on p using PRIMARY (product_id=oi.product_id)`
  },
  {
    id: "report_4",
    title: "Data Quality Quarantine Defect Breakdown",
    description: "Aggregates failure codes across entities to guide upstream pipeline engineers",
    sql: `SELECT 
    q.entity_name,
    q.rejection_code,
    COUNT(*) AS total_quarantined_records,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM quarantined_records), 2) AS defect_share_pct
FROM quarantined_records q
GROUP BY q.entity_name, q.rejection_code
ORDER BY total_quarantined_records DESC;`,
    columns: ["entity_name", "rejection_code", "total_quarantined_records", "defect_share_pct"],
    rows: [
      { entity_name: "customers", rejection_code: "INVALID_EMAIL", total_quarantined_records: 2, defect_share_pct: 22.22 },
      { entity_name: "customers", rejection_code: "NULL_PK", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "products", rejection_code: "NEGATIVE_PRICE", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "products", rejection_code: "NULL_PK", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "products", rejection_code: "MISSING_SKU", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "orders", rejection_code: "INVALID_FK_CUSTOMER", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "orders", rejection_code: "INVALID_STATUS", total_quarantined_records: 1, defect_share_pct: 11.11 },
      { entity_name: "orders", rejection_code: "INVALID_DATE", total_quarantined_records: 1, defect_share_pct: 11.11 },
    ],
    explainPlan: `-> Sort: total_quarantined_records DESC
   -> Table scan on <temporary>
      -> Aggregate using temporary table
         -> Table scan on q (quarantined_records)`
  }
];
