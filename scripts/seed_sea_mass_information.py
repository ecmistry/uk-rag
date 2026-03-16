#!/usr/bin/env python3
"""
One-off script to add 'information' field (with path-to-green) to sea_mass, land_mass, air_mass metricHistory.
Run from project root: python3 scripts/seed_sea_mass_information.py
"""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo not installed. Install with: pip install pymongo")
    sys.exit(1)


def _compute_sea_mass_score(carriers, ssbns, ssns, escorts, rfa, patrol_mcm):
    """Compute overall sea mass score from pillar ratios."""
    strategic = 30.0 * (min(carriers / 3.0, 1) + min(ssbns / 4.0, 1)) / 2.0
    undersea = 25.0 * min(ssns / 12.0, 1)
    escort = 20.0 * min(escorts / 24.0, 1)
    support = 15.0 * min(rfa / 12.0, 1)
    constabulary = 10.0 * min(patrol_mcm / 24.0, 1)
    return strategic + undersea + escort + support + constabulary


def get_sea_mass_path_to_green(carriers, ssbns, ssns, escorts, rfa, patrol_mcm, current_score=None):
    """Return minimum needed to reach green (90%). Uses marginal contribution per unit."""
    if current_score is None:
        current_score = _compute_sea_mass_score(carriers, ssbns, ssns, escorts, rfa, patrol_mcm)
    if current_score >= 90.0:
        return ""
    gap = 90.0 - current_score
    options = []
    if carriers < 3:
        gain_per = 30.0 / 2.0 / 3.0
        n = max(1, min(3 - carriers, int(gap / gain_per) + 1))
        options.append((n, "{} more aircraft carrier{}".format(n, "s" if n != 1 else "")))
    if ssbns < 4:
        gain_per = 30.0 / 2.0 / 4.0
        n = max(1, min(4 - ssbns, int(gap / gain_per) + 1))
        options.append((n, "{} more ballistic submarine{}".format(n, "s" if n != 1 else "")))
    if ssns < 12:
        gain_per = 25.0 / 12.0
        n = max(1, min(12 - ssns, int(gap / gain_per) + 1))
        options.append((n, "{} more attack submarine{}".format(n, "s" if n != 1 else "")))
    if escorts < 24:
        gain_per = 20.0 / 24.0
        n = max(1, min(24 - escorts, int(gap / gain_per) + 1))
        options.append((n, "{} more escort{} (frigates and destroyers)".format(n, "s" if n != 1 else "")))
    if rfa < 12:
        gain_per = 15.0 / 12.0
        n = max(1, min(12 - rfa, int(gap / gain_per) + 1))
        options.append((n, "{} more RFA vessel{}".format(n, "s" if n != 1 else "")))
    if patrol_mcm < 24:
        gain_per = 10.0 / 24.0
        n = max(1, min(24 - patrol_mcm, int(gap / gain_per) + 1))
        options.append((n, "{} more patrol and mine warfare vessel{}".format(n, "s" if n != 1 else "")))
    if not options:
        return ""
    options.sort(key=lambda x: x[0])
    best = options[0][1]
    second = options[1][1] if len(options) >= 2 else None
    if second:
        return "To reach green (90%): " + best + " or " + second + "."
    return "To reach green (90%): " + best + "."


