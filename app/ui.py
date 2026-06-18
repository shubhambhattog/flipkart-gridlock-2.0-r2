"""
ui.py - shared Streamlit helpers: cached data loaders, colour ramps, pydeck/plotly
builders and brand constants. Pages stay thin and import from here.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))   # allow `import core`

import numpy as np, pandas as pd
import streamlit as st
import pydeck as pdk
import core

# ---------------------------------------------------------------- brand
ACCENT  = "#4C8BF5"
BASEMAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
BLR     = {"lat": 12.9716, "lon": 77.5946}
DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
# blue -> amber -> red, used for impact / density everywhere
COLOR_RANGE = [[46,134,222],[92,160,180],[245,205,90],[245,158,65],[238,110,55],[226,53,43]]

_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
html, body, [class*="css"], [data-testid="stMarkdownContainer"] { font-family: 'Inter', sans-serif; }
[data-testid="stToolbar"], #MainMenu, footer { visibility: hidden; }
[data-testid="stHeader"] { background: transparent; }
.block-container { padding-top: 2.2rem; padding-bottom: 2rem; max-width: 1480px; }
[data-testid="stMetric"] {
    background: linear-gradient(180deg, #171D2A 0%, #141926 100%);
    border: 1px solid #232B3D; border-radius: 14px; padding: 14px 18px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
[data-testid="stMetricValue"] { font-weight: 700; }
[data-testid="stMetricLabel"] p { color: #9aa4b8; font-weight: 500; }
section[data-testid="stSidebar"] { background: #0B0F17; border-right: 1px solid #1c2433; }
h1, h2, h3 { letter-spacing: -0.015em; font-weight: 700; }
.stButton button, [data-testid="stDownloadButton"] button {
    border-radius: 10px; font-weight: 600; border: 1px solid #2a3346;
}
hr { margin: 1.1rem 0; border-color: #1f2735; }
</style>
"""

def page(title, icon="\U0001F6A6"):
    st.set_page_config(page_title=f"{title} · ParkPulse", page_icon=icon, layout="wide",
                       initial_sidebar_state="expanded")
    st.markdown(_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------------- cached loaders
@st.cache_data(show_spinner="Loading violations…")
def load_data():
    return core.load_clean()

@st.cache_data(show_spinner="Scoring zones…")
def get_zones():
    return core.add_impact(core.build_zones(load_data()))

@st.cache_data(show_spinner="Building grid…")
def get_grid():
    df = load_data()
    return (df.groupby("gh7")
              .agg(lat=("lat","median"), lon=("lon","median"),
                   n=("lat","size"), sev=("severity","mean"))
              .reset_index())

@st.cache_data(show_spinner="Training forecaster…")
def get_forecaster():
    return core.build_forecaster(load_data())

@st.cache_data(show_spinner=False)
def get_backtest():
    return core.backtest(load_data())

# ---------------------------------------------------------------- colour
def impact_color(score):
    """0..100 -> [r,g,b] along blue->amber->red."""
    stops = [(0,(46,134,222)), (45,(245,205,90)), (70,(245,158,65)), (100,(226,53,43))]
    score = max(0, min(100, float(score)))
    for (a,ca),(b,cb) in zip(stops, stops[1:]):
        if score <= b:
            t = 0 if b==a else (score-a)/(b-a)
            return [int(ca[i]+(cb[i]-ca[i])*t) for i in range(3)]
    return list(stops[-1][1])

# ---------------------------------------------------------------- map builders
def view(lat=None, lon=None, zoom=10.6, pitch=45):
    return pdk.ViewState(latitude=BLR["lat"] if lat is None else lat,
                         longitude=BLR["lon"] if lon is None else lon,
                         zoom=zoom, pitch=pitch, bearing=0)

def deck(layers, viewstate, tooltip=None):
    return pdk.Deck(layers=layers, initial_view_state=viewstate, map_style=BASEMAP,
                    tooltip=tooltip or True)

def hex_layer(grid, radius=160, elev=18):
    return pdk.Layer(
        "HexagonLayer", data=grid, get_position=["lon","lat"],
        get_elevation_weight="n", get_color_weight="n",
        elevation_aggregation="SUM", color_aggregation="SUM",
        radius=radius, elevation_scale=elev, elevation_range=[0,2400],
        extruded=True, coverage=0.92, pickable=True, auto_highlight=True,
        color_range=COLOR_RANGE)

def zone_layer(zones):
    z = zones.copy()
    z["color"] = z["impact_score"].map(impact_color)
    z["radius"] = (np.sqrt(z["violations"]) * 7).clip(60, 900)
    return pdk.Layer(
        "ScatterplotLayer", data=z, get_position=["lon","lat"],
        get_radius="radius", get_fill_color="color",
        opacity=0.65, stroked=True, get_line_color=[255,255,255,60],
        line_width_min_pixels=0.5, pickable=True, auto_highlight=True)

def plan_layers(plan):
    halo = pdk.Layer("ScatterplotLayer", data=plan, get_position=["lon","lat"],
                     get_radius=420, get_fill_color=[76,139,245,55], pickable=False)
    pts  = pdk.Layer("ScatterplotLayer", data=plan, get_position=["lon","lat"],
                     get_radius=120, get_fill_color=[76,139,245], stroked=True,
                     get_line_color=[255,255,255], line_width_min_pixels=2, pickable=True)
    txt  = pdk.Layer("TextLayer", data=plan, get_position=["lon","lat"], get_text="team",
                     get_size=13, get_color=[255,255,255], get_pixel_offset=[0,-22],
                     get_alignment_baseline="'bottom'")
    return [halo, pts, txt]

TIP_ZONE = {"html": "<b>{label}</b><br/>Violations: {violations}<br/>"
                    "Impact score: {impact_score}<br/>Top: {top_violation}",
            "style": {"backgroundColor": "#161B26", "color": "#E6E9EF", "fontSize": "12px"}}
TIP_PLAN = {"html": "<b>{team} → {label}</b><br/>Predicted catches: {pred_load}<br/>"
                    "Impact score: {impact_score}",
            "style": {"backgroundColor": "#161B26", "color": "#E6E9EF", "fontSize": "12px"}}

# ---------------------------------------------------------------- misc
def kpi(col, label, value, help=None):
    col.metric(label, value, help=help)

def brand_sidebar():
    st.sidebar.markdown("## \U0001F6A6 ParkPulse")
    st.sidebar.caption("Parking Enforcement Intelligence for Bengaluru Traffic Police")
    st.sidebar.markdown("---")
