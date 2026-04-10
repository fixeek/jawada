"""
Smart Recommendations Engine — rules-based, actionable suggestions per KPI.
Analyzes KPI results and generates specific, patient-level recommendations
that tell the clinic exactly what to do to improve their scores.
"""


def generate_recommendations(kpis: dict, summary: dict) -> list:
    """Generate actionable recommendations from KPI results.
    Returns a list of recommendation dicts sorted by impact (highest first)."""
    recs = []

    for kpi_id, k in kpis.items():
        if kpi_id.startswith("ERROR"):
            continue

        status = k.get("status", "")
        meets = k.get("meets_target")
        num = k.get("numerator", 0)
        den = k.get("denominator", 0)
        pct = k.get("percentage", 0)
        target = k.get("target", 0)
        gap = k.get("gap_patients", 0)
        direction = k.get("target_direction", "higher")
        missing = k.get("missing_fields", [])
        title = k.get("title", kpi_id)

        # Skip N/A KPIs
        if status in ("not_applicable", "insufficient_data"):
            if status == "insufficient_data" and missing:
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "data_gap",
                    "priority": "medium",
                    "impact": 0,
                    "title": f"Add missing data for {kpi_id}",
                    "description": f"{title} cannot be calculated because your data is missing: {', '.join(missing)}.",
                    "action": f"Contact your HIS vendor to include these fields in your export: {', '.join(missing)}.",
                    "projected_impact": "This KPI will become calculable once the data is available.",
                })
            continue

        # Already passing — celebrate but suggest maintaining
        if meets is True:
            if den > 0 and pct < target + 10:
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "maintain",
                    "priority": "low",
                    "impact": 0,
                    "title": f"{kpi_id} is passing — maintain vigilance",
                    "description": f"{title} is at {pct}% (target {'>=' if direction == 'higher' else '<='}{target}%). "
                                   f"You're passing but only by {abs(pct - target):.1f} percentage points.",
                    "action": "Continue current practices. A small decline could push this KPI below target.",
                    "projected_impact": f"Currently {num}/{den} patients meeting criteria.",
                })
            continue

        # Below target — generate specific recommendations
        if meets is False and den > 0:
            # Calculate what it would take to pass
            if direction == "lower":
                max_num = int(den * target / 100)
                needed = num - max_num
                new_pct = round(max_num / den * 100, 1) if den > 0 else 0
            else:
                min_num = int(den * target / 100) + 1
                needed = min_num - num
                new_pct = round(min_num / den * 100, 1) if den > 0 else 0

            if needed <= 0:
                needed = 1

            # KPI-specific recommendations
            if kpi_id == "OMC003":
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "process",
                    "priority": "high" if gap > 20 else "medium",
                    "impact": gap,
                    "title": f"Reduce wait times for {gap} patients",
                    "description": f"{den - num} patients waited over 60 minutes. "
                                   f"Current rate: {pct}% (target >={target}%).",
                    "action": "Review peak-hour scheduling. Consider staggering appointments, "
                              "adding triage staff during busy periods, or implementing a queue management system.",
                    "projected_impact": f"Reducing {needed} patient wait times below 60 min → {new_pct}% (PASS).",
                })

            elif kpi_id == "OMC004":
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "documentation",
                    "priority": "high",
                    "impact": gap,
                    "title": f"Document BMI management plans for {gap} patients",
                    "description": f"{den} patients have BMI >= 25 but {den - num} don't have documented management plans. "
                                   f"Current rate: {pct}% (target >={target}%).",
                    "action": "Add a 'Management Plan' field to physician encounter screens. "
                              "Doctors should document nutrition counselling and follow-up plans for overweight patients. "
                              "This is often a documentation gap, not a care gap.",
                    "projected_impact": f"Documenting plans for {needed} more patients → {new_pct}% (PASS).",
                })

            elif kpi_id == "OMC005":
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "clinical",
                    "priority": "high" if gap > 3 else "medium",
                    "impact": gap,
                    "title": f"Improve HbA1c control for {gap} diabetic patients",
                    "description": f"{num} of {den} diabetic patients have HbA1c <= 8.0%. "
                                   f"{den - num} patients are above threshold. Current rate: {pct}% (target >={target}%).",
                    "action": "Review uncontrolled patients' medication adherence and lifestyle management. "
                              "Consider: medication adjustment, diabetes educator referral, more frequent monitoring. "
                              "Focus on patients closest to the 8.0% threshold first (easiest wins).",
                    "projected_impact": f"Getting {needed} more patients to HbA1c <= 8.0% → {new_pct}% (PASS).",
                })

            elif kpi_id == "OMC006":
                borderline = []
                for pd in k.get("patient_details", []):
                    if not pd.get("controlled") and pd.get("systolic") and pd.get("diastolic"):
                        sys, dia = pd["systolic"], pd["diastolic"]
                        if sys <= 145 and dia <= 95:
                            borderline.append(pd)

                recs.append({
                    "kpi_id": kpi_id,
                    "type": "clinical",
                    "priority": "high" if gap > 3 else "medium",
                    "impact": gap,
                    "title": f"Control blood pressure for {gap} HTN patients",
                    "description": f"{num} of {den} HTN patients have BP < 130/80. "
                                   f"{den - num} are uncontrolled. Current rate: {pct}% (target >={target}%)."
                                   + (f" {len(borderline)} patients are borderline (BP 130-145/80-95) — easiest to improve." if borderline else ""),
                    "action": "Review uncontrolled patients' antihypertensive medications. "
                              "Consider: dose adjustment, combination therapy, lifestyle counselling (salt restriction, exercise). "
                              + (f"Start with the {len(borderline)} borderline patients who are closest to the 130/80 target." if borderline else ""),
                    "projected_impact": f"Controlling BP for {needed} more patients → {new_pct}% (PASS).",
                })

            elif kpi_id == "OMC008":
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "lab_integration",
                    "priority": "high" if den > 50 else "medium",
                    "impact": gap,
                    "title": f"Complete kidney monitoring for {gap} patients",
                    "description": f"{den} patients have eGFR < 90 but only {num} have both eGFR and uACR tested. "
                                   f"Current rate: {pct}% (target >={target}%).",
                    "action": "Most likely issue: uACR (urine albumin-creatinine ratio) tests are not being ordered "
                              "or results are not in the data export. Contact your lab to ensure uACR results are "
                              "included alongside eGFR in the HIS export.",
                    "projected_impact": f"Adding uACR monitoring for {needed} more patients → {new_pct}% (PASS).",
                })

            else:
                # Generic recommendation for other KPIs
                recs.append({
                    "kpi_id": kpi_id,
                    "type": "improvement",
                    "priority": "medium",
                    "impact": gap,
                    "title": f"Improve {kpi_id} — {gap} patient gap",
                    "description": f"{title}: {pct}% vs target {'<=' if direction == 'lower' else '>='}{target}%. "
                                   f"Gap of {gap} patients.",
                    "action": f"Review the {gap} patients not meeting criteria and identify common factors.",
                    "projected_impact": f"Fixing {needed} patients → {new_pct}% (PASS).",
                })

        # Proxy status recommendations
        if status == "proxy":
            recs.append({
                "kpi_id": kpi_id,
                "type": "data_gap",
                "priority": "medium",
                "impact": 0,
                "title": f"{kpi_id} using proxy data — upgrade for official scoring",
                "description": f"{title} is calculated from incomplete data (proxy). "
                               f"Missing: {', '.join(missing) if missing else 'additional fields needed'}.",
                "action": "Add the missing data fields to get an official DOH-accepted score instead of a proxy.",
                "projected_impact": "Official scoring will be used for DOH submission instead of proxy estimates.",
            })

    # Sort: high priority first, then by impact (gap patients)
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recs.sort(key=lambda r: (priority_order.get(r["priority"], 1), -r.get("impact", 0)))

    return recs


