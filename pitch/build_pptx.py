"""
Generate pitch/ParkPulse_Deck.pptx — a dark-themed, finale-ready deck.
Run:  pip install python-pptx  &&  python pitch/build_pptx.py
Mirrors pitch/PITCH_DECK.md (keep them in sync). Replace [Team Name] before presenting.
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

BG     = RGBColor(0x0B, 0x0E, 0x14)
PANEL  = RGBColor(0x12, 0x16, 0x1F)
FG     = RGBColor(0xE6, 0xE9, 0xEF)
MUTED  = RGBColor(0x9A, 0xA3, 0xB2)
ACCENT = RGBColor(0x4C, 0x8B, 0xF5)
RED    = RGBColor(0xE2, 0x35, 0x2B)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
W, H = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def _bg(slide):
    r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    r.fill.solid(); r.fill.fore_color.rgb = BG
    r.line.fill.background(); r.shadow.inherit = False
    # accent bar top-left
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(0.7), Inches(0.55), Inches(0.09))
    bar.fill.solid(); bar.fill.fore_color.rgb = ACCENT
    bar.line.fill.background(); bar.shadow.inherit = False


def _text(slide, left, top, width, height, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, space=6):
    """runs: list of (text, size, color, bold)"""
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, (text, size, color, bold) in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.space_after = Pt(space)
        run = p.add_run(); run.text = text
        run.font.size = Pt(size); run.font.bold = bold
        run.font.color.rgb = color; run.font.name = "Segoe UI"
    return tb


def title_slide():
    s = prs.slides.add_slide(BLANK); _bg(s)
    _text(s, Inches(0.9), Inches(2.4), Inches(11.5), Inches(3),
          [("ParkPulse", 60, FG, True),
           ("From 298,000 parking tickets to where to stand tomorrow.", 26, ACCENT, False),
           ("", 8, MUTED, False),
           ("Theme 1 — Poor Visibility on Parking-Induced Congestion", 16, MUTED, False),
           ("Gridlock Hackathon 2.0  ·  [Team Name]", 16, MUTED, False)])
    return s


def content_slide(kicker, title, bullets, footer=None):
    s = prs.slides.add_slide(BLANK); _bg(s)
    _text(s, Inches(0.9), Inches(0.95), Inches(11.5), Inches(0.4), [(kicker, 13, ACCENT, True)])
    _text(s, Inches(0.9), Inches(1.35), Inches(11.5), Inches(1.0), [(title, 34, FG, True)])
    runs = [("•  " + b, 19, FG, False) for b in bullets]
    _text(s, Inches(1.0), Inches(2.75), Inches(11.2), Inches(3.6), runs, space=12)
    if footer:
        _text(s, Inches(0.9), Inches(6.6), Inches(11.5), Inches(0.6), [(footer, 13, MUTED, False)])
    return s


def stat_slide(kicker, title, big, big_label, bullets):
    s = prs.slides.add_slide(BLANK); _bg(s)
    _text(s, Inches(0.9), Inches(0.95), Inches(11.5), Inches(0.4), [(kicker, 13, ACCENT, True)])
    _text(s, Inches(0.9), Inches(1.35), Inches(11.5), Inches(1.0), [(title, 34, FG, True)])
    # big number
    _text(s, Inches(0.9), Inches(2.8), Inches(4.6), Inches(2.6),
          [(big, 110, ACCENT, True), (big_label, 16, MUTED, False)], anchor=MSO_ANCHOR.MIDDLE)
    runs = [("•  " + b, 19, FG, False) for b in bullets]
    _text(s, Inches(5.9), Inches(2.9), Inches(6.6), Inches(3.4), runs, space=12)
    return s


title_slide()
content_slide("The problem · Relevance", "Enforcement is flying blind", [
    "Illegal parking near markets, metros & hubs blocks live lanes and junctions.",
    "Enforcement is reactive & patrol-based — officers go on instinct.",
    "No heatmap · no prioritization · no way to schedule scarce teams."])
content_slide("The data · Feasibility", "Built on real BTP data", [
    "298,445 real violation records · 150 days · zero missing fields.",
    "Top 1% of locations hold 33% of all violations.",
    "15% of vehicles cause 34% of them."],
    footer="Their own challan data — no new sensors, nothing invented.")
content_slide("The honest insight · Trust", "We read the data honestly", [
    "This is enforcement data, not demand — where officers caught parking.",
    "~93% of tickets are written before 1 PM; <0.3% in the 5–9 PM peak.",
    "So we optimize enforcement efficiency and flag the evening blind spot."])
content_slide("The solution · Innovation", "A closed decision loop — not a dashboard", [
    "Detect → Score → Forecast → Deploy → Target.",
    "It ends in an action a supervisor can brief tomorrow.",
    "Outcomes feed back in and sharpen the next plan."])
content_slide("Detect & Score", "One transparent number per zone", [
    "City-wide 3-D hotspot map (geohash hexbins).",
    "Congestion Impact Score 0–100 = violations × severity × flow-criticality.",
    "Junction-blocking and main-road violations weigh most."])
content_slide("Forecast · Innovation", "Validated the hard way", [
    "Predicts violations per zone × weekday × hour.",
    "Honest held-out backtest: r = 0.70, MAE 2.01 — tested on the unseen future.",
    "Benchmarked LightGBM (scored lower, 0.69) → kept the interpretable model."])
stat_slide("Proven impact · Real-world impact", "Proven, not claimed", "38%", "captured · 10 teams · on unseen data", [
    "Replayed a 10-team plan on 31 days the model never saw.",
    "Positioned for ~38% of the violations actually logged…",
    "…vs ~1.3% spread evenly. A validated efficiency gain."])
content_slide("Deploy & Target · Impact", "From insight to a plan you brief tomorrow", [
    "One click → a spaced patrol plan, shared by WhatsApp / print / CSV at roll-call.",
    "Explainable: tap any team for why it's placed (forecast load, impact, trend).",
    "Repeat-offender target lists (15% → 34%): owner-notice / escalated / tow CSV."])
content_slide("Ask ParkPulse · Innovation", "A real AI agent — not a chatbot", [
    "Gemini function-calling over the actual forecaster & optimizer.",
    "Multilingual (English / Hindi / Kannada) + voice input + memory.",
    "An officer just asks: 'Plan 6 teams for Friday evening near KR Market.'"])
content_slide("By design · Live & self-improving", "Live, explainable & self-improving", [
    "Explainable: tap any team → why it's placed (forecast, junction/main-road impact, trend).",
    "Event-aware: auto-flags unusual days (festivals / match days) above the weekday norm.",
    "Self-improving: a live ingest endpoint cleans new challans + rebuilds models in seconds.",
    "Integrity: we never modify the fixed competition dataset — ingest is architecture, not run on it."])
content_slide("Feasibility", "Deployable today", [
    "Runs on a laptop · only data BTP already collects · no new sensors.",
    "Two apps share one brain: a live Streamlit demo + a full-stack product.",
    "Geohash engine generalizes to any city or violation type."])
content_slide("Close", "Why ParkPulse wins", [
    "Feasible — working software today.   Relevant — your data, read honestly.",
    "Innovative — a decision loop + an agentic voice co-pilot + a validated proof.",
    "Real impact — a plan you brief tomorrow, a 38% proven gain, offender targeting.",
    "Turning what already happened into where to stand tomorrow."],
    footer="Live demo: flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app")

out = Path(__file__).resolve().parent / "ParkPulse_Deck.pptx"
prs.save(str(out))
print("saved:", out)
