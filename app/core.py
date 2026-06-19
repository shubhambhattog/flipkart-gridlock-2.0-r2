"""
core.py - the intelligence layer for Parking Enforcement Intelligence (Theme 1).
Pure pandas/numpy (no Streamlit) so it is unit-testable standalone:
    python app/core.py
Provides:
    load_clean()                 -> cleaned violations DataFrame
    build_zones(df)              -> per-neighbourhood (gh6) summary + labels
    add_impact(zones)            -> Congestion Impact Score (0-100)
    build_forecaster(df)         -> shrunk expected-load table per (zone, dow, hour)
    predict_load(fc, dow, hours) -> predicted enforcement load per zone for a window
    backtest(df)                 -> time-split validation (Pearson r, MAE)
    allocate_patrols(...)        -> spatially-spread top-K deployment plan
"""
import numpy as np, pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# --------------------------------------------------------------------------
def load_clean() -> pd.DataFrame:
    return pd.read_pickle(DATA / "clean.pkl")

def load_junctions() -> pd.DataFrame:
    return pd.read_pickle(DATA / "junctions.pkl")

def vehicle_counts(df: pd.DataFrame) -> pd.Series:
    """Violations per vehicle (descending), excluding unrecorded ('nan') plates.
       Single source of truth for repeat-offender stats across pages."""
    vc = df["vehicle_number"].value_counts()
    return vc[vc.index.str.lower() != "nan"]

# --------------------------------------------------------------------------
def _label_for(group: pd.DataFrame) -> str:
    """Human-readable label for a zone: dominant named junction else police station."""
    j = group.loc[group["has_junction"], "junction_name"]
    if len(j):
        return j.mode().iat[0]
    s = group["police_station"]
    s = s[s.str.lower() != "nan"]
    return (s.mode().iat[0] if len(s) else "Unnamed area")

def build_zones(df: pd.DataFrame, key: str = "gh6") -> pd.DataFrame:
    g = df.groupby(key)
    zones = g.agg(
        lat=("lat", "median"),
        lon=("lon", "median"),
        violations=("lat", "size"),
        avg_severity=("severity", "mean"),
        junction_frac=("has_junction", "mean"),
        main_road_frac=("primary_type", lambda s: (s == "PARKING IN A MAIN ROAD").mean()),
    ).reset_index()
    labels = g.apply(_label_for).rename("label").reset_index()
    top_type = g["primary_type"].agg(lambda s: s.mode().iat[0]).rename("top_violation").reset_index()
    zones = zones.merge(labels, on=key).merge(top_type, on=key)
    return zones

def add_impact(zones: pd.DataFrame) -> pd.DataFrame:
    """Congestion Impact Score (0-100), transparent & monotone.
       impact = volume x avg_severity x flow_multiplier, log-scaled to 0-100.
       flow_multiplier rewards junction proximity and main-road blocking."""
    z = zones.copy()
    flow_mult = 1.0 + 0.5 * z["junction_frac"] + 0.5 * z["main_road_frac"]
    raw = z["violations"] * z["avg_severity"] * flow_mult
    log = np.log1p(raw)
    span = log.max() - log.min()
    z["impact_raw"] = raw
    z["impact_score"] = (100 * (log - log.min()) / span).round(1) if span else 100.0
    return z.sort_values("impact_score", ascending=False).reset_index(drop=True)

