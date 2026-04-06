# Jawda KPI Platform — by TriZodiac

## What this project is
A web-based Jawda KPI reporting platform for UAE outpatient medical clinics.
Clinics upload their HIS data exports (up to 4 files per quarter + previous
quarter for comparison), the platform validates the data, calculates all 8
official DOH KPIs per V2 2026 guidance, shows a readiness dashboard with
pass/fail per KPI, action plan, quarter comparison, and exports for Jawda
portal submission.

POC validated with real Q2 + Q3 2025 data from an OB/GYN clinic in Abu Dhabi.
Demo approved by clinical informatics lead (Anandh).

Competitor: Cyscode / DataPulse Engine (cyscode.com).
They process existing data. We fix data at source + validate.

---

## Tech Stack
- **Backend**: Python 3.11 + FastAPI + pandas + openpyxl
- **Frontend**: React 19 + Vite 8 + Tailwind CSS + lucide-react
- **Database**: In-memory (POC) → PostgreSQL on Azure UAE North (production)
- **Hosting**: localhost (POC) → Azure UAE North (production, ADHICS mandatory)

---

## Project Structure
```
jawda-kpi/
├── backend/
│   ├── main.py                    # FastAPI — validate, calculate, history APIs
│   ├── requirements.txt
│   └── engine/
│       └── kpi_engine.py          # KPI engine — all 8 KPIs, parsers, column mapper
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # App shell — binary router (Upload | Dashboard)
│   │   ├── main.jsx               # React entry
│   │   ├── index.css              # Global styles + Inter font
│   │   ├── pages/
│   │   │   ├── UploadPage.jsx     # 2-step upload: 4 file slots + prev quarter
│   │   │   └── Dashboard.jsx      # Readiness, KPI cards, comparison, action plan
│   │   ├── components/
│   │   │   ├── KPICard.jsx        # KPI card with gauge, target, trend arrow
│   │   │   ├── KPIModal.jsx       # KPI detail modal with DOH definitions
│   │   │   ├── DataQuality.jsx    # KPI readiness + data completeness
│   │   │   └── PrintReport.jsx    # Print-optimised readiness report
│   │   └── utils/
│   │       └── api.js             # API client (validate-multi, calculate-multi)
│   ├── dist/                      # Production build
│   └── package.json
└── CLAUDE.md
```

---

## Running Locally