def get_land_mass_path_to_green(mbts, afvs, regulars, modern_artillery, ad_batteries, active_reserves, recall_veterans, current_score=None):
    """Return minimum needed to reach green (90%). Uses marginal contribution per unit."""
    if current_score is None:
        arm = 0.35 * (0.6 * min(mbts / 450.0, 1) + 0.4 * min(afvs / 1000.0, 1))
        pers = 0.30 * min(regulars / 150000.0, 1)
        ind = 0.20 * (0.7 * min(modern_artillery / 300.0, 1) + 0.3 * min(ad_batteries / 12.0, 1))
        dep = 0.15 * (0.5 * min(active_reserves / 50000.0, 1) + 0.3 * min(recall_veterans / 30000.0, 1) + 0.2 * 0.9)
        current_score = (arm + pers + ind + dep) * 100.0
    if current_score >= 90.0:
        return ""
    gap = 90.0 - current_score
    options = []
    if mbts < 450:
        gain_per = 35.0 * 0.6 / 450.0
        n = max(1, min(450 - mbts, int(gap / gain_per) + 1))
        options.append((n, "{:,} more main battle tanks".format(n)))
    if afvs < 1000:
        gain_per = 35.0 * 0.4 / 1000.0
        n = max(1, min(1000 - afvs, int(gap / gain_per) + 1))
        options.append((n, "{:,} more armoured fighting vehicles".format(n)))
    if regulars < 150000:
        gain_per = 30.0 / 150000.0
        n = max(1000, min(150000 - regulars, int(gap / gain_per) + 1000))
        n = (n // 1000) * 1000
        if n > 0:
            options.append((n, "{:,}k more full-time trained regulars".format(int(n / 1000))))
    if modern_artillery < 300:
        gain_per = 20.0 * 0.7 / 300.0
        n = max(1, min(300 - modern_artillery, int(gap / gain_per) + 1))
        options.append((n, "{} more modern artillery systems".format(n)))
    if ad_batteries < 12:
        gain_per = 20.0 * 0.3 / 12.0
        n = max(1, min(12 - ad_batteries, int(gap / gain_per) + 1))
        options.append((n, "{} more ground-based air defence batteries".format(n)))
    if active_reserves < 50000:
        gain_per = 15.0 * 0.5 / 50000.0
        n = max(1000, min(50000 - active_reserves, int(gap / gain_per) + 1000))
        n = (n // 1000) * 1000
        if n > 0:
            options.append((n, "{:,}k more active reserves".format(int(n / 1000))))
    if recall_veterans < 30000:
        gain_per = 15.0 * 0.3 / 30000.0
        n = max(1000, min(30000 - recall_veterans, int(gap / gain_per) + 1000))
        n = (n // 1000) * 1000
        if n > 0:
            options.append((n, "{:,}k more recallable veterans".format(int(n / 1000))))
    if not options:
        return ""
    options.sort(key=lambda x: x[0])
    best = options[0][1]
    second = options[1][1] if len(options) >= 2 else None
    if second:
        return "To reach green (90%): " + best + " or " + second + "."
    return "To reach green (90%): " + best + "."


def get_air_mass_path_to_green(fighters, force_multipliers, strategic_lift, autonomous, current_score=None):
    """Return minimum needed to reach green (90%). Uses marginal contribution per unit."""
    if current_score is None:
        combat = 40.0 * min(fighters / 300.0, 1)
        mult = 25.0 * min(force_multipliers / 25.0, 1)
        lift = 20.0 * min(strategic_lift / 40.0, 1)
        auto = 15.0 * min(autonomous / 150.0, 1)
        current_score = combat + mult + lift + auto
    if current_score >= 90.0:
        return ""
    gap = 90.0 - current_score
    options = []
    if fighters < 300:
        gain_per = 40.0 / 300.0
        n = max(1, min(300 - fighters, int(gap / gain_per) + 1))
        options.append((n, "{} more multi-role fighters (Typhoon/F-35B)".format(n)))
    if force_multipliers < 25:
        gain_per = 25.0 / 25.0
        n = max(1, min(25 - force_multipliers, int(gap / gain_per) + 1))
        options.append((n, "{} more force multiplier aircraft (tankers and AEW)".format(n)))
    if strategic_lift < 40:
        gain_per = 20.0 / 40.0
        n = max(1, min(40 - strategic_lift, int(gap / gain_per) + 1))
        options.append((n, "{} more heavy/medium transport aircraft".format(n)))
    if autonomous < 150:
        gain_per = 15.0 / 150.0
        n = max(1, min(150 - autonomous, int(gap / gain_per) + 1))
        options.append((n, "{} more autonomous combat platforms".format(n)))
    if not options:
        return ""
    options.sort(key=lambda x: x[0])
    best = options[0][1]
    second = options[1][1] if len(options) >= 2 else None
    if second:
        return "To reach green (90%): " + best + " or " + second + "."
    return "To reach green (90%): " + best + "."

# Historical estimates: (dataDate, score, information). Path-to-green appended from counts.
# Counts: (carriers, ssbns, ssns, escorts, rfa, patrol_mcm) for path-to-green.
SEA_MASS_DATA = [
    ("2010 Q1", 89, "The score for 2010 Q1 is predominantly driven by the fact the UK had 3 aircraft carriers (Invincible class), "
     "4 ballistic submarines, 8 attack submarines, 22 escorts (frigates and destroyers), 10 RFA vessels, "
     "and 22 patrol and mine warfare vessels. "
     "This metric has reduced versus 2010 largely because the UK has fewer aircraft carriers, "
     "attack submarines, escorts, and patrol vessels than historically.", (3, 4, 8, 22, 10, 22)),
    ("2015 Q1", 70, "The score for 2015 Q1 is predominantly driven by the fact the UK had 0 aircraft carriers (Invincible retired, "
     "Queen Elizabeth class not yet in service), 4 ballistic submarines, 7 attack submarines, "
     "19 escorts (frigates and destroyers), 9 RFA vessels, and 16 patrol and mine warfare vessels. "
     "This metric reduced versus 2010 largely because the Invincible-class carriers were retired "
     "before the Queen Elizabeth class entered service.", (0, 4, 7, 19, 9, 16)),
    ("2020 Q1", 69, "The score for 2020 Q1 is predominantly driven by the fact the UK had 2 aircraft carriers (Queen Elizabeth class), "
     "4 ballistic submarines, 7 attack submarines, 19 escorts (frigates and destroyers), 9 RFA vessels, "
     "and 14 patrol and mine warfare vessels. "
     "This metric has reduced versus previous quarters largely because the UK has fewer attack submarines "
     "and escorts than the Tier 1 benchmark.", (2, 4, 7, 19, 9, 14)),
    ("2023 Q1", 70, "The score for 2023 Q1 is predominantly driven by the fact the UK had 2 aircraft carriers, "
     "4 ballistic submarines, 6 attack submarines, 18 escorts (frigates and destroyers), 9 RFA vessels, "
     "and 14 patrol and mine warfare vessels. "
     "This metric has reduced versus 2010 largely because the UK has fewer attack submarines, "
     "escorts, and patrol vessels than historically.", (2, 4, 6, 18, 9, 14)),
    ("2026 Q1", 68.8, "The score for 2026 Q1 is predominantly driven by the fact the UK has 2 aircraft carriers, "
     "4 ballistic submarines, 6 attack submarines, 17 escorts (frigates and destroyers), 9 RFA vessels, "
     "and 14 patrol and mine warfare vessels. "
     "This metric has reduced versus previous quarters largely because the UK has fewer attack submarines "
     "than historically (6 vs target of 12).", (2, 4, 6, 17, 9, 14)),
]

# Land mass: (dataDate, information, (mbts, afvs, regulars, artillery, ad_batteries, active_reserves, recall_veterans))
LAND_MASS_DATA = [
    ("2010 Q1", "The score for 2010 Q1 is predominantly driven by the fact the UK had approximately 400 main battle tanks, "
     "1,200 armoured fighting vehicles, 102,000 full-time trained regulars, 120 modern artillery systems, "
     "12 ground-based air defence batteries, 38,000 active reserves, and approximately 35,000 recallable veterans. "
     "This metric has reduced versus 2010 largely because the UK has fewer main battle tanks, regular personnel, "
     "artillery systems, and active reserves than historically.", (400, 1200, 102000, 120, 12, 38000, 35000)),
    ("2015 Q1", "The score for 2015 Q1 is predominantly driven by the fact the UK had approximately 330 main battle tanks, "
     "1,100 armoured fighting vehicles, 82,000 full-time trained regulars, 90 modern artillery systems, "
     "10 ground-based air defence batteries, 32,000 active reserves, and approximately 28,000 recallable veterans. "
     "This metric reduced versus 2010 largely because of the Army 2020 restructuring and personnel drawdown.", (330, 1100, 82000, 90, 10, 32000, 28000)),
    ("2020 Q1", "The score for 2020 Q1 is predominantly driven by the fact the UK had approximately 300 main battle tanks, "
     "1,080 armoured fighting vehicles, 78,000 full-time trained regulars, 80 modern artillery systems, "
     "8 ground-based air defence batteries, 30,000 active reserves, and approximately 26,000 recallable veterans. "
     "This metric has reduced versus previous quarters largely because the UK has fewer regular personnel "
     "and active reserves than the Tier 1 benchmark.", (300, 1080, 78000, 80, 8, 30000, 26000)),
    ("2023 Q1", "The score for 2023 Q1 is predominantly driven by the fact the UK had approximately 288 main battle tanks, "
     "1,055 armoured fighting vehicles, 76,000 full-time trained regulars, 75 modern artillery systems, "
     "7 ground-based air defence batteries, 29,000 active reserves, and approximately 25,000 recallable veterans. "
     "This metric has reduced versus 2010 largely because of sustained personnel and equipment reductions.", (288, 1055, 76000, 75, 7, 29000, 25000)),
    ("2026 Q1", "The score for 2026 Q1 is predominantly driven by the fact the UK has 288 main battle tanks, "
     "1,055 armoured fighting vehicles, 125,680 full-time trained regulars, 75 modern artillery systems, "
     "7 ground-based air defence batteries, 29,000 active reserves, and approximately 25,000 recallable veterans. "
     "This metric has reduced versus previous quarters largely because the UK has fewer regular personnel "
     "and active reserves than the Tier 1 benchmark.", (288, 1055, 125680, 75, 7, 29000, 25000)),
]

# Air mass: (dataDate, information, (fighters, force_multipliers, strategic_lift, autonomous))
AIR_MASS_DATA = [
    ("2010 Q1", "The score for 2010 Q1 is predominantly driven by the fact the UK had approximately 150 mission-ready multi-role fighters, "
     "18 force multiplier aircraft (tankers and AEW), 35 heavy/medium transport aircraft, "
     "and 0 autonomous combat platforms.", (150, 18, 35, 0)),
    ("2015 Q1", "The score for 2015 Q1 is predominantly driven by the fact the UK had approximately 140 mission-ready multi-role fighters, "
     "17 force multiplier aircraft (tankers and AEW), 32 heavy/medium transport aircraft, "
     "and 0 autonomous combat platforms.", (140, 17, 32, 0)),
    ("2020 Q1", "The score for 2020 Q1 is predominantly driven by the fact the UK had approximately 130 mission-ready multi-role fighters, "
     "17 force multiplier aircraft (tankers and AEW), 30 heavy/medium transport aircraft, "
     "and 0 autonomous combat platforms.", (130, 17, 30, 0)),
    ("2023 Q1", "The score for 2023 Q1 is predominantly driven by the fact the UK had approximately 125 mission-ready multi-role fighters, "
     "17 force multiplier aircraft (tankers and AEW), 30 heavy/medium transport aircraft, "
     "and 0 autonomous combat platforms.", (125, 17, 30, 0)),
    ("2026 Q1", "The score for 2026 Q1 is predominantly driven by the fact the UK has 120 mission-ready multi-role fighters, "
     "17 force multiplier aircraft (tankers and AEW), 30 heavy/medium transport aircraft, "
     "and 0 autonomous combat platforms.", (120, 17, 30, 0)),
]


def main():
    url = os.environ.get("DATABASE_URL") or os.environ.get("MONGODB_URI") or "mongodb://localhost:27017/uk_rag_portal"
    client = MongoClient(url)
    # Use database from URI path (mongodb://host:port/dbname) or default
    db_name = "uk_rag_portal"
    if "/" in url:
        path = url.split("?")[0].rstrip("/")
        if path.count("/") >= 3:  # mongodb://host/db or mongodb://host:port/db
            db_name = path.split("/")[-1] or db_name
    db = client[db_name]
    coll = db["metricHistory"]

    updated_sea = 0
    for data_date, score, information, counts in SEA_MASS_DATA:
        path = get_sea_mass_path_to_green(
            carriers=counts[0], ssbns=counts[1], ssns=counts[2],
            escorts=counts[3], rfa=counts[4], patrol_mcm=counts[5],
            current_score=float(score),
        )
        full_info = information + ("\n\n" + path if path else "")
        result = coll.update_many(
            {"metricKey": "sea_mass", "dataDate": data_date},
            {"$set": {"information": full_info}},
        )
        if result.modified_count > 0 or result.matched_count > 0:
            updated_sea += result.matched_count
            print(f"  sea_mass {data_date}: {result.matched_count} doc(s)")

    updated_land = 0
    for data_date, information, counts in LAND_MASS_DATA:
        path = get_land_mass_path_to_green(
            mbts=counts[0], afvs=counts[1], regulars=counts[2],
            modern_artillery=counts[3], ad_batteries=counts[4],
            active_reserves=counts[5], recall_veterans=counts[6],
        )
        full_info = information + ("\n\n" + path if path else "")
        result = coll.update_many(
            {"metricKey": "land_mass", "dataDate": data_date},
            {"$set": {"information": full_info}},
        )
        if result.modified_count > 0 or result.matched_count > 0:
            updated_land += result.matched_count
            print(f"  land_mass {data_date}: {result.matched_count} doc(s)")

    updated_air = 0
    for data_date, information, counts in AIR_MASS_DATA:
        path = get_air_mass_path_to_green(
            fighters=counts[0], force_multipliers=counts[1],
            strategic_lift=counts[2], autonomous=counts[3],
        )
        full_info = information + ("\n\n" + path if path else "")
        result = coll.update_many(
            {"metricKey": "air_mass", "dataDate": data_date},
            {"$set": {"information": full_info}},
        )
        if result.modified_count > 0 or result.matched_count > 0:
            updated_air += result.matched_count
            print(f"  air_mass {data_date}: {result.matched_count} doc(s)")

    print(f"\nDone. Updated {updated_sea} sea_mass, {updated_land} land_mass, {updated_air} air_mass history document(s) with information.")
    client.close()


if __name__ == "__main__":
    main()
