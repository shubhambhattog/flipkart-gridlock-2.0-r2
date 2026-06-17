"""Hotspot Explorer — slice the city by time, day, violation type and station."""
import numpy as np, pandas as pd
import streamlit as st
import plotly.express as px
import ui, core

ui.page("Hotspot Explorer", "\U0001F5FA️")
ui.brand_sidebar()
df = ui.load_data()

st.markdown("## \U0001F5FA️ Hotspot Explorer")
st.caption("Filter the 298K records and watch hotspots re-rank live.")

# ---------------- filters ----------------
f1, f2, f3, f4 = st.columns([1.1, 1.3, 1.3, 1.3])
days = f1.multiselect("Weekday", ui.DOW_NAMES, default=ui.DOW_NAMES)
hr   = f2.slider("Hour of day (IST)", 0, 23, (6, 13))
vt_all = sorted(df["primary_type"].unique())
vts  = f3.multiselect("Violation type", vt_all, default=vt_all)
st_all = sorted(s for s in df["police_station"].unique() if s.lower() != "nan")
sts  = f4.multiselect("Police station", st_all, default=[])

m = (df["dow"].map(dict(enumerate(ui.DOW_NAMES))).isin(days)
     & df["hour"].between(hr[0], hr[1])
     & df["primary_type"].isin(vts))
if sts:
    m &= df["police_station"].isin(sts)
sub = df[m]

if sub.empty:
    st.warning("No violations match these filters.")
    st.stop()

zones = core.add_impact(core.build_zones(sub))
k = st.columns(4)
ui.kpi(k[0], "Matching violations", f"{len(sub):,}", help=f"{len(sub)/len(df)*100:.1f}% of all records")
ui.kpi(k[1], "Active zones", f"{zones.shape[0]:,}")
ui.kpi(k[2], "Avg severity", f"{sub['severity'].mean():.2f}")
ui.kpi(k[3], "Top zone", zones.iloc[0]["label"].split(" - ")[-1][:18])

# ---------------- map + table ----------------
left, right = st.columns([2, 1], gap="large")
with left:
    st.pydeck_chart(ui.deck([ui.zone_layer(zones)], ui.view(zoom=10.6, pitch=40), ui.TIP_ZONE),
                    width="stretch")
    st.caption("Bubble size = violations · colour = impact (blue→red)")
with right:
    show = zones.head(15)[["label", "violations", "impact_score", "top_violation"]].copy()
    show.columns = ["Zone", "Viol.", "Impact", "Top type"]
    st.dataframe(show, hide_index=True, width="stretch", height=430,
                 column_config={"Impact": st.column_config.ProgressColumn(
                     "Impact", min_value=0, max_value=100, format="%.0f")})

# ---------------- breakdowns ----------------
b1, b2 = st.columns(2, gap="large")
with b1:
    vc = sub["primary_type"].value_counts().head(8).reset_index()
    vc.columns = ["type", "n"]
    fig = px.bar(vc, x="n", y="type", orientation="h", color="n",
                 color_continuous_scale="Blues")
    fig.update_layout(height=300, margin=dict(l=0, r=0, t=10, b=0), yaxis_title="",
                      xaxis_title="violations", coloraxis_showscale=False,
                      paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                      yaxis={"categoryorder": "total ascending"})
    st.markdown("**Violation mix**"); st.plotly_chart(fig, width="stretch")
with b2:
    hv = sub.groupby("hour").size().reset_index(name="n")
    fig = px.area(hv, x="hour", y="n")
    fig.update_traces(line_color=ui.ACCENT, fillcolor="rgba(76,139,245,0.25)")
    fig.update_layout(height=300, margin=dict(l=0, r=0, t=10, b=0),
                      xaxis_title="hour of day (IST)", yaxis_title="violations",
                      paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.markdown("**Daily rhythm**"); st.plotly_chart(fig, width="stretch")