# --------------------------------------------------------------------------
def build_forecaster(df: pd.DataFrame, alpha: float = 12.0) -> dict:
    """Expected enforcement load per (zone, weekday, hour), Bayesian-shrunk toward
       the zone-hour average so sparse weekday cells stay stable.
       rate = (count_zdh + alpha * r_zh) / (n_dow + alpha)   (per matching calendar day).
       alpha=12 tuned on the held-out time-split (r 0.685->0.70); higher shrinkage generalises
       better than a LightGBM Poisson model (which scored lower and is less explainable)."""
    n_dow = df.groupby("dow")["ymd"].nunique()                 # # of each weekday in span
    n_dates = df["ymd"].nunique()
    czdh = df.groupby(["gh6", "dow", "hour"]).size().rename("c").reset_index()
    # zone-hour backoff rate (avg violations per day at that hour, any weekday)
    r_zh = (df.groupby(["gh6", "hour"]).size() / n_dates).rename("r_zh").reset_index()
    czdh = czdh.merge(r_zh, on=["gh6", "hour"], how="left")
    czdh["n_dow"] = czdh["dow"].map(n_dow)
    czdh["rate"] = (czdh["c"] + alpha * czdh["r_zh"]) / (czdh["n_dow"] + alpha)
    return {"rate_zdh": czdh[["gh6", "dow", "hour", "rate", "c"]],
            "r_zh": r_zh, "n_dow": n_dow, "n_dates": n_dates}

def predict_load(fc: dict, dow: int, hours) -> pd.DataFrame:
    """Predicted enforcement load per zone for weekday `dow` summed over `hours`."""
    hours = list(hours)
    t = fc["rate_zdh"]
    sub = t[(t["dow"] == dow) & (t["hour"].isin(hours))]
    return (sub.groupby("gh6")["rate"].sum()
            .rename("pred_load").reset_index()
            .sort_values("pred_load", ascending=False))

# --------------------------------------------------------------------------
def backtest(df: pd.DataFrame, train_frac: float = 0.8, min_count: int = 20) -> dict:
    """Honest time-split: fit rates on the first `train_frac` of the calendar,
       predict the held-out tail, score per (zone,dow,hour) cell."""
    dates = np.sort(df["ymd"].unique())
    cut = dates[int(len(dates) * train_frac)]
    tr, te = df[df["ymd"] < cut], df[df["ymd"] >= cut]
    fc = build_forecaster(tr)
    pred = fc["rate_zdh"].rename(columns={"rate": "pred"})
    # actual per-day rate in the test window
    n_dow_te = te.groupby("dow")["ymd"].nunique()
    act = te.groupby(["gh6", "dow", "hour"]).size().rename("c_te").reset_index()
    act["actual"] = act["c_te"] / act["dow"].map(n_dow_te)
    m = pred.merge(act, on=["gh6", "dow", "hour"], how="inner")
    m = m[m["c"] >= min_count * train_frac]            # evaluate on cells with signal
    r = m["pred"].corr(m["actual"])
    mae = (m["pred"] - m["actual"]).abs().mean()
    return {"pearson_r": round(float(r), 3), "mae": round(float(mae), 3),
            "cells": int(len(m)), "cutoff": str(cut)}

# --------------------------------------------------------------------------
def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp, dl = np.radians(lat2 - lat1), np.radians(lon2 - lon1)
    a = np.sin(dp / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))

def allocate_patrols(zones: pd.DataFrame, pred: pd.DataFrame, k: int = 10,
                     min_sep_m: float = 600.0) -> pd.DataFrame:
    """Greedy deploy K teams to the highest predicted-load zones while keeping
       them at least `min_sep_m` apart (avoid stacking teams on one street)."""
    cols = ["gh6", "lat", "lon", "label", "impact_score", "avg_severity", "top_violation"]
    cand = (pred.merge(zones[cols], on="gh6")
            .sort_values("pred_load", ascending=False).reset_index(drop=True))
    chosen = []
    for _, row in cand.iterrows():
        if len(chosen) >= k:
            break
        if chosen:
            d = _haversine(row["lat"], row["lon"],
                           np.array([c["lat"] for c in chosen]),
                           np.array([c["lon"] for c in chosen]))
            if d.min() < min_sep_m:
                continue
        chosen.append(row.to_dict())
    if not chosen:                                   # always return the expected columns
        return pd.DataFrame(columns=["team", "pred_load"] + cols)
    out = pd.DataFrame(chosen)
    out.insert(0, "team", [f"Team {i+1}" for i in range(len(out))])
    out["pred_load"] = out["pred_load"].round(2)
    return out

