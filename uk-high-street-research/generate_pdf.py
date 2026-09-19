#!/usr/bin/env python3
"""Generate a shareable briefing PDF for Rory on UK high-street health."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, ListFlowable, ListItem, HRFlowable, CondPageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
import os

OUT = os.path.join(os.path.dirname(__file__), "UK-High-Street-Health-Regional-Review.pdf")

NAVY = HexColor("#0B1F3A")
TEAL = HexColor("#1B6B6B")
GOLD = HexColor("#C4A35A")
INK = HexColor("#1A1A1A")
MUTED = HexColor("#4A5560")
RULE = HexColor("#D5D0C8")
PALE = HexColor("#F4F1EA")
ROW = HexColor("#EEF3F4")
WARN = HexColor("#8B3A3A")

PAGE_W, PAGE_H = A4


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 15.2 * mm, PAGE_W, 1.2 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Bold", 8)
    canvas.drawString(18 * mm, PAGE_H - 9.2 * mm, "BRIEFING FOR RORY")
    canvas.setFont("Times-Roman", 8)
    canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 9.2 * mm, "UK High Streets  |  September 2026")
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, 12 * mm, PAGE_W, 0.8 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Roman", 8)
    canvas.drawString(18 * mm, 5 * mm, "Not a census of every locality  ·  Source-backed  ·  Occupancy ≠ health")
    canvas.drawRightString(PAGE_W - 18 * mm, 5 * mm, "Page %d" % doc.page)
    canvas.restoreState()


def cover_page(canvas, doc):
    header_footer(canvas, doc)
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 42 * mm, PAGE_W, PAGE_H - 56 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(18 * mm, PAGE_H - 58 * mm, 28 * mm, 2.2 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Bold", 11)
    canvas.drawString(18 * mm, PAGE_H - 70 * mm, "REGIONAL AND SECTOR REVIEW")
    canvas.setFont("Times-Bold", 26)
    y = PAGE_H - 92 * mm
    for line in ["The Health of UK", "High Streets"]:
        canvas.drawString(18 * mm, y, line)
        y -= 12 * mm
    canvas.setFont("Times-Italic", 12)
    canvas.drawString(18 * mm, PAGE_H - 128 * mm, "How vacancy, mix and three high-street occupiers —")
    canvas.drawString(18 * mm, PAGE_H - 135 * mm, "vape shops, barbers and charity shops — vary by nation,")
    canvas.drawString(18 * mm, PAGE_H - 142 * mm, "region, and representative town and city.")
    canvas.setFont("Times-Roman", 10)
    canvas.drawString(18 * mm, 58 * mm, "Prepared September 2026  ·  12 nations and English regions  ·  For discussion with Rory")
    canvas.restoreState()


def styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name="H1", fontName="Times-Bold", fontSize=14, textColor=NAVY,
                         spaceBefore=10, spaceAfter=6, leading=17))
    s.add(ParagraphStyle(name="H2", fontName="Times-Bold", fontSize=11.5, textColor=TEAL,
                         spaceBefore=8, spaceAfter=4, leading=14))
    s.add(ParagraphStyle(name="H3", fontName="Times-Bold", fontSize=10.5, textColor=NAVY,
                         spaceBefore=6, spaceAfter=3, leading=13))
    s.add(ParagraphStyle(name="Body", fontName="Times-Roman", fontSize=9.5, textColor=INK,
                         alignment=TA_JUSTIFY, leading=13, spaceAfter=5))
    s.add(ParagraphStyle(name="BulletBody", fontName="Times-Roman", fontSize=9.5, textColor=INK,
                         leftIndent=12, leading=12.5, spaceAfter=2.5))
    s.add(ParagraphStyle(name="Call", fontName="Times-Italic", fontSize=9.5, textColor=NAVY,
                         leading=13, spaceBefore=4, spaceAfter=8, leftIndent=4, rightIndent=4))
    s.add(ParagraphStyle(name="TH", fontName="Times-Bold", fontSize=7, textColor=white, leading=9))
    s.add(ParagraphStyle(name="TD", fontName="Times-Roman", fontSize=6.8, textColor=INK, leading=8.5))
    s.add(ParagraphStyle(name="Cap", fontName="Times-Italic", fontSize=8, textColor=MUTED,
                         spaceAfter=8, leading=10))
    s.add(ParagraphStyle(name="Ref", fontName="Times-Roman", fontSize=7.5, textColor=MUTED,
                         leading=10, leftIndent=14, firstLineIndent=-14, spaceAfter=2))
    s.add(ParagraphStyle(name="TOC", fontName="Times-Roman", fontSize=10, textColor=INK,
                         leading=16, spaceAfter=1))
    return s


S = styles()


def p(text, style="Body"):
    return Paragraph(text, S[style])


def hrule():
    return HRFlowable(width="100%", thickness=0.4, color=RULE, spaceAfter=6, spaceBefore=2)


def bullets(items):
        return [p("•  " + i, "BulletBody") for i in items]


def section_table(headers, rows, col_widths):
    head = [Paragraph(h, S["TH"]) for h in headers]
    data = [head]
    for row in rows:
        data.append([Paragraph(str(c), S["TD"]) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmd = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("GRID", (0, 0), (-1, -1), 0.25, RULE),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmd.append(("BACKGROUND", (0, i), (-1, i), ROW))
        else:
            cmd.append(("BACKGROUND", (0, i), (-1, i), PALE))
    t.setStyle(TableStyle(cmd))
    return t


def build():
    story = []
    story.append(Spacer(1, 170 * mm))
    story.append(PageBreak())

    story.append(p("Contents", "H1"))
    story.append(hrule())
    for line in [
        "1.  The argument in brief",
        "2.  Scope — what this briefing is and is not",
        "3.  National evidence base",
        "4.  Twelve-region comparison",
        "5.  Vape shops, barbers and charity shops — contribution and limits",
        "6.  Region-by-region notes with named towns and cities",
        "7.  A diagnostic that can be applied to every locality",
        "8.  Implications for councils, landlords and businesses",
        "9.  Data cadence and the quarterly tracker",
        "10. Limitations",
        "11. Selected sources",
    ]:
        story.append(p(line, "TOC"))
    story.append(PageBreak())

    # 1
    story.append(p("1.  The argument in brief", "H1"))
    story.append(hrule())
    story.append(p(
        "<b>Occupancy is not health.</b> Filling empty units with personal services, charity retail or nicotine shops "
        "can cut visible vacancy without restoring banks, pharmacies, toilets, comparison retail or catchment spend. "
        "A policy that only “fills shops” will miss the north–south split and the much larger splits <i>inside</i> "
        "every region."
    ))
    story.append(p(
        "<b>The vacancy geography is stubborn.</b> BRC–Local Data Company monitoring of Great Britain’s top 650 town "
        "centres has repeatedly placed Greater London, the South East and the East of England at the low-vacancy end, "
        "and the North East at the high end, followed by Wales and Scotland. LDC put high-street vacancy at "
        "<b>14.0% in 2023</b> (from 13.8%). Greater London was about <b>10.6%</b> in Q4 2023 versus <b>14.0%</b> GB; "
        "the North East about <b>17.9%</b>. Wales: about <b>one shop in six</b> empty, with <b>7.7%</b> persistent "
        "vacancy in 2023. Northern Ireland is largely outside LDC GB series; Land &amp; Property Services "
        "non-domestic vacancy is a broader measure and is high, especially in Belfast."
    ))
    story.append(p(
        "<b>Central high streets have lost retail jobs.</b> ONS (March 2026) finds retail employment on central high "
        "streets in Great Britain fell <b>19%</b> between 2015 and 2024, versus 6% on non-central high streets and 2% "
        "in retail parks. Central shopping-centre retail jobs fell 31%. Accommodation and food services employment "
        "on central high streets rose 18%. The mix is shifting from shops to hospitality — nationally, not only in the North."
    ))
    story.append(p(
        "<b>The three sectors in the brief are not interchangeable.</b> Charity shops have the strongest documented "
        "social and employment package (CRA: 9,900+ UK shops, ~3.3% of units, 24,900+ FTE, 223,500+ volunteers, "
        "£300m+ surplus to parent charities in 2024/25). Barbers were GB’s fastest-growing retail category in LDC’s "
        "FY2023 data (net +665 units). Vape shops have filled voids — almost 1,200% growth in England, 2014–2024, "
        "with twice the northern density of the South and more than three times the density in the most deprived areas "
        "(Health Equity North) — but they are a public-health and enforcement issue as much as a retail one."
    ))
    story.append(p(
        "Centre for Retail Research: <b>13,479 UK store closures in 2024</b>. BRC–Sensormatic: UK footfall "
        "<b>−2.2%</b> in 2024 (Wales −2.9%, Scotland −2.0%, NI −2.2%). PwC/LDC: northern high streets were the "
        "weakest location type for chain net change in 2024 (around −2.9%)."
    ))
    story.append(p(
        "<b>For Rory:</b> treat high-street health as a bundle — vacancy and mix and catchment income and essential "
        "services and enforcement. Named towns below are illustrations, not a census. Where a statistic is UK-wide, "
        "it is labelled as such.",
        "Call",
    ))

    # 2
    story.append(p("2.  Scope — what this briefing is and is not", "H1"))
    story.append(hrule())
    story.append(p(
        "Coverage is all <b>12 UK nations and English regions</b>, with 3–6 named towns or cities in each. "
        "Comparable public data do <b>not</b> exist for every locality. ONS maps high streets as geographies "
        "(addresses and jobs), not shop vacancy. Vacancy comes from LDC/BRC, Green Street, council Goad/health "
        "checks and, in Northern Ireland, LPS. Footfall comes from BRC–Sensormatic, ONS BT Active Intelligence "
        "(official statistics in development from July 2024, not seasonally adjusted) and BIDs. These sources "
        "<b>must not</b> be added into a single unofficial index."
    ))
    story.append(p(
        "Causal language is avoided. More barbers or charity shops are associated with occupied frontage; they are "
        "not shown here to “cause” recovery. Vape clustering correlates with deprivation and northern amenity change; "
        "that is not proof that vape shops “destroy” high streets. Local before/after studies are still scarce."
    ))

    # 3
    story.append(p("3.  National evidence base", "H1"))
    story.append(hrule())
    story.append(p("3.1  Vacancy and closures", "H2"))
    story.append(section_table(
        ["Indicator", "Figure", "Geography / caveat"],
        [
            ["High-street vacancy 2023", "14.0% (from 13.8%)", "LDC top 650 GB town centres"],
            ["London vs GB, Q4 2023", "10.6% vs 14.0%", "London Assembly citing LDC"],
            ["North East, Q4 2023", "c. 17.9%", "LDC / Green Street commentary"],
            ["Wales empty shops", "c. 1 in 6; persistent 7.7% (2023)", "Welsh Government / WRC"],
            ["Persistent HS vacancy 2023", "5.3% of high-street units", "LDC FY2023"],
            ["UK store closures 2024", "13,479 (c. 37/day)", "Centre for Retail Research; mostly independents"],
            ["UK footfall 2024", "−2.2%", "BRC–Sensormatic; 2nd annual decline"],
            ["Central HS retail jobs 2015–24", "−19%", "ONS GB; parks −2%; food/accom. on central HS +18%"],
        ],
        [42 * mm, 48 * mm, 84 * mm],
    ))
    story.append(p("Table: national markers. Definitions differ across rows — read the caveat column.", "Cap"))

    story.append(p("3.2  Amenity change in England (not UK)", "H2"))
    story.append(p(
        "Health Equity North’s <i>Ghost Towns</i> work (Ordnance Survey Points of Interest, 2014–2024) finds loss of "
        "banks, pharmacies, public toilets and department stores, and growth of takeaways and vape shops, concentrated "
        "in deprived areas and the North. England vape shops: almost <b>1,200%</b> increase; present in <b>97.2%</b> "
        "of local authorities by 2024; <b>0.6 vs 0.3 per 10,000</b> in North vs South; more than three times as "
        "prevalent in the most deprived areas. Charity-shop provision per 10,000 in England <b>fell 21%</b> over the "
        "same decade in that dataset — consolidation, even while the UK stock remains large."
    ))
    story.append(p("3.3  Public opinion", "H2"))
    story.append(p(
        "Centre for Social Justice (official business counts plus Ipsos): specialist tobacco/vape shops almost 2,200 "
        "on the official count versus LDC <b>3,573</b> specialists. Barbers, nails and beauty +22% since 2016. "
        "Polling: 68% say too many vape shops, 58% too many barbers, 50% too many nail bars. That is politics of "
        "the high street, not a welfare ranking of those uses."
    ))

    # 4 comparison
    story.append(p("4.  Twelve-region comparison", "H1"))
    story.append(hrule())
    story.append(p(
        "The table summarises <b>direction of travel</b>. Vacancy figures mix LDC, council audits, Centre for Cities "
        "modelled city-centre rates and LPS. They are not a league table. Centre for Cities figures are a "
        "<b>one-off July 2025 estimate</b>, modelled for 26 of 63 cities — see section 9 on cadence."
    ))
    story.append(section_table(
        ["Place", "Vacancy / occupancy signal", "Intra-region split", "Sectors to watch"],
        [
            ["North East", "Highest GB LDC; Durham towns 19.1% (2025)", "Peterlee 40.8%; Bishop Auckland 35.4%; stronger Newcastle core", "Takeaways +35% (HEN); TSNE underage vape sales"],
            ["North West", "LDC c. 15.6% end-2023; persistent 6.9%", "Manchester/Liverpool vs Wigan ~32%; Blackpool; Burnley", "Northern vape density; GM enforcement"],
            ["Yorks &amp; Humber", "PwC 2024 net −325 chain units", "Leeds/York vs Bradford ~18%; Sheffield vs Meadowhall; Hull", "Bradford steep vape growth from low base"],
            ["East Midlands", "City audits above UK (Nottm 21.1%; Leic. 22.1%)", "Newark 12.6%; Fosse Park / Rushden Lakes leakage", "Class E barbers; vapes hard to count from planning"],
            ["West Midlands", "Polarised industrial cores vs some districts", "Hanley 30.4%; Wolves 25.4%; Worcester ~10%; Coventry CCS 46.6% (regen.)", "Illicit vape seizures; GB barber growth inferred"],
            ["East of England", "Historically low-vacancy region; no single current LDC rate used here", "Cambridge/Peterborough vs Ipswich 19%; Grafton 40.7%", "Cambridge charity share below national"],
            ["London", "Lowest regional: 10.6% Q4 2023; city centre ~7%", "West End footfall gap vs Uxbridge/Twickenham 6–8%", "City of London 4.6 vape shops/10k (tiny resident base)"],
            ["South East", "Agent primes often 2–5%; not ONS", "Reading 18.6% units / 27.1% floorspace; Hastings above England 2023", "ADPH enforcement; health-on-high-street pilots"],
            ["South West", "CfC mid-table 10.5–13.9% large centres", "Exeter/Plymouth vs Bristol–Cribbs; Swindon weekday", "National sector trends; local TS cases"],
            ["Wales", "c. 1 in 6 empty; WRC footfall −2.9% (2024)", "Newport ~19% vs Cardiff ~12.4%; Carmarthen 18–19%", "Morriston vape/barber/takeaway cluster; hospice shops"],
            ["Scotland", "Council TC average 12.3% (2023–24)", "Aberdeen ~21%; S. Ayrshire 35.3%; Western Isles 3.3%", "900+ charity shops; NVP register 7,069 (not all shops)"],
            ["N. Ireland", "LPS all non-domestic — not shop-only; Belfast outlier", "Newtownards core 5.2% vs town 21.3%; Derry 13.8% (2021)", "~300 charity shops; vape licensing forthcoming"],
        ],
        [28 * mm, 48 * mm, 58 * mm, 40 * mm],
    ))
    story.append(p("Table: indicative comparison. See regional sections for sources and method clashes.", "Cap"))

    # 5 sectors
    story.append(p("5.  Vape shops, barbers and charity shops", "H1"))
    story.append(hrule())
    story.append(section_table(
        ["", "Vape shops", "Barbers", "Charity shops"],
        [
            ["What they occupy", "Small specialist units; also convenience channels", "Small service units", "Comparison and secondary frontage"],
            ["Jobs", "Few per specialist unit", "Labour-intensive; NHBF cost squeeze", "24,900+ FTE UK + 223,500+ volunteers"],
            ["Footfall", "Short dwell; youth access is the policy risk", "Appointment / walk-in; social contact", "Browse, donate, Gift Aid, value"],
            ["Resilience", "Licensing, display rules, Jun 2025 disposable ban, illicit trade", "Hard to substitute online; wages/NICs/rent", "Rates relief + donations; NIC and rag-market pressure"],
            ["Health / social", "Adult cessation (ASH) and youth/illicit harm; North/deprivation gradient", "Community contact; CSJ “too many” perception", "Affordable goods, reuse, £300m+ surplus 2024/25"],
            ["Planning", "England: signalling of permission/licensing for new shops", "Usually Class E", "Class E; numbers hard to cap"],
        ],
        [28 * mm, 48 * mm, 48 * mm, 50 * mm],
    ))
    story.append(p("Table: the three occupiers are not one “filler” story.", "Cap"))

    story.append(p("5.1  Vape shops — contribution and constraint", "H2"))
    story.append(p(
        "<b>Contribution.</b> They pay rent on units comparison chains have left. Specialist, age-restricted retailers "
        "can support adult switching from smoking — ASH cautions against treating every vape shop as “rogue”. "
        "Scotland’s Tobacco and Nicotine Vapour Product register shows nicotine retail is much larger than specialist-shop "
        "counts: 5,573 to <b>7,069</b> registered outlets, 2020–2024, concentrated in deprived places (University of Edinburgh / BBC Scotland reporting of register analysis)."
    ))
    story.append(p(
        "<b>Constraint.</b> England amenity research shows northern and deprived over-provision. ASH GB 2024: "
        "<b>48%</b> of current 11–17 vapers bought from shops; 55% of aware 11–17s saw in-shop promotion. "
        "Trading Standards North East (2022 operations): 1.4 tonnes of illegal disposables; 44% of 32 test-purchased "
        "retailers sold to an underage volunteer. West Midlands operations (Birmingham, Sandwell, Walsall) show the "
        "same enforcement load. Occupancy gained this way can worsen the health mission of town-centre policy. "
        "Single-use vapes were banned from 1 June 2025; further licensing is in train."
    ))

    story.append(p("5.2  Barbers — contribution and constraint", "H2"))
    story.append(p(
        "<b>Contribution.</b> LDC FY2023: fastest-growing category, net +665 GB units; density in England and Wales "
        "more than doubled over a decade to 3.1 per 10,000 people. They generate frequent local trips and micro-employment. "
        "Mansfield’s retail monitoring records change-of-use to barbers as a real local mechanism. Elgin’s 2025 health "
        "check: 20 hairdresser/barber units, about half of retail-service outlets."
    ))
    story.append(p(
        "<b>Constraint.</b> CSJ groups barbers with nails as “unwanted” in public opinion. Saturation on secondary "
        "streets (Morriston, Swansea: seven barbers on one strip, councillor evidence 2025) does not recreate a "
        "comparison offer. NHBF surveys show weak hiring intentions. A minority of premises appear in illicit-tobacco "
        "enforcement — that must not be smeared across the whole trade."
    ))

    story.append(p("5.3  Charity shops — contribution and constraint", "H2"))
    story.append(p(
        "<b>Contribution.</b> Clearest UK-wide quantified package: shops, jobs, volunteers, surplus to parent charities. "
        "Scotland: 900+ shops (CRA). Northern Ireland: about 300 (NICVA/CRA). In weaker Welsh valleys towns they are "
        "often the remaining national “brand” on the street. CRA argues they occupy about 3.3% of retail units and "
        "reduce vacancy."
    ))
    story.append(p(
        "<b>Constraint.</b> HEN records falling charity-shop provision per 10,000 in England even as the national stock "
        "stays large. Rates relief is politically contested and can reduce the local tax take even when the unit looks "
        "occupied. Civil Society surveys show profit compression. A street of charity shops can mean affordable access "
        "<i>or</i> failed commercial demand. Count them as a use of interest, not automatically as success or failure."
    ))

    # 6 regions
    story.append(p("6.  Region-by-region notes", "H1"))
    story.append(hrule())

    regions = [
        ("6.1  North East England",
         "GB’s highest tracked vacancy and some of England’s sharpest amenity loss, with extreme town-level outliers.",
         [
             "County Durham 2025: 19.1% town-centre vacancy (target 13.9%); Peterlee 40.8%; Bishop Auckland 35.4% (Northern Echo / council).",
             "PwC 2024: 502 closures vs 359 openings (net −143) — better than 2023, still negative. High streets weakest location type in the northern grouping.",
             "HEN: NE takeaways +35%; banks −30%; pharmacies −16%; toilets −32%; vapes from near-zero to ~0.5 per 10,000.",
             "Places: Newcastle (stronger core; east high streets plan); Gateshead (leakage to Newcastle; ~29% in Task Force-type reviews); Sunderland (city-centre vacancy reported above NE and UK averages); Middlesbrough (oversupply / consolidation).",
             "Sectors: TSNE underage and illicit product evidence (above). Barbers: local qualitative anchors, no NE census. Charity: UK CRA figures only.",
         ]),
        ("6.2  North West England",
         "Polarised — Manchester and parts of Liverpool versus Lancashire, coastal and district centres.",
         [
             "LDC ~15.6% end-2023 (commentary: largest regional improvement, partly Manchester/Trafford). Persistent vacancy ~6.9% (Power to Change/LDC).",
             "PwC 2024: 956 openings / 1,311 closures. HEN: takeaways +33%; northern vape gradient. Blackburn, Preston, Blackpool and Bolton appear in national vape-density lists (press on HEN).",
             "Places: Manchester (events/footfall; district-centre programmes); Liverpool (regeneration; weaker third-party vacancy estimates); Preston 35; Blackpool BID / Growth and Prosperity; Wigan 32.3% of units during Galleries demolition; Burnley (Long-Term Plan for Towns).",
         ]),
        ("6.3  Yorkshire and the Humber",
         "Leeds and York hold up; Bradford, Sheffield and Hull carry leakage and vacancy.",
         [
             "PwC 2024 net −325 chain units (−1.8%). Centre for Cities: Bradford ~18% (second after Newport in that 63-place set); York ~9.2%; Sheffield ~12.9% among large centres.",
             "Leeds: 12.8m Briggate-area visits in 2023; 2024 city-centre cameras +1.3%. York BID July 2025 footfall −13.7% year-on-year. Hull: 34+ visible empties on core streets (2024 press tally).",
             "Places: Leeds as regional consumption hub; Bradford City Village / culture-led shrink of retail; Sheffield versus Meadowhall; York visitor ~40% of centre spend; Hull Community Highstreets Programme; Wakefield/Huddersfield leakage to Leeds.",
             "Sectors: Bradford among steepest local-authority vape increases from a low 2014 base (sensitive percentage). HEN: Yorkshire amenities −29%; vapes 0.5 per 10,000.",
         ]),
        ("6.4  East Midlands",
         "Large city cores sit above UK vacancy benchmarks; some district centres are healthier.",
         [
             "Nottingham 21.1% of units (16.3% excluding Broadmarsh), July 2024 healthcheck. Leicester 22.1% units / 23.1% comparison floorspace versus UK 13.9%. Derby 18.2%; footfall ~60m in 2024 versus 65.5m in 2019. Mansfield 17.4% (2024, up from 13.9%). Newark 12.63%. Northampton primary area ~15%.",
             "Out-of-centre competition: Fosse Park, Rushden Lakes, Milton Keynes. Hybrid working and large-format voids are named in city strategies.",
             "Sectors: barbers via Class E in Mansfield monitoring. ASH/CRUK: 8/8 East Midlands councils in a regional tobacco-control programme; 83% of English authorities did underage vape test purchase (England-wide).",
         ]),
        ("6.5  West Midlands",
         "Patchwork — distressed industrial cores versus tighter county towns and some Birmingham districts.",
         [
             "Hanley 30.4% units / 27.6% floorspace (July 2025). Wolverhampton 25.4% of outlets (2023/24). Walsall primary shopping area 25.3%. Coventry prime 16.0%; City Centre South 46.6% (regeneration distortion). Worcester ~10% (council/press). Birmingham district example: Acocks Green 7.69% (2025).",
             "Sectors: Operation-scale vape seizures (Birmingham, Sandwell, Walsall). Barbers: GB LDC, inferred locally. Charity: UK CRA; enforcement is not format-blind (illicit product has been found across formats).",
         ]),
        ("6.6  East of England",
         "Historically a low-vacancy region, with recently weak footfall and stressed Suffolk/Essex cores.",
         [
             "BRC May 2025: East of England weakest English region for footfall (−3.7% YoY that month). ONS February 2026: among weaker English regions. Do not freeze a ranking from one month.",
             "Norwich retail unit vacancy 15.2% (2025 monitor). Cambridge 13.8% city-wide vacant units but Main Centre 7.7%; Grafton area 40.7% (redevelopment). Peterborough 11–12% (council). Ipswich central shopping area 19.0% vacant units. Luton CoStar ~2.89% is a database outlier, not a Goad equivalent.",
             "Sectors: Cambridge charity shops 6.1% of comparison retailers versus 9.7% nationwide. Colchester evidence names barbers/beauty as footfall-generating services that cannot move online.",
         ]),
        ("6.7  London",
         "Lowest regional vacancy; two-speed activity (suburban local versus central destination).",
         [
             "LDC Greater London 10.6% (Q4 2023). Centre for Cities: London city centre ~7%; 78% of suburban high streets beat the UK city-centre vacancy average. Area A (Uxbridge, Twickenham) ~6–8%; area B (Stamford Hill, West Hackney, Finsbury Park) ~10–12%. Croydon and Ilford can run above the suburban median.",
             "TfL central pedestrian flows Jul–Sep 2024 ~90% of 2019. Some central BIDs report much larger gaps (Heart of London 39% below pre-pandemic — BID geography, not all London). BRC city monitors showed London underperforming in several 2024 months.",
             "Sectors: City of London 4.6 vape shops per 10,000 in 2024 — inflated by a tiny resident population serving workers and visitors. Dense barber market. Charity chains on high-value streets share UK cost pressure (Civil Society 2024: profits down 16% among comparable survey respondents — UK-wide).",
         ]),
        ("6.8  South East England",
         "Affluent primes look tight; Reading and some coastal or restructuring towns do not.",
         [
             "Flude 2025 agent vacancy (not ONS): Worthing 1.4%, Winchester 2.0%, Southampton 2.1%, Brighton &amp; Hove 2.2%, Chichester 2.6%, Guildford 4.4%, Portsmouth 4.6%. Reading Goad May 2024: 18.6% units and 27.1% floorspace, concentrated in The Oracle and large-format voids. Brighton BID: 9.5% ground-floor city-wide / 7.5% BID (different metric again).",
             "Hastings LDC commercial vacancy 11.7% versus England 10.8% (November 2023 withdrawn MHCLG profile — dated, illustrative of coastal stress).",
             "Sectors: Brighton closure order on a Lewes Road shop selling illegal vapes/tobacco (2024). ADPH South East: regulated vaping versus illicit trade. Buckinghamshire “health on the high street” (Aylesbury Unit 33) as a purposeful alternative use.",
         ]),
        ("6.9  South West England",
         "Mid-ranked large centres; leakage and weekday geography matter as much as vacancy.",
         [
             "Centre for Cities 2025 estimates: Exeter ~10.5%, Bournemouth 11.2%, Plymouth 11.4%, Bristol 11.6%, Swindon 12.5%, Gloucester 13.9%. Bristol spend leakage to Cribbs Causeway; Broadmead/Galleries 21.7% of units vacant in an October 2021 council survey — historically far worse than the later city-centre estimate.",
             "Plymouth attributes improvement to food, drink and leisure plus public realm. Swindon: suburban employment parks weaken the weekday core. Bath: Vacant Units Action Project. Gloucester: High Street Rental Auction powers.",
         ]),
        ("6.10  Wales",
         "Structurally high vacancy and falling footfall; Cardiff as the consumption hub.",
         [
             "WRC/Welsh Government: about one in six empty; persistent vacancy 7.7% (2023); Q3 2023 all-location 16.6%; footfall still ~12% below pre-pandemic in Senedd evidence. 2024 footfall −2.9%. Retail jobs 118,000 (2023).",
             "Centre for Cities: Newport ~19% (highest of 62); Cardiff ~12.4%; Swansea ~15.4%. Newport also reported occupancy gains and Q1 footfall above Q1 2019 — headline rates can mask start-up fill. Wrexham year-end 15.22%. Carmarthen 18–19% (March 2024). Denbighshire footfall −2.0% in 2025 versus 2024.",
             "Sectors: Morriston (Swansea) — five vape shops, seven barbers, nine takeaways on the main street (2025 councillor evidence). ASH Wales: licensing and density near schools. Dense hospice and Cancer Research Wales networks in valleys towns. Transforming Towns / Town Centre First; 2026 taskforce (Bangor, Bridgend pilots).",
         ]),
        ("6.11  Scotland",
         "The average conceals Aberdeen and Ayrshire stress and island or small-town tightness.",
         [
             "Council-reported town-centre vacancy 12.3% (2023–24), up from 11.4% two years earlier. Extremes in the same round: South Ayrshire 35.3%, Aberdeen City 20.7%, Fife 18.8%, Comhairle nan Eilean Siar 3.3%. SRC/LDC Q2 2023 15.9% — different method, not interchangeable. Footfall −2.0% in 2024.",
             "Glasgow council 12.1% but 2024 visitor/sales wobble on city-centre indicators. Dundee 17.7%. Inverness tracker ~8.1% versus Highland 2022 health check 12.6% (definition clash). Scottish Borders summer 2025 audit 12%.",
             "Sectors: 900+ charity shops. NVP register 7,069 (2024) — registrants, not specialist-shop counts. Elgin barbers as retail-service anchors. ASH Scotland: conditional registration and Trading Standards resource.",
         ]),
        ("6.12  Northern Ireland",
         "Different statistics; high all-property vacancy; sharp core–fringe splits; rates politics.",
         [
             "LPS covers all non-domestic property, not shops only, and occupancy is not always notified promptly. Newtownards 2025 study: 22.8% average across 41 towns (October 2024), 34.3% Belfast, 18.8% excluding Belfast. BBC/LPS: 1,914 of 5,576 vacant in the Belfast city boundary (31 October 2024).",
             "NIRC footfall −2.2% in 2024; Belfast December −7.2% after a strong event-led summer (cross-border and cruise). Derry 2021 occupancy study: 13.8% of 450 units. Newry 2022: 21.5%. Newtownards 2025: town 21.3% but High Street core 5.2% (3 of 58). Strabane: empty historic core versus occupied edge parks.",
             "Sectors: ~300 charity shops; rates exemption debate. Barbers among Vacant to Vibrant backfill. Disposable vape ban from 1 June 2025; Tobacco and Vapes Act licensing to follow. GB CRR closure totals must not be read as Northern Ireland.",
         ]),
    ]

    for title, head, items in regions:
        block = [p(title, "H2"), p(head, "Call")] + bullets(items)
        story.append(KeepTogether(block))

    # 7 diagnostic
    story.append(p("7.  A diagnostic for every town or city", "H1"))
    story.append(hrule())
    story.append(p(
        "Apply the same questions locally. If a data item is missing, record “unknown” — do not impute the regional average."
    ))
    for i, t in enumerate([
        "<b>Vacancy, three ways:</b> unit %; floorspace %; persistent (2–3 years). Separate regeneration voids (Coventry City Centre South, Wigan Galleries, Cambridge Grafton, Nottingham Broadmarsh).",
        "<b>Catchment economics:</b> resident incomes; spend leakage to a larger city or mall (Bradford→Leeds, Sheffield→Meadowhall, Bristol→Cribbs, Newport→Cardiff, Northampton→MK/Rushden Lakes).",
        "<b>Essential services:</b> banks, pharmacies, GPs, toilets, supermarket access (HEN checklist) — not just “shops open”.",
        "<b>Mix quality:</b> share of comparison, convenience, food, personal services, vape, charity, betting, vacant. Flag monoculture (Morriston-type strips).",
        "<b>Footfall by daypart:</b> weekday versus Saturday versus evening (hybrid-work cities versus tourist versus commuter suburbs).",
        "<b>Enforcement load:</b> underage vape test-purchase fail rate; illicit seizures; shoplifting and ASB.",
        "<b>Employment:</b> high-street jobs by industry if BRES/ONS local extracts exist; otherwise BID or chamber surveys.",
        "<b>Policy tools in use:</b> High Street Rental Auctions, BID, Town Deal / Transforming Towns / Vacant to Vibrant, meanwhile uses, residential conversion, health hubs.",
        "<b>Sector-specific tests:</b> vape (specialist versus convenience; schools; licensing); barber (count versus population; apprenticeships — not “too many” as the only KPI); charity (count, volunteer hours, whether rates relief is crowding independents on that pitch).",
        "<b>Decision rule:</b> if vacancy is falling only because of vape and takeaway clustering while pharmacies and banks fall, score the centre as occupancy up, health down.",
    ], 1):
        story.append(p("%d.  %s" % (i, t), "BulletBody"))

    # 8 implications
    story.append(p("8.  Implications", "H1"))
    story.append(hrule())
    story.append(p("Councils and combined authorities", "H3"))
    story.extend(bullets([
        "Stop using a single vacancy rate as the success metric.",
        "Pair Town Centre First and mixed-use shrink (Wales, Scotland, North East CA, Bradford City Village) with licensing and planning on nicotine retail where statute allows.",
        "Fund Trading Standards if vape policy tightens — otherwise illicit trade occupies the same units.",
        "Publish comparable annual health checks (unit, floorspace, persistent, mix), as Newark, Mansfield, Norwich and Moray already do.",
    ]))
    story.append(p("Landlords and investors", "H3"))
    story.extend(bullets([
        "Prime London, South East historic cores, Cambridge, York, parts of Edinburgh/Glasgow and Cardiff still clear on occupancy. Secondary and large-format stock is the UK problem (Reading Oracle, Hanley, Union Street, Broadmarsh).",
        "Service and food-and-beverage tenants can re-base income; they do not automatically restore rateable-value growth.",
        "Charity and vape covenants have reputational and regulatory tails.",
    ]))
    story.append(p("Businesses and BIDs", "H3"))
    story.extend(bullets([
        "Barbers and charity retail are allies for daytime animation, not a full strategy.",
        "Events and evening economy explain Belfast summer, Manchester and Leeds outliers. They are not transferable to every market town without catchment spend.",
    ]))

    # 9 data cadence
    story.append(PageBreak())
    story.append(p("9.  Data cadence and the quarterly tracker", "H1"))
    story.append(hrule())
    story.append(p(
        "The catchment-spend evidence in this briefing is <b>not on a recurring cycle</b> and cannot be made into one from free sources. This tracker is <b>free-only</b>: ONS, councils, LPS, and property-house PDFs. Paid feeds are out of scope.",
        "Call",
    ))
    story.append(p("9.1  The cadence problem", "H2"))
    story.extend(bullets([
        "<b>Centre for Cities, Checking out</b> — published 10 July 2025 as a one-off report; companion catchment data tool last updated 17 September 2025. Vacancy rates are modelled for 26 of 63 cities. Argument only, not a live series.",
        "<b>ONS × Visa card spending flow</b> — latest release 25 March 2024, data only to Q3 2023, next release “to be announced”. Closest free leakage proxy; not current and not a commitment to quarterly publication.",
        "<b>BRC / LDC full monitors</b> — membership products. Not used.",
        "<b>Conclusion:</b> on a free-only constraint, the live quarterly pulse is ONS footfall (GB regions) plus LPS vacancy (NI). Town vacancy is an irregular council-PDF ledger. Catchment spend is not a KPI.",
    ]))

    story.append(p("9.2  Free stack", "H2"))
    story.append(section_table(
        ["Source", "Cadence", "What it gives", "Limit"],
        [
            ["ONS UK retail footfall (BT)", "Weekly / monthly XLSX", "GB region and site type", "In development; not seasonally adjusted; NI suppressed"],
            ["LPS / Open Data NI", "Quarterly CSV", "Non-domestic vacancy by NI council", "All property types, not shops only"],
            ["Council health checks", "6-monthly to annual", "Named-town vacancy and mix", "Methods and months differ; not every town"],
            ["Savills / Knight Frank / Green Street PDFs", "Irregular headlines", "GB high-street vs park vacancy", "National only; regional tables usually paywalled"],
            ["PwC openings/closures", "Annual press release", "Regional net chain change", "Multiples only"],
            ["CRA public stats page", "Periodic", "UK charity shop totals", "Not regional; full QMA is paid"],
            ["ASH / TS / NVP register", "Ad hoc / register", "Vape enforcement and Scottish outlets", "Not occupancy"],
        ],
        [38 * mm, 32 * mm, 52 * mm, 52 * mm],
    ))
    story.append(p("Not used: Beauclair, CACI, BRC member monitors, CRA QMA (£99).", "Cap"))

    story.append(p("9.3  Free contrast set (council PDFs, not card spend)", "H2"))
    story.append(section_table(
        ["Place", "Free source", "Leakage without spend data"],
        [
            ["Bradford / Leeds", "Council AMR, BBC, planning evidence", "Leeds named as competing centre — qualitative"],
            ["Sheffield", "Council retail study; local press", "Meadowhall named in the health-check narrative"],
            ["Newport / Cardiff", "Council monitoring; WG papers", "Oversupply and hub pull in free text"],
            ["Reading", "Commercial health-check PDF (Goad)", "Large-format voids vs affluent catchment"],
            ["Hanley", "Stoke Retail and Leisure Study Vol. 3", "Highest published unit vacancy in that study"],
            ["County Durham towns", "Council 2025 table (BBC)", "Intra-county spread"],
            ["NI councils", "LPS quarterly CSVs", "Only UK nation with free quarterly vacancy (broad)"],
        ],
        [40 * mm, 62 * mm, 72 * mm],
    ))

    story.append(p("9.4  What each free quarter actually contains", "H2"))
    story.extend(bullets([
        "ONS footfall XLSX — last three months versus the same quarter a year earlier, by GB region and by town/city versus retail park. Do not rank regions on one wet month.",
        "LPS NI CSV — non-domestic vacancy by district, footnoted as not shop-only.",
        "Any new Savills, Knight Frank or Green Street public note — GB headline vacancy only.",
        "Any new council health check in the contrast set.",
        "CRA public stats page if updated; any new published vape/enforcement note.",
        "That is a quarterly national pulse plus an irregular town ledger — not a UK-wide quarterly vacancy series, and not catchment spend.",
    ]))

    # 10 limitations
    story.append(p("10.  Limitations", "H1"))
    story.append(hrule())
    story.extend(bullets([
        "No UK-wide official vacancy series covering every town. LDC is the top 650 GB centres. NI uses LPS.",
        "Methods clash: Goad, walking surveys, Centre for Cities modelled rates, agent opinions, LPS ratings.",
        "Sector counts: vape specialists (LDC) ≠ tobacco SIC counts ≠ Scotland NVP register. CRA “find a shop” ≠ HEN Points of Interest.",
        "2024–26 footfall is noisy (weather; ONS short series).",
        "Cadence: free sources give monthly GB footfall and quarterly NI vacancy. Catchment spend and a UK-wide regional shop-vacancy table are not available without paying. Centre for Cities is one-off and partly modelled (section 9).",
        "No causal model in this briefing linking vape, barber or charity density to vacancy change.",
        "Towns named are illustrative, not a ranking of every place in the region.",
    ]))

    # 10 sources
    story.append(p("11.  Selected sources", "H1"))
    story.append(hrule())
    story.append(p(
        "Full URL list and additional local health checks sit in the companion Markdown file. Headline sources:",
        "Body",
    ))
    refs = [
        "[1] Local Data Company / Green Street, FY 2023 — https://401356.fs1.hubspotusercontent-na1.net/hubfs/401356/FY%202023.pdf",
        "[2] BRC, Britain loses 6,000 storefronts — https://brc.org.uk/news-and-events/news/corporate-affairs/2024/britain-loses-6-000-storefronts-in-five-years/",
        "[3] ONS, High streets and retail areas in Great Britain, March 2026 — https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/articles/highstreetsandretailareasingreatbritain/march2026",
        "[4] Centre for Retail Research, Crisis in retailing — https://www.retailresearch.org/retail-crisis.html",
        "[5] BRC–Sensormatic, 2024 footfall year — https://brc.org.uk/news-and-events/news/corporate-affairs/2025/ungated/drab-december-caps-a-disappointing-year-for-footfall/",
        "[6] Health Equity North, Ghost Towns — https://www.healthequitynorth.co.uk/app/uploads/GHOST-TOWNS-REPORT-EMBARGOED.pdf",
        "[7] Charity Retail Association statistics — https://charityretail.org.uk/charity-shop-stats",
        "[8] Centre for Social Justice, vape shops and high streets — https://www.centreforsocialjustice.org.uk/newsroom/seven-pubs-lost-for-every-new-vape-shop",
        "[9] ASH, youth vaping GB 2024 — https://ash.org.uk/uploads/Use-of-vapes-among-young-people-in-Great-Britain-2024.pdf",
        "[10] Centre for Cities, Checking out, July 2025 — https://www.centreforcities.org/publication/checking-out-the-varying-performance-of-high-streets-across-the-country/",
        "[11] PwC, northern openings and closures 2024 — https://www.pwc.co.uk/press-room/press-releases/regions/north/northern-retail-sector-posts-lowest-closures-since-2018-as-regio.html",
        "[12] London Assembly, London’s High Streets — https://www.london.gov.uk/sites/default/files/2025-04/1658%20-%20Economy%20Culture%20and%20Skills%20Committee%20-%20London%27s%20High%20Streets%20vF_0.pdf",
        "[13] Welsh Government, Town centres position statement — https://www.gov.wales/town-centres-position-statement-html",
        "[14] Scottish Government, A New Future for Scotland’s Town Centres — https://www.gov.scot/publications/new-future-scotlands-town-centres/pages/5/",
        "[15] LPS Northern Ireland vacancy data — https://www.finance-ni.gov.uk/articles/land-property-services-lps-data-available-online",
        "[16] GOV.UK, single-use vapes ban — https://www.gov.uk/guidance/single-use-vapes-ban",
        "[17] GOV.UK, vape and betting shop measures — https://www.gov.uk/government/news/pm-vows-to-save-hollowed-out-high-streets-with-crackdown-on-vape-and-betting-shops",
        "[18] Knight Frank, Retail Investment H2 2024 — https://content.knightfrank.com/research/2278/documents/en/retail-investment-update-h2-2024-11765.pdf",
        "[19] ONS real-time indicators (footfall) — https://www.ons.gov.uk/economy/economicoutputandproductivity/output/bulletins/economicactivityandsocialchangeintheukrealtimeindicators/19march2026",
        "[20] ASH/CRUK local authority survey 2024 — https://ash.org.uk/uploads/ASH-CRUK-Local-Authority-Survey-Report-2024.pdf",
        "[21] BRC Property Monitor (quarterly; latest 28 August 2026) — https://brc.org.uk/market-intelligence/publications/monitors/property-monitor/",
        "[22] ONS × Visa, flow of spending across the UK (to Q3 2023) — https://www.ons.gov.uk/economy/economicoutputandproductivity/output/articles/consumercardspendingflowofspendingacrosstheuk/2019to2023",
        "[23] ONS, Regional consumer card spending trends QMI — https://www.ons.gov.uk/economy/economicoutputandproductivity/output/methodologies/regionalconsumercardspendingtrendsqmi",
        "[24] Open Data NI / LPS, quarterly property vacancy by district council — https://admin.opendatani.gov.uk/en_GB/dataset/quarterly-property-vacancy-rates-by-district-council-and-sector",
        "[25] ONS, UK retail footfall dataset — https://www.ons.gov.uk/economy/economicoutputandproductivity/output/datasets/ukretailfootfall",
        "[26] CACI, Transactional Spend Data (not used; paid) — https://www.caci.co.uk/datasets/transactional-spend-data/",
        "[27] Centre for Cities, high streets catchment data tool — https://www.centreforcities.org/data/high-streets-catchment-data-tool/",
        "[28] BBC News, County Durham empty shops, 3 March 2026 — https://www.bbc.co.uk/news/articles/cy4wg9v1pk2o",
    ]
    for r in refs:
        story.append(p(r, "Ref"))

    story.append(Spacer(1, 8 * mm))
    story.append(p(
        "Companion file with the full regional write-up, comparison notes and additional local URLs: "
        "uk-high-street-health-report.md in the same folder.",
        "Call",
    ))

    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="The Health of UK High Streets: Regional and Sector Review",
        author="Briefing for Rory",
        subject="UK high-street health by region; vape shops, barbers, charity shops",
    )
    doc.build(story, onFirstPage=cover_page, onLaterPages=header_footer)
    print("Wrote", OUT)


if __name__ == "__main__":
    build()
