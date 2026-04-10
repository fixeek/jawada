"""
PDF Report Generator — branded Jawda KPI reports for clinic management and DOH auditors.
Uses xhtml2pdf (pure Python, no system deps) to render HTML templates to PDF.
"""
import io
import hashlib
from datetime import datetime
from xhtml2pdf import pisa


def _verdict_color(verdict):
    return {"ready": "#059669", "attention": "#D97706", "not_ready": "#DC2626"}.get(verdict, "#475569")


def _verdict_label(verdict):
    return {"ready": "Ready for Submission", "attention": "Needs Attention", "not_ready": "Not Ready"}.get(verdict, "Unknown")


def _status_label(status):
    return {
        "calculated": "Calculated",
        "proxy": "Proxy",
        "insufficient_data": "Insufficient Data",
        "not_applicable": "N/A",
    }.get(status, status)


def _result_color(kpi):
    if kpi.get("meets_target") is True:
        return "#059669"
    if kpi.get("meets_target") is False:
        return "#DC2626"
    if kpi.get("status") == "not_applicable":
        return "#2563EB"
    return "#6B7280"


def _result_label(kpi):
    if kpi.get("meets_target") is True:
        return "PASS"
    if kpi.get("meets_target") is False:
        return "FAIL"
    if kpi.get("status") == "not_applicable":
        return "N/A"
    if kpi.get("status") == "insufficient_data":
        return "NO DATA"
    return "PROXY"


ACTION_FIXES = {
    "OMC001": "Add drug_name column with medication names from pharmacy dispensing system.",
    "OMC002": "Include prescription data — drug names within 3 days of bronchitis visits.",
    "OMC003": "Set up check-in app to capture registration + consult-start timestamps.",
    "OMC004": "Add management_plan field — doctors must document BMI counselling plans.",
    "OMC005": "Integrate HbA1c lab results (CPT 83036) into HIS export.",
    "OMC006": "Ensure hypertension patients have confirmed ICD codes (I10-I13).",
    "OMC007": "Add days_supplied to pharmacy export for threshold calculations.",
    "OMC008": "Integrate eGFR and uACR lab results into HIS export.",
}


