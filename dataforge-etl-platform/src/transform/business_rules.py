"""Business Rules & Analytical Enrichment Module for DataForge.

Applies domain transformations:
- Line item total calculations: quantity * unit_price
- Gross margin calculations: line_total - (quantity * cost_price)
- Customer tier recalculation based on lifetime spend
"""

import pandas as pd
import numpy as np


class BusinessRulesTransformer:
    """Computes derived analytical fields using vectorized operations."""

    @staticmethod
    def calculate_order_item_totals(df_items: pd.DataFrame, df_products: pd.DataFrame) -> pd.DataFrame:
        """Calculates line_total and attaches product unit_price / cost_price if missing."""
        df = df_items.copy()

        # Vectorized line total computation
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1).astype(int)
        df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0.0).round(2)
        df["line_total"] = (df["quantity"] * df["unit_price"]).round(2)

        # Merge with product catalog to compute margin
        if not df_products.empty and "cost_price" in df_products.columns:
            prod_lookup = df_products[["product_id", "cost_price"]].drop_duplicates("product_id")
            merged = df.merge(prod_lookup, on="product_id", how="left")
            merged["cost_price"] = merged["cost_price"].fillna(0.0)
            merged["gross_margin"] = (merged["line_total"] - (merged["quantity"] * merged["cost_price"])).round(2)
            return merged.drop(columns=["cost_price"])

        df["gross_margin"] = 0.00
        return df

    @staticmethod
    def assign_customer_tiers(df_customers: pd.DataFrame, df_orders: pd.DataFrame) -> pd.DataFrame:
        """Calculates customer lifetime spend and sets tiered loyalty status."""
        df_cust = df_customers.copy()
        if df_orders.empty:
            df_cust["customer_tier"] = "BRONZE"
            return df_cust

        valid_orders = df_orders[~df_orders["order_status"].isin(["CANCELLED"])]
        spend = (
            valid_orders.groupby("customer_id")["total_amount"]
            .sum()
            .reset_index()
            .rename(columns={"total_amount": "lifetime_spend"})
        )

        merged = df_cust.merge(spend, on="customer_id", how="left")
        merged["lifetime_spend"] = merged["lifetime_spend"].fillna(0.0)

        # Conditions for tiers: BRONZE < $200 <= SILVER < $1000 <= GOLD < $2500 <= PLATINUM
        conditions = [
            merged["lifetime_spend"] >= 2500,
            merged["lifetime_spend"] >= 1000,
            merged["lifetime_spend"] >= 200,
        ]
        choices = ["PLATINUM", "GOLD", "SILVER"]
        merged["customer_tier"] = np.select(conditions, choices, default="BRONZE")

        return merged.drop(columns=["lifetime_spend"])
