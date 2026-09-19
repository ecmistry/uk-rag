#!/usr/bin/env python3
"""Render the free-source high-street Markdown report as a styled PDF."""

from __future__ import annotations

import html
import os
import re
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "uk-high-street-health-report-free.md"
OUTPUT = ROOT / "UK-High-Street-Health-Regional-Review.pdf"

NAVY = HexColor("#0B1F3A")
TEAL = HexColor("#176B6B")
GOLD = HexColor("#C4A35A")
INK = HexColor("#20242A")
MUTED = HexColor("#59636E")
RULE = HexColor("#D7D2C8")
PALE = HexColor("#F6F3EC")
ROW = HexColor("#EEF4F4")
GREEN = HexColor("#2A6F62")

PAGE_W, PAGE_H = A4


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "ReportTitle",
            fontName="Helvetica-Bold",
            fontSize=25,
            leading=29,
            textColor=white,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "ReportSubtitle",
            fontName="Helvetica",
            fontSize=13,
            leading=17,
            textColor=white,
        )
    )
    styles.add(
        ParagraphStyle(
            "H1Free",
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            "H2Free",
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=TEAL,
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            "H3Free",
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=NAVY,
            spaceBefore=6,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            "BodyFree",
            fontName="Helvetica",
            fontSize=8.8,
            leading=12.2,
            textColor=INK,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            "BulletFree",
            parent=styles["BodyFree"],
            leftIndent=11,
            firstLineIndent=-8,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            "TableHeadFree",
            fontName="Helvetica-Bold",
            fontSize=6.7,
            leading=8.2,
            textColor=white,
        )
    )
    styles.add(
        ParagraphStyle(
            "TableCellFree",
            fontName="Helvetica",
            fontSize=6.5,
            leading=8.1,
            textColor=INK,
        )
    )
    styles.add(
        ParagraphStyle(
            "RefFree",
            fontName="Helvetica",
            fontSize=6.9,
            leading=9.2,
            textColor=MUTED,
            leftIndent=12,
            firstLineIndent=-12,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            "CalloutFree",
            parent=styles["BodyFree"],
            fontName="Helvetica-Bold",
            textColor=NAVY,
            borderColor=GOLD,
            borderWidth=0.8,
            borderPadding=7,
            backColor=PALE,
            spaceBefore=4,
            spaceAfter=8,
        )
    )
    return styles


STYLES = make_styles()


def inline_markup(text: str) -> str:
    """Convert the small Markdown subset used by the report to ReportLab markup."""
    escaped = html.escape(text.strip(), quote=False)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"\*(.+?)\*", r"<i>\1</i>", escaped)
    escaped = re.sub(
        r"(https?://[^\s<]+)",
        r'<link href="\1" color="#176B6B">\1</link>',
        escaped,
    )
    return escaped


def is_separator(row: str) -> bool:
    cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def table_widths(rows: list[list[str]], available: float) -> list[float]:
    columns = max(len(row) for row in rows)
    scores = [1.0] * columns
    for col in range(columns):
        values = [row[col] if col < len(row) else "" for row in rows]
        longest = max((len(re.sub(r"<[^>]+>", "", value)) for value in values), default=8)
        scores[col] = min(max(longest, 10), 42)
    total = sum(scores)
    widths = [available * score / total for score in scores]
    minimum = 23 * mm
    shortfall = sum(max(0, minimum - width) for width in widths)
    if shortfall:
        donors = [i for i, width in enumerate(widths) if width > minimum]
        for i, width in enumerate(widths):
            if width < minimum:
                widths[i] = minimum
        donor_total = sum(max(0, widths[i] - minimum) for i in donors)
        if donor_total:
            for i in donors:
                widths[i] -= shortfall * (widths[i] - minimum) / donor_total
    return widths


def build_table(raw_rows: list[str], available: float):
    rows: list[list[str]] = []
    for raw in raw_rows:
        if is_separator(raw):
            continue
        rows.append([inline_markup(cell) for cell in raw.strip().strip("|").split("|")])
    columns = max(len(row) for row in rows)
    for row in rows:
        row.extend([""] * (columns - len(row)))
    data = []
    for row_index, row in enumerate(rows):
        style = STYLES["TableHeadFree"] if row_index == 0 else STYLES["TableCellFree"]
        data.append([Paragraph(cell, style) for cell in row])
    table = Table(data, colWidths=table_widths(rows, available), repeatRows=1, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.25, RULE),
    ]
    for row_index in range(1, len(data)):
        commands.append(
            ("BACKGROUND", (0, row_index), (-1, row_index), ROW if row_index % 2 == 0 else PALE)
        )
    table.setStyle(TableStyle(commands))
    return table


