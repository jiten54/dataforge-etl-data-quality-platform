"""Streamlit Monitoring Dashboard for DataForge ETL Platform.

Visualizes pipeline execution metrics, SLA trends, quarantine failure breakdown,
and data reconciliation status using real database metrics.
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from sqlalchemy import create_engine, text
from src.config import config

st.set_page_config(
    page_title="DataForge ETL Monitor",
    page_icon="⚡",
    layout="wide",
)

st.title("⚡ DataForge — Operational ETL & Data Quality Monitor")
st.caption("Athena Tech Production Pipeline Telemetry & Data Quality Observability")

# Connect to database
try:
    engine = create_engine(config.get_database_url())
    with engine.connect() as conn:
        df_runs = pd.read_sql(
            text("SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT 50"), conn
        )
        df_quar = pd.read_sql(
            text("SELECT entity_name, rejection_code, COUNT(*) as count FROM quarantined_records GROUP BY entity_name, rejection_code"), conn
        )
except Exception as e:
    st.warning(f"Could not connect to live MySQL instance: {e}. Displaying offline telemetry.")
    df_runs = pd.DataFrame([
        {
            "run_id": "run_demo_01",
            "pipeline_name": "retail_ecomm_elt",
            "batch_id": "batch_20261013",
            "status": "COMPLETED",
            "rows_extracted": 45,
            "rows_valid": 36,
            "rows_quarantined": 9,
            "rows_loaded": 36,
            "execution_duration_sec": 1.24,
            "memory_peak_mb": 48.5,
            "created_at": "2026-10-13 18:00:00",
        }
    ])
    df_quar = pd.DataFrame([
        {"entity_name": "orders", "rejection_code": "INVALID_FK_CUSTOMER", "count": 1},
        {"entity_name": "customers", "rejection_code": "INVALID_EMAIL", "count": 2},
        {"entity_name": "products", "rejection_code": "NEGATIVE_PRICE", "count": 1},
        {"entity_name": "order_items", "rejection_code": "INVALID_QUANTITY", "count": 1},
    ])

# Top KPIs
col1, col2, col3, col4 = st.columns(4)
total_runs = len(df_runs)
successful_runs = len(df_runs[df_runs["status"] == "COMPLETED"]) if not df_runs.empty else 0
total_extracted = df_runs["rows_extracted"].sum() if not df_runs.empty else 0
total_quarantined = df_runs["rows_quarantined"].sum() if not df_runs.empty else 0

col1.metric("Total Pipeline Runs", f"{total_runs}")
col2.metric("Success Rate", f"{(successful_runs / total_runs * 100):.1f}%" if total_runs else "N/A")
col3.metric("Total Extracted Rows", f"{total_extracted:,}")
col4.metric("Quarantined Records", f"{total_quarantined:,}")

st.divider()

# Charts
tab1, tab2, tab3 = st.tabs(["Execution History", "Quarantine Analysis", "Throughput & Latency"])

with tab1:
    st.subheader("Recent Execution Logs")
    st.dataframe(df_runs, use_container_width=True)

with tab2:
    st.subheader("Data Quality Defects by Entity & Rejection Code")
    if not df_quar.empty:
        fig = px.bar(
            df_quar,
            x="rejection_code",
            y="count",
            color="entity_name",
            title="Quarantined Records Breakdown",
            barmode="group",
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No quarantined records recorded yet.")

with tab3:
    st.subheader("Pipeline Execution Duration & Memory Usage")
    if not df_runs.empty:
        fig2 = px.scatter(
            df_runs,
            x="execution_duration_sec",
            y="rows_extracted",
            size="memory_peak_mb",
            color="status",
            hover_data=["run_id", "batch_id"],
            title="Execution Duration vs Extracted Rows (Bubble size = Memory MB)",
        )
        st.plotly_chart(fig2, use_container_width=True)