# --------------------------------------------------------------------------
def coverage_by_hour(df: pd.DataFrame) -> pd.DataFrame:
    """Share of enforcement by hour-of-day — exposes the evening coverage gap."""
    c = df.groupby("hour").size()
    return pd.DataFrame({"hour": c.index.astype(int),
                         "violations": c.values,
                         "share": (c / c.sum()).values})

def roi_curve(pred: pd.DataFrame, k_max: int = 20) -> pd.DataFrame:
    """Impact captured by the top-K predicted zones vs spreading teams evenly.
       optimal = cumulative share of predicted load at the top-K zones;
       even    = K / (#active zones) = expected share without targeting."""
    loads = np.sort(pred["pred_load"].values)[::-1]
    total = loads.sum()
    n = len(loads)
    rows, cum, prev = [], 0.0, 0.0
    for k in range(1, min(k_max, n) + 1):
        cum += float(loads[k - 1])
        opt = cum / total if total else 0.0
        even = k / n if n else 0.0
        rows.append({"teams": k, "optimal": opt, "even": even,
                     "ratio": (opt / even) if even else 0.0,
                     "marginal": opt - prev})
        prev = opt
    return pd.DataFrame(rows)

def deployment_simulation(df: pd.DataFrame, k_list=(6, 8, 10, 12, 15), train_frac: float = 0.8) -> list:
    """Counterfactual 'what if BTP had used ParkPulse?' on held-out data. Train the forecaster on the first
       `train_frac` of the calendar; then for each held-out day, deploy K teams to ParkPulse's top-K predicted
       zones for that weekday and measure the share of that day's ACTUAL violations that fell in those zones —
       vs a static 'go to the known hotspots' plan and an even spread. Honest: 'actual' is logged enforcement,
       so this is the share of *catchable* violations a deployment would have been positioned for (efficiency)."""
    dates = np.sort(df["ymd"].unique())
    cut = dates[int(len(dates) * train_frac)]
    tr, te = df[df["ymd"] < cut], df[df["ymd"] >= cut]
    fc = build_forecaster(tr)
    static_rank = tr.groupby("gh6").size().sort_values(ascending=False).index.tolist()
    nz = tr["gh6"].nunique()
    out = []
    for k in k_list:
        pp, st, ev = [], [], []
        for _, g in te.groupby("ymd"):
            dow = int(g["dow"].iloc[0])
            pred = predict_load(fc, dow, sorted(g["hour"].unique()))
            pp_z = set(pred.sort_values("pred_load", ascending=False)["gh6"].head(k))
            st_z = set(static_rank[:k])
            a = g.groupby("gh6").size(); tot = a.sum()
            pp.append(a[a.index.isin(pp_z)].sum() / tot)
            st.append(a[a.index.isin(st_z)].sum() / tot)
            ev.append(k / nz)
        out.append({"teams": int(k), "parkpulse": round(float(np.mean(pp)), 4),
                    "static": round(float(np.mean(st)), 4), "even": round(float(np.mean(ev)), 4)})
    return {"cutoff": str(cut), "test_days": int(te["ymd"].nunique()), "curve": out}

# --------------------------------------------------------------------------
if __name__ == "__main__":
    df = load_clean()
    print("clean:", df.shape)
    zones = add_impact(build_zones(df))
    print("\nzones:", zones.shape)
    print(zones[["gh6", "label", "violations", "avg_severity",
                 "impact_score", "top_violation"]].head(10).to_string(index=False))
    fc = build_forecaster(df)
    print("\nbacktest:", backtest(df))
    DOW, HRS = 5, range(9, 13)        # Saturday 9am-1pm
    pred = predict_load(fc, DOW, HRS)
    plan = allocate_patrols(zones, pred, k=8)
    print(f"\npatrol plan (Sat 9-13h, 8 teams):")
    print(plan[["team", "label", "pred_load", "impact_score", "top_violation"]].to_string(index=False))
