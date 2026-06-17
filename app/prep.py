"""
Data foundation for Parking Enforcement Intelligence (Theme 1).
Reads the raw BTP parking-violation CSV, cleans it, derives flow-severity,
encodes geohash zones, resolves timestamps to IST, and writes:
  data/clean.pkl      - one cleaned row per violation (the analytics core)
  data/junctions.pkl  - per-junction centroid + counts (for map / patrol module)
Run once:  python app/prep.py
"""
import pandas as pd, numpy as np, json, ast, time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # round2/
SRC  = ROOT / "dataset theme 1" / "jan to may police violation_anonymized791b166.csv"
OUT  = ROOT / "data"
OUT.mkdir(exist_ok=True)

t0 = time.time()
df = pd.read_csv(SRC, low_memory=False)
print(f"loaded {df.shape} in {time.time()-t0:.1f}s")

# ---------- 1. parse violation_type (JSON-list string) ----------
def parse_vt(s):
    if isinstance(s, list): return s
    if not isinstance(s, str): return []
    try: return json.loads(s)
    except Exception:
        try: return ast.literal_eval(s)
        except Exception: return []
df["vtypes"] = df["violation_type"].map(parse_vt)

cnt = Counter(t for L in df["vtypes"] for t in L)
print(f"\n# distinct violation types: {len(cnt)}")
for t, c in cnt.most_common():
    print(f"  {c:7d}  {t}")

# flow-impact severity: how much a violation type chokes the carriageway (0..1)
SEV = {
    "PARKING IN A MAIN ROAD":      1.00,
    "OBSTRUCTING TRAFFIC":         1.00,
    "PARKING NEAR ROAD CROSSING":  0.90,
    "PARKING AT BUS STOP":         0.90,
    "PARKING NEAR BUS STOP":       0.90,
    "DOUBLE PARKING":              0.85,
    "WRONG PARKING":               0.80,
    "NO PARKING":                  0.60,
    "PARKING ON FOOTPATH":         0.50,
    "DEFECTIVE NUMBER PLATE":      0.10,
}
DEFAULT_SEV = 0.55
def severity(L):  return max((SEV.get(t, DEFAULT_SEV) for t in L), default=DEFAULT_SEV)
def primary(L):   return max(L, key=lambda t: SEV.get(t, DEFAULT_SEV)) if L else "UNKNOWN"
df["severity"]     = df["vtypes"].map(severity)
df["primary_type"] = df["vtypes"].map(primary)
df["n_viol"]       = df["vtypes"].map(len).clip(lower=1)

# ---------- 2. timestamps -> IST ----------
df["ts_utc"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
df = df[df["ts_utc"].notna()].copy()
loc = df["ts_utc"].dt.tz_convert("Asia/Kolkata")
df["ts_ist"]     = loc
df["hour"]       = loc.dt.hour
df["dow"]        = loc.dt.dayofweek            # 0=Mon
df["dow_name"]   = loc.dt.day_name()
df["is_weekend"] = loc.dt.dayofweek >= 5
df["month"]      = loc.dt.month
df["ymd"]        = loc.dt.strftime("%Y-%m-%d")

# ---------- 3. geo clean ----------
df["lat"] = pd.to_numeric(df["latitude"],  errors="coerce")
df["lon"] = pd.to_numeric(df["longitude"], errors="coerce")
box = df["lat"].between(12.7, 13.35) & df["lon"].between(77.3, 77.9)
print(f"\ndropped out-of-box rows: {(~box).sum()}")
df = df[box].copy()

# ---------- 4. geohash encode (precision 7 ~153m, 6 ~1.2km) ----------
_B32 = "0123456789bcdefghjkmnpqrstuvwxyz"
_BITS = [16, 8, 4, 2, 1]
def gh_encode(lat, lon, prec=7):
    la, lo = [-90.0, 90.0], [-180.0, 180.0]
    out, bit, ch, even = [], 0, 0, True
    while len(out) < prec:
        if even:
            mid = (lo[0] + lo[1]) / 2
            if lon >= mid: ch |= _BITS[bit]; lo[0] = mid
            else:          lo[1] = mid
        else:
            mid = (la[0] + la[1]) / 2
            if lat >= mid: ch |= _BITS[bit]; la[0] = mid
            else:          la[1] = mid
        even = not even
        if bit < 4: bit += 1
        else:       out.append(_B32[ch]); bit, ch = 0, 0
    return "".join(out)

df["lat_r"], df["lon_r"] = df["lat"].round(6), df["lon"].round(6)
uc = df[["lat_r", "lon_r"]].drop_duplicates().reset_index(drop=True)
print(f"unique coords to encode: {len(uc)}")
uc["gh7"] = [gh_encode(a, b, 7) for a, b in zip(uc["lat_r"], uc["lon_r"])]
uc["gh6"] = uc["gh7"].str[:6]
df = df.merge(uc, on=["lat_r", "lon_r"], how="left")

# ---------- 5. tidy categoricals ----------
for c in ["police_station", "junction_name", "vehicle_type", "vehicle_number"]:
    df[c] = df[c].astype(str).str.strip()
df["has_junction"] = (df["junction_name"] != "No Junction") & (df["junction_name"].str.lower() != "nan")

# keep only what the app/core actually consume (slim footprint for cloud deploy)
keep = ["lat", "lon", "gh6", "gh7", "primary_type", "severity",
        "hour", "dow", "ymd", "police_station", "junction_name",
        "has_junction", "vehicle_type", "vehicle_number"]
clean = df[keep].reset_index(drop=True)
clean.to_pickle(OUT / "clean.pkl")

# ---------- 6. junction lookup (centroid + load) ----------
jx = (clean[clean["has_junction"]]
      .groupby("junction_name")
      .agg(lat=("lat", "median"), lon=("lon", "median"),
           n=("lat", "size"), severity=("severity", "mean"))
      .reset_index().sort_values("n", ascending=False))
jx.to_pickle(OUT / "junctions.pkl")

# ---------- summary ----------
print(f"\nsaved data/clean.pkl {clean.shape}  |  data/junctions.pkl {jx.shape}")
print(f"total time {time.time()-t0:.1f}s")
print("\nhour-of-day (IST) distribution:")
print(clean["hour"].value_counts().sort_index().to_string())
print("\nseverity stats:"); print(clean["severity"].describe().round(3).to_string())
print(f"\ngh7 zones: {clean['gh7'].nunique()}  |  gh6 zones: {clean['gh6'].nunique()}  |  junctions: {len(jx)}")
print("primary_type mix:"); print(clean["primary_type"].value_counts().head(10).to_string())
