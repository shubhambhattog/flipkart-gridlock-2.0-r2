"""Forecast & Patrol Planner — predict enforcement load and deploy teams optimally."""
import numpy as np, pandas as pd
import streamlit as st
import ui, core

ui.page("Forecast & Patrol", "\U0001F693")
ui.brand_sidebar()

zones = ui.get_zones()
fc    = ui.get_forecaster()
bt    = ui.get_backtest()

st.markdown("## \U0001F693 Forecast & Patrol Planner")
st.caption("Predict where violations will cluster next, then auto-generate a deployment plan.")

# ---------------- controls ----------------
c1, c2, c3, c4 = st.columns([1.2, 1.6, 1, 1])
day  = c1.selectbox("Weekday", ui.DOW_NAMES, index=5)        # default Saturday
dow  = ui.DOW_NAMES.index(day)
win  = c2.slider("Shift window (IST)", 0, 23, (9, 13))
hours = list(range(win[0], win[1] + 1))
teams = c3.slider("Patrol teams", 3, 20, 8)
sep   = c4.slider("Min spacing (m)", 200, 1500, 600, step=100)

pred = core.predict_load(fc, dow, hours)
plan = core.allocate_patrols(zones, pred, k=teams, min_sep_m=sep)
pm   = pred.merge(zones, on="gh6")

total_pred = pred["pred_load"].sum()
covered    = plan["pred_load"].sum() if len(plan) else 0
k = st.columns(4)
ui.kpi(k[0], "Predicted violations", f"{total_pred:,.0f}", help=f"{day} {win[0]:02d}:00–{win[1]:02d}:59")
ui.kpi(k[1], f"Captured by {teams} teams", f"{covered/total_pred*100:,.0f}%" if total_pred else "—")
ui.kpi(k[2], "Forecast accuracy", f"r = {bt['pearson_r']}",
       help=f"held-out time-split (after {bt['cutoff']}), {bt['cells']:,} zone·day·hour cells")
ui.kpi(k[3], "Mean abs. error", f"{bt['mae']:.2f}", help="violations per zone·hour cell")

# ---------------- map + plan ----------------
left, right = st.columns([2, 1], gap="large")
with left:
    pm2 = pm.copy()
    pm2["radius"] = (np.sqrt(pm2["pred_load"]) * 30).clip(40, 700)
    pm2["color"] = pm2["impact_score"].map(ui.impact_color)
    import pydeck as pdk
    base = pdk.Layer("ScatterplotLayer", data=pm2, get_position=["lon", "lat"],
                     get_radius="radius", get_fill_color="color", opacity=0.45, pickable=False)
    layers = [base] + ui.plan_layers(plan)
    centre = plan.iloc[0] if len(plan) else {"lat": ui.BLR["lat"], "lon": ui.BLR["lon"]}
    st.pydeck_chart(ui.deck(layers, ui.view(centre["lat"], centre["lon"], zoom=11, pitch=40),
                            ui.TIP_PLAN), width="stretch")
    st.caption("Faint bubbles = predicted load · blue pins = recommended team deployment")
with right:
    st.markdown(f"**Deployment plan — {day} {win[0]:02d}:00–{win[1]:02d}:59**")
    tbl = plan[["team", "label", "pred_load", "impact_score"]].copy()
    tbl.columns = ["Team", "Deploy to", "Exp. catches", "Impact"]
    st.dataframe(tbl, hide_index=True, width="stretch", height=380)
    st.download_button("⬇ Download plan (CSV)",
                       plan.to_csv(index=False).encode(),
                       file_name=f"patrol_plan_{day}_{win[0]:02d}{win[1]:02d}.csv",
                       width="stretch")

with st.expander("How the forecast works"):
    st.markdown(
        "- **Target:** expected violations per *zone × weekday × hour*, learned from 150 days of history.\n"
        "- **Method:** Bayesian-shrunk historical rates — sparse weekday cells borrow strength from the "
        "zone's overall hour profile, so estimates stay stable.\n"
        f"- **Validation:** time-split backtest (train → predict the held-out tail after {bt['cutoff']}): "
        f"Pearson r = **{bt['pearson_r']}**, MAE = **{bt['mae']}** across {bt['cells']:,} cells.\n"
        "- **Allocation:** greedy maximisation of predicted load with a minimum-spacing constraint so "
        "teams don't stack on one street.")