### Backend (Terminal 1)
```
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Frontend (Terminal 2)
```
cd frontend
nvm use 22
npm run dev
```

---

## Upload Flow (2-step)

### Step 1: Upload & Validate
User drops files into 4 labeled slots per quarter:

| Slot | Type | Required | What it provides |
|------|------|----------|-----------------|
| KPI Data | Excel (.xlsx) | Yes | BMI, BP, HbA1c, eGFR, opioid — all KPIs except OMC003 |
| Visit Details | CSV | Optional | ICD/CPT codes, drugs for cross-validation |
| Time Data | CSV | Optional | Wait times for OMC003 |
| E-Claims | CSV | Optional | Age, visit type for cross-validation |

Plus optional "Previous Quarter" section with same 4 slots for comparison.

Backend validates: file type, size, emptiness, column recognition, quarter detection,
DD/MM vs MM/DD date format inference, and returns warnings.

### Step 2: Preview & Calculate
Shows: record count, mapped fields, detected quarters/years, date range, warnings.
User enters facility name, confirms quarter, clicks Calculate.
Backend merges files by patient ID (MRN NO. → Visit Details, FILE NO → Time Data),
filters by quarter, runs all 8 KPIs, saves to history, returns results.

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/validate-multi | Validate 4+4 files (current + previous quarter) |
| POST | /api/calculate-multi | Run KPIs on validated session |
| GET | /api/history/{facility} | Get all stored quarterly results |
| GET | /api/results/{run_id} | Get specific run results |
| POST | /api/validate | Legacy single-file validation |
| POST | /api/calculate | Legacy single-file calculation |
| POST | /api/upload | Legacy single-step upload |
| GET | /api/kpi-definitions | Official KPI definitions |

---

## The 8 Official DOH Jawda KPIs (V2 2026)

| KPI | Title | Direction | Domain | Target |
|-----|-------|-----------|--------|--------|
| OMC001 | Asthma medication ratio | Higher | Effectiveness | ≥50% |
| OMC002 | Avoidance of antibiotics | Higher | Safety | ≥50% |
| OMC003 | Time to see physician <60 min | Higher | Timeliness | ≥80% |
| OMC004 | Weight/BMI assessment & counselling | Higher | Patient-Centredness | ≥50% |
| OMC005 | Diabetes HbA1c good control ≤8.0% | Higher | Effectiveness | ≥36% |
| OMC006 | Controlling high blood pressure | Higher | Effectiveness | ≥50% |
| OMC007 | Risk of continued opioid use | Lower | Coordination | ≤10% |
| OMC008 | Kidney disease evaluation (eGFR) | Higher | Effectiveness | ≥50% |

V2 key change: OMC005 HbA1c threshold raised from ≤7.0% to ≤8.0%, DOH target >36%.

---

## Dashboard Sections (top to bottom)

1. **Facility header** — name, quarter, record count
2. **Quarter tabs** — shows all stored quarters with scores (if history exists)
3. **Readiness Verdict** — green/amber/red banner: "Ready / Needs attention / Not ready"
4. **Copy to Jawda Portal** — expandable table with exact numerator/denominator per KPI
5. **Summary cards** — Meeting Target / Below Target / Proxy / Cannot Calculate
6. **8 KPI cards** — gauge arc with target dot, pass/fail badge, trend arrow vs prev quarter
7. **Quarter Comparison table** — side-by-side Q2 vs Q3 with change % and trend icons
8. **Action Plan** — collapsible, prioritised: Cannot Calculate → Below Target → Proxy
9. **Data Quality & Readiness** — expanded by default, KPI readiness grid + field completeness
10. **Column Mapping** — collapsed by default
11. **Print Report** — opens clean print window with full KPI table + action items

---

## Engine — Data Format Handling

The engine handles real-world messy clinic data:

| Format issue | How handled |
|-------------|-------------|
| ICD codes in `{curly braces}` | `_strip_braces()` + `_split_multi_codes()` |
| Multi-value ICD `{I10}/{E11.9}` | Split by `/`, check each code separately |
| Age as verbose string `"53 Year(s) 8 Month(s)"` | `safe_age()` with regex parser |
| HbA1c as text `"HBA1C not done"` or ratio `0.065` | `safe_hba1c()` — skips text, converts ratios |
| Drug codes `{G61-3963} - OVITRELLE` | `_extract_drug_name()` — splits by `/` first |
| BP as string `"130/70"` or float `121.8` | `parse_bp()` handles both |
| DD/MM vs MM/DD dates | `_infer_dayfirst()` from unambiguous values + sheet name context |
| Excel datetime swap (Excel `mm-dd-yy` format) | `_fix_date_column()` with sheet name month swap |
| Pregnancy detection via ICD O-codes | `is_pregnant_row()` checks flag + O00-O9A codes |
| Secondary diagnosis | `row_icd_matches()` / `row_icd_exact()` check both primary + secondary |
| Pre-calculated wait minutes | `parse_wait_minutes()` for Time Data CSV |
| 2-visit-in-9-months rule | `count_prior_visits_fast()` with pre-built index (only if data spans >100 days) |

Column mapper has 30+ aliases per field covering: KPI Excel, Visit Details CSV,
E-Claims CSV, Time Data CSV, and Q2/Q3 schema variations.

---

## Real Data Structure (from client clinic)

4 files per quarter, each from a different system:

| File | Source | Key fields | Join key |
|------|--------|-----------|----------|
| KPI Excel | Manual data collector | BMI, BP, HbA1c, eGFR, opioid, OMC outcomes | MRN NO. + FILE NO |
| Visit Details CSV | Insurance/claims | ICD codes, CPT codes, drugs | FILE No (= MRN NO.) |
| Time Data CSV | Queue/registration | Wait times, check-in/out timestamps | File No (= FILE NO) |
| E-Claims CSV | Billing | Age, visit type, financials | Different IDs (can't join) |

Note: MRN NO. in KPI Excel = FILE No in Visit Details.
      FILE NO in KPI Excel = File No in Time Data.
      E-Claims uses different IDs and can't be joined to other files.

---

## Regulatory Requirements

Before deploying to a clinic:
1. Facility-level digital governance approval
2. Named JAWDA/KPI lead (email jawda@doh.gov.ae)
3. Controlled role-based data access
4. ADHICS V2 compliance (encryption, UAE data residency)
5. No external data sharing without formal agreement
6. If AI used: DOH Responsible AI Standard applies

Jawda submission: via bpmweb.doh.gov.ae portal (numerator + denominator per KPI).
DOH cross-validates against Shafafiya claim data.

---

## Validated Results (Q3 2025 — real OB/GYN clinic)

| KPI | Q2 2025 | Q3 2025 | Notes |
|-----|---------|---------|-------|
| OMC001 | 0/0 | 0/0 | No asthma patients (OB/GYN clinic) |
| OMC002 | 0/0 | 0/0 | No bronchitis patients |
| OMC003 | 98.8% (1540/1558) | 99.5% (1651/1660) | PASS — from Time Data CSV |
| OMC004 | 0/444 | 0/541 | Proxy — no management plan column |
| OMC005 | — | 11.1% (2/18) | Q2 had no HbA1c data |
| OMC006 | 33.3% (1/3) | 20.0% (4/20) | More HTN patients found via secondary ICD |
| OMC007 | 0/0 | 0/0 | All opioid flags = NO |
| OMC008 | — | 0/162 | Q2 had no eGFR data |

---

## What's Built

Done:
- KPI engine — all 8 DOH V2 2026 KPIs with full antibiotic/opioid drug lists
- Multi-file upload with 4 labeled slots + previous quarter comparison
- File type auto-detection from column headers
- Two-step flow: validate → preview → calculate
- Quarter detection from data + DD/MM date fix
- Multi-file merge by patient ID with fallback to independent processing
- Readiness verdict, pass/fail per KPI vs DOH targets
- Action plan with prioritised fix steps
- Copy to Jawda Portal (exact numerator/denominator)
- Quarter comparison table with trend arrows
- Print report for management
- Jawda submission CSV export
- Data quality + KPI readiness analysis
- Facility history for trend tracking (in-memory)

Still to build:
- PostgreSQL persistence
- JWT authentication
- Azure UAE North deployment
- Multi-clinic tenancy
- Email notifications

---

## Architecture Decisions

Why Azure UAE North: ADHICS law — patient data must stay in UAE.

Why rules engine not AI: DOH requires auditable calculations.
AI to be added later for ICD code suggestion, drug classification etc.

Competitor: Cyscode / DataPulse (cyscode.com/datapulse-engine)
They process existing data. We fix data at source + validate. Different value prop.

---

## How to Work With This Codebase

Backend: save file → uvicorn auto-reloads.
Frontend: save file → Vite hot-reloads.
Node: requires v22+ (`nvm use 22`).

Test with real data: upload KPI- JULY -SEP.xlsx + Time data CSV to see all KPIs.
For comparison: also upload KPI- April - June.xlsx + WT003 CSV as previous quarter.

Always check calculations against DOH Jawda Guidance V2 2026.
Source: https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Outpatient-Medical-Center-Jawda-Guidance_V2_2026.ashx
