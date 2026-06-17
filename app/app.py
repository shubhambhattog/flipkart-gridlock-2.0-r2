"""
ParkPulse — Command Center (entry page).
Run from round2/:  streamlit run app/app.py
"""
import numpy as np, pandas as pd
import streamlit as st
import plotly.express as px
import ui, core

ui.page("Command Center")
ui.brand_sidebar()

df    = ui.load_data()
zones = ui.get_zones()
grid  = ui.get_grid()

# ---------------- hero ----------------
st.markdown("# \U0001F6A6 ParkPulse")
st.markdown("#### Turning 298K parking-violation records into targeted enforcement for Bengaluru")
st.caption("Theme 1 · Poor Visibility on Parking-Induced Congestion · Gridlock Hackathon 2.0")

# ---------------- KPIs ----------------
total      = len(df)
vc         = core.vehicle_counts(df)
repeat_sh  = vc[vc >= 2].sum() / total
per_day    = total / df["ymd"].nunique()
before1pm  = (df["hour"] < 13).mean()
top_zone   = zones.iloc[0]

c = st.columns(5)
ui.kpi(c[0], "Violations logged", f"{total:,}")
ui.kpi(c[1], "Hotspot zones", f"{zones.shape[0]:,}", help="~1.2 km neighbourhoods (geohash-6)")
ui.kpi(c[2], "Avg / day", f"{per_day:,.0f}")
ui.kpi(c[3], "Repeat-offender load", f"{repeat_sh*100:,.0f}%",
       help="share of violations from vehicles caught more than once")
ui.kpi(c[4], "#1 hotspot", top_zone["label"].split(" - ")[-1][:18])

st.markdown("")

# ---------------- city map ----------------
left, right = st.columns([2, 1], gap="large")
with left:
    st.subheader("City-wide violation density")
    st.caption("3-D hex bins · height & colour = violation volume. Drag to rotate.")
    st.pydeck_chart(ui.deck([ui.hex_layer(grid)], ui.view(zoom=10.4, pitch=50)),
                    width="stretch")

with right:
    st.subheader("Top impact zones")
    st.caption("Ranked by Congestion Impact Score")
    show = zones.head(12)[["label", "violations", "impact_score"]].copy()
    show.columns = ["Zone", "Violations", "Impact"]
    st.dataframe(show, hide_index=True, width="stretch", height=470,
                 column_config={"Impact": st.column_config.ProgressColumn(
                     "Impact", min_value=0, max_value=100, format="%.0f")})

# ---------------- insight + temporal ----------------
st.markdown("---")
st.subheader("When does enforcement actually happen?")
ins, heat = st.columns([1, 2], gap="large")
with ins:
    st.metric("Logged before 1 PM", f"{before1pm*100:.0f}%")
    st.markdown(
        f"**Observation-bias insight.** Roughly **{before1pm*100:.0f}%** of all violations are logged "
        "before 1 PM — the data reflects *when patrols are out*, not when illegal parking peaks. "
        "Evening commercial-hour parking is largely **uncaptured**.\n\n"
        "ParkPulse treats this honestly: we optimise **enforcement efficiency** on observed patterns "
        "and flag **coverage blind spots** for re-deployment.")
with heat:
    pivot = (df.groupby(["dow", "hour"]).size().reset_index(name="n"))
    pivot["Weekday"] = pivot["dow"].map(dict(enumerate(ui.DOW_NAMES)))
    fig = px.density_heatmap(pivot, x="hour", y="Weekday", z="n",
                             category_orders={"Weekday": ui.DOW_NAMES},
                             color_continuous_scale="Turbo", nbinsx=24)
    fig.update_layout(height=360, margin=dict(l=0, r=0, t=10, b=0),
                      paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                      coloraxis_colorbar=dict(title="Viol."), xaxis_title="Hour of day (IST)")
    st.plotly_chart(fig, width="stretch")

st.caption("Navigate ▸ Hotspot Explorer · Forecast & Patrol Planner · Repeat-Offender Intelligence")