def generate_predictions(history: dict) -> list:
    """Analyze quarter-over-quarter trends to predict future KPI performance."""
    preds = []
    quarters = sorted(history.keys())
    if len(quarters) < 2:
        return preds

    current_q = quarters[-1]
    prev_q = quarters[-2]
    current_kpis = history[current_q].get("kpis", {})
    prev_kpis = history[prev_q].get("kpis", {})

    for kpi_id, curr in current_kpis.items():
        prev = prev_kpis.get(kpi_id)
        if not prev:
            continue

        curr_den = curr.get("denominator", 0)
        prev_den = prev.get("denominator", 0)
        if curr_den == 0 or prev_den == 0:
            continue

        curr_pct = curr.get("percentage", 0)
        prev_pct = prev.get("percentage", 0)
        target = curr.get("target", 0)
        direction = curr.get("target_direction", "higher")
        delta = curr_pct - prev_pct

        # Predict next quarter by extending the trend
        projected = round(curr_pct + delta, 1)

        # Check if trend is heading toward failure
        currently_passing = curr.get("meets_target") is True
        if direction == "higher":
            will_fail = currently_passing and projected < target
            will_pass = not currently_passing and projected >= target
        else:
            will_fail = currently_passing and projected > target
            will_pass = not currently_passing and projected <= target

        if will_fail:
            preds.append({
                "kpi_id": kpi_id,
                "type": "declining",
                "title": f"{kpi_id} at risk — declining trend",
                "description": f"{curr.get('title', kpi_id)} dropped from {prev_pct}% to {curr_pct}% "
                               f"({prev_q} → {current_q}). If this trend continues, "
                               f"next quarter could be ~{projected}% (below {target}% target).",
                "trend": delta,
                "projected": projected,
            })
        elif will_pass and abs(delta) > 2:
            preds.append({
                "kpi_id": kpi_id,
                "type": "improving",
                "title": f"{kpi_id} trending toward PASS",
                "description": f"{curr.get('title', kpi_id)} improved from {prev_pct}% to {curr_pct}% "
                               f"({prev_q} → {current_q}). At this rate, next quarter "
                               f"could reach ~{projected}% (target {'<=' if direction == 'lower' else '>='}{target}%).",
                "trend": delta,
                "projected": projected,
            })
        elif not currently_passing and delta < -2:
            preds.append({
                "kpi_id": kpi_id,
                "type": "worsening",
                "title": f"{kpi_id} getting worse",
                "description": f"{curr.get('title', kpi_id)} declined from {prev_pct}% to {curr_pct}% "
                               f"and is already below target. Immediate attention needed.",
                "trend": delta,
                "projected": projected,
            })

    return preds