def parse_markdown(source: str, available: float):
    lines = source.splitlines()
    story = []
    paragraph: list[str] = []
    table_rows: list[str] = []
    in_references = False

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            text = " ".join(part.strip() for part in paragraph)
            style = "CalloutFree" if text.startswith("**Evidence rule:**") else "BodyFree"
            story.append(Paragraph(inline_markup(text), STYLES[style]))
            paragraph = []

    def flush_table():
        nonlocal table_rows
        if table_rows:
            story.append(build_table(table_rows, available))
            story.append(Spacer(1, 3 * mm))
            table_rows = []

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("|"):
            flush_paragraph()
            table_rows.append(stripped)
            continue
        flush_table()

        if not stripped:
            flush_paragraph()
            continue
        if stripped == "---":
            flush_paragraph()
            story.append(HRFlowable(width="100%", thickness=0.5, color=RULE, spaceAfter=5))
            continue
        if stripped.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["H1Free"]))
            continue
        if stripped.startswith("## "):
            flush_paragraph()
            heading = stripped[3:]
            in_references = heading == "References"
            if heading not in {"A free-source regional and sector review"}:
                story.append(PageBreak() if heading in {"3. Region-by-region free evidence"} else Spacer(1, 1))
                story.append(Paragraph(inline_markup(heading), STYLES["H1Free"]))
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[4:]), STYLES["H2Free"]))
            continue
        if re.match(r"^\[\d+\]\s", stripped):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped), STYLES["RefFree"]))
            continue
        if re.match(r"^\d+\.\s", stripped):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped), STYLES["BulletFree"]))
            continue
        if stripped.startswith("- "):
            flush_paragraph()
            story.append(Paragraph("• " + inline_markup(stripped[2:]), STYLES["BulletFree"]))
            continue
        if in_references:
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped), STYLES["RefFree"]))
            continue
        paragraph.append(stripped)

    flush_paragraph()
    flush_table()
    return story


def header_footer(canvas, document):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 13 * mm, PAGE_W, 13 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 1 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.drawString(16 * mm, PAGE_H - 8.5 * mm, "FREE-SOURCE BRIEFING FOR RORY")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(PAGE_W - 16 * mm, PAGE_H - 8.5 * mm, "UK HIGH STREETS · SEPTEMBER 2026")
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, 11 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(16 * mm, 4.2 * mm, "ONS · councils · LPS · open registers · free property research")
    canvas.drawRightString(PAGE_W - 16 * mm, 4.2 * mm, f"Page {document.page}")
    canvas.restoreState()


def cover(canvas, document):
    header_footer(canvas, document)
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 28 * mm, PAGE_W, PAGE_H - 42 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(17 * mm, PAGE_H - 55 * mm, 31 * mm, 2 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(17 * mm, PAGE_H - 68 * mm, "FREE-SOURCE EDITION")
    canvas.setFont("Helvetica-Bold", 25)
    canvas.drawString(17 * mm, PAGE_H - 91 * mm, "The Health of UK")
    canvas.drawString(17 * mm, PAGE_H - 103 * mm, "High Streets")
    canvas.setFont("Helvetica", 12)
    canvas.drawString(17 * mm, PAGE_H - 122 * mm, "Regional footfall, local vacancy and the role of")
    canvas.drawString(17 * mm, PAGE_H - 130 * mm, "vape shops, barbers and charity shops")
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.drawString(17 * mm, 54 * mm, "NO PAID DATASETS · NO MEMBER-ONLY TABLES")
    canvas.setFillColor(white)
    canvas.setFont("Helvetica", 9)
    canvas.drawString(17 * mm, 46 * mm, "Rebuilt September 2026 · All 12 UK nations and English regions")
    canvas.restoreState()


def generate():
    source = SOURCE.read_text(encoding="utf-8")
    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=19 * mm,
        bottomMargin=16 * mm,
        title="The Health of UK High Streets — Free-Source Regional Review",
        author="Briefing for Rory",
        subject="UK high-street footfall, vacancy, vape shops, barbers and charity shops",
    )
    available = PAGE_W - document.leftMargin - document.rightMargin
    story = [Spacer(1, 164 * mm), PageBreak()]
    story.extend(parse_markdown(source, available))
    document.build(story, onFirstPage=cover, onLaterPages=header_footer)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    generate()