def generate_report_html(facility_name, quarter, kpis, summary, history=None,
                          generated_by="", branding=None):
    """Generate branded HTML report content."""
    now = datetime.now()
    na = summary.get("not_applicable", 0)
    meeting = summary.get("meeting_target", 0)
    below = summary.get("below_target", 0)
    insuff = summary.get("missing_data", 0)
    verdict = summary.get("verdict", "not_ready")
    readiness = summary.get("readiness_pct", 0)

    # KPI rows
    kpi_rows = ""
    action_rows = ""
    kpi_order = ["OMC001", "OMC002", "OMC003", "OMC004", "OMC005", "OMC006", "OMC007", "OMC008"]
    for kpi_id in kpi_order:
        k = kpis.get(kpi_id, {})
        pct = f"{k.get('percentage', 0)}%" if k.get("denominator", 0) > 0 else "—"
        num = k.get("numerator", 0)
        den = k.get("denominator", 0)
        target = k.get("target", 0)
        direction = k.get("target_direction", "higher")
        dir_symbol = "≤" if direction == "lower" else "≥"
        result = _result_label(k)
        color = _result_color(k)

        kpi_rows += f"""
        <tr>
            <td style="font-weight:800; color:#0D2137;">{kpi_id}</td>
            <td>{k.get('title', '')}</td>
            <td style="text-align:center;">{k.get('domain', '')}</td>
            <td style="text-align:center; font-weight:700;">{num}</td>
            <td style="text-align:center; font-weight:700;">{den}</td>
            <td style="text-align:center; font-weight:800;">{pct}</td>
            <td style="text-align:center;">{dir_symbol}{target}%</td>
            <td style="text-align:center; font-weight:800; color:{color};">{result}</td>
        </tr>"""

        # Action items for failing KPIs
        if k.get("meets_target") is False:
            gap = k.get("gap_patients", 0)
            fix = ACTION_FIXES.get(kpi_id, "Review data quality and completeness.")
            action_rows += f"""
            <tr>
                <td style="font-weight:800; color:#0D2137;">{kpi_id}</td>
                <td>{k.get('title', '')}</td>
                <td style="text-align:center; font-weight:700; color:#DC2626;">{pct}</td>
                <td style="text-align:center;">{dir_symbol}{target}%</td>
                <td style="text-align:center; font-weight:700;">{gap}</td>
                <td style="font-size:9px;">{fix}</td>
            </tr>"""

    # Trend section (if history available)
    trend_section = ""
    if history and len(history) > 1:
        trend_rows = ""
        sorted_q = sorted(history.keys())
        for q in sorted_q:
            h = history[q]
            s = h.get("jawda_summary", {})
            m = s.get("meeting_target", 0)
            n = s.get("not_applicable", 0)
            v = s.get("verdict", "")
            trend_rows += f"""
            <tr>
                <td style="font-weight:700;">{q}</td>
                <td style="text-align:center;">{m}/8</td>
                <td style="text-align:center; color:{_verdict_color(v)}; font-weight:700;">{_verdict_label(v)}</td>
            </tr>"""
        trend_section = f"""
        <div style="margin-top:20px;">
            <h3 style="color:#0D2137; font-size:13px; margin-bottom:8px;">Quarter History</h3>
            <table>
                <thead><tr>
                    <th style="text-align:left;">Quarter</th>
                    <th>Passing</th>
                    <th>Verdict</th>
                </tr></thead>
                <tbody>{trend_rows}</tbody>
            </table>
        </div>"""

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4;
                margin: 1.5cm;
            }}
            body {{
                font-family: Helvetica, Arial, sans-serif;
                font-size: 10px;
                color: #374151;
                line-height: 1.4;
            }}
            .header {{
                background: linear-gradient(135deg, #0D2137, #1a3a5c);
                color: white;
                padding: 20px 25px;
                border-radius: 8px;
                margin-bottom: 15px;
            }}
            .header h1 {{
                font-size: 20px;
                margin: 0 0 3px 0;
                font-weight: 900;
            }}
            .header .sub {{
                font-size: 11px;
                opacity: 0.7;
            }}
            .header .badge {{
                display: inline-block;
                background: rgba(255,255,255,0.15);
                padding: 3px 10px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 700;
                margin-top: 8px;
            }}
            .verdict-box {{
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 15px;
                border: 1px solid #e5e7eb;
            }}
            .verdict-box h2 {{
                font-size: 16px;
                font-weight: 900;
                margin: 0 0 4px 0;
            }}
            .verdict-box .detail {{
                font-size: 10px;
                color: #6B7280;
            }}
            .stats {{
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }}
            .stat-card {{
                flex: 1;
                background: #F9FAFB;
                border: 1px solid #E5E7EB;
                border-radius: 6px;
                padding: 10px;
                text-align: center;
            }}
            .stat-card .num {{
                font-size: 22px;
                font-weight: 900;
                color: #0D2137;
            }}
            .stat-card .label {{
                font-size: 8px;
                color: #9CA3AF;
                text-transform: uppercase;
                font-weight: 700;
                letter-spacing: 0.5px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
            }}
            th {{
                background: #F3F4F6;
                color: #6B7280;
                font-size: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 700;
                padding: 6px 8px;
                text-align: left;
                border-bottom: 1px solid #E5E7EB;
            }}
            td {{
                padding: 6px 8px;
                border-bottom: 1px solid #F3F4F6;
            }}
            tr:nth-child(even) {{
                background: #FAFAFA;
            }}
            .section {{
                margin-top: 20px;
            }}
            .section h3 {{
                color: #0D2137;
                font-size: 13px;
                font-weight: 800;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 2px solid #14B8A6;
                display: inline-block;
            }}
            .footer {{
                margin-top: 25px;
                padding-top: 10px;
                border-top: 1px solid #E5E7EB;
                font-size: 8px;
                color: #9CA3AF;
                text-align: center;
            }}
            .footer strong {{
                color: #6B7280;
            }}
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1>{facility_name}</h1>
            <div class="sub">DOH Jawda KPI Report — {quarter}</div>
            <span class="badge">ADHICS V2 Compliant · UAE North · DOH Guidance V2 2026</span>
        </div>

        <!-- Verdict -->
        <div class="verdict-box" style="background:{_verdict_color(verdict)}10; border-color:{_verdict_color(verdict)}30;">
            <h2 style="color:{_verdict_color(verdict)};">{_verdict_label(verdict)}</h2>
            <div class="detail">
                {meeting} of 8 KPIs passing · {below} below target · {na} not applicable · {insuff} insufficient data
                · Readiness: {readiness}%
            </div>
        </div>

        <!-- Summary Stats -->
        <table style="margin-bottom:15px;">
            <tr>
                <td style="text-align:center; padding:10px; background:#ECFDF5; border-radius:6px; border:1px solid #A7F3D0;">
                    <div style="font-size:22px; font-weight:900; color:#059669;">{meeting}</div>
                    <div style="font-size:8px; color:#6B7280; text-transform:uppercase; font-weight:700;">Passing</div>
                </td>
                <td style="width:8px;"></td>
                <td style="text-align:center; padding:10px; background:#FEF2F2; border-radius:6px; border:1px solid #FECACA;">
                    <div style="font-size:22px; font-weight:900; color:#DC2626;">{below}</div>
                    <div style="font-size:8px; color:#6B7280; text-transform:uppercase; font-weight:700;">Below Target</div>
                </td>
                <td style="width:8px;"></td>
                <td style="text-align:center; padding:10px; background:#EFF6FF; border-radius:6px; border:1px solid #BFDBFE;">
                    <div style="font-size:22px; font-weight:900; color:#2563EB;">{na}</div>
                    <div style="font-size:8px; color:#6B7280; text-transform:uppercase; font-weight:700;">N/A</div>
                </td>
                <td style="width:8px;"></td>
                <td style="text-align:center; padding:10px; background:#F9FAFB; border-radius:6px; border:1px solid #E5E7EB;">
                    <div style="font-size:22px; font-weight:900; color:#0D2137;">{readiness}%</div>
                    <div style="font-size:8px; color:#6B7280; text-transform:uppercase; font-weight:700;">Readiness</div>
                </td>
            </tr>
        </table>

        <!-- KPI Results Table -->
        <div class="section">
            <h3>KPI Results — {quarter}</h3>
            <table>
                <thead><tr>
                    <th>KPI</th><th>Title</th><th>Domain</th>
                    <th style="text-align:center;">Num</th><th style="text-align:center;">Den</th>
                    <th style="text-align:center;">Rate</th><th style="text-align:center;">Target</th>
                    <th style="text-align:center;">Result</th>
                </tr></thead>
                <tbody>{kpi_rows}</tbody>
            </table>
        </div>

        <!-- Action Plan -->
        {"" if not action_rows else f'''
        <div class="section">
            <h3>Action Plan</h3>
            <table>
                <thead><tr>
                    <th>KPI</th><th>Title</th><th style="text-align:center;">Current</th>
                    <th style="text-align:center;">Target</th><th style="text-align:center;">Gap</th>
                    <th>How to Fix</th>
                </tr></thead>
                <tbody>{action_rows}</tbody>
            </table>
        </div>'''}

        {trend_section}

        <!-- Footer -->
        <div class="footer">
            Generated by <strong>Jawda KPI Platform</strong> by TriZodiac ·
            {now.strftime("%d %b %Y %H:%M")} ·
            {f"by {generated_by} · " if generated_by else ""}
            ADHICS V2 Compliant · UAE North Data Region ·
            DOH Outpatient Medical Centers Jawda Guidance V2 2026
        </div>
    </body>
    </html>
    """
    return html


def generate_pdf(facility_name, quarter, kpis, summary, history=None,
                  generated_by="", branding=None):
    """Generate PDF bytes from KPI results."""
    html = generate_report_html(facility_name, quarter, kpis, summary,
                                 history, generated_by, branding)
    buffer = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.StringIO(html), dest=buffer)
    if pisa_status.err:
        raise RuntimeError(f"PDF generation failed: {pisa_status.err}")
    pdf_bytes = buffer.getvalue()
    report_hash = hashlib.sha256(pdf_bytes).hexdigest()[:16]
    return pdf_bytes, report_hash
