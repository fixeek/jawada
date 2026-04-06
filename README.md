# Jawda KPI Platform

DOH Outpatient Medical Centers KPI Reporting Platform — V2 2026
Built by **TriZodiac**.

A multi-tenant clinical compliance platform for UAE outpatient clinics. Clinics
upload HIS data exports, the engine validates and calculates all 8 official DOH
Jawda KPIs, and produces a readiness dashboard, action plan, audit trail, and
DOH-portal-ready submission file.

**Live**: https://jawda.trizodiac.com

## Stack
- **Backend**: Python 3.11 + FastAPI + pandas + psycopg2 + bcrypt + python-jose (JWT)
- **Frontend**: React 19 + Vite + Tailwind CSS + lucide-react
- **Database**: PostgreSQL on Azure UAE North (ADHICS compliant)
- **Hosting**: Azure Container Apps (UAE North)

## Features
- Multi-tenant with row-level isolation by `facility_id`
- 4 roles: Super Admin, Clinic Admin, Quality Officer, Viewer
- JWT auth with bcrypt password hashing
- 4-file upload (KPI Excel, Visit Details, Time Data, E-Claims) + previous quarter for comparison
- All 8 DOH Jawda V2 2026 KPIs with full antibiotic and opioid drug lists
- Pass/fail per KPI vs DOH targets
- Action plan with prioritised fix steps
- Quarter comparison with trend arrows
- Copy-to-Jawda-portal view (numerator/denominator per KPI)
- Print-ready audit report
- Platform-wide audit log for super admin
- System health monitoring

## Quick Start (Local)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
nvm use 22  # Node 22+ required
npm install
npm run dev
```

## Environment Variables (Backend)

| Variable | Description | Default |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `jawda` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASS` | Database password | empty |
| `DB_SSL` | SSL mode | `prefer` |
| `JWT_SECRET` | JWT signing secret | dev fallback |

## DOH KPIs Implemented (V2 2026)

| KPI | Title | Direction | Domain | Target |
|-----|-------|-----------|--------|--------|
| OMC001 | Asthma Medication Ratio | Higher | Effectiveness | ≥ 50% |
| OMC002 | Avoidance of Antibiotics | Higher | Safety | ≥ 50% |
| OMC003 | Time to See Physician (<60 min) | Higher | Timeliness | ≥ 80% |
| OMC004 | Weight/BMI Counselling | Higher | Patient-Centredness | ≥ 50% |
| OMC005 | Diabetes HbA1c ≤ 8.0% | Higher | Effectiveness | > 36% |
| OMC006 | BP < 130/80 mmHg | Higher | Effectiveness | ≥ 50% |
| OMC007 | Opioid Use Risk | Lower | Coordination | ≤ 10% |
| OMC008 | eGFR + uACR Monitoring | Higher | Effectiveness | ≥ 50% |

## Data Privacy & Compliance
- All patient data stays in **Azure UAE North** region (ADHICS V2 compliant)
- TLS 1.3 in transit, encrypted at rest
- JWT sessions expire in 12 hours
- Bcrypt password hashing (12 rounds)
- Audit log retained indefinitely
- No patient data sent to external services

## Source Documentation
- [DOH Outpatient Medical Center Jawda Guidance V2 2026](https://www.doh.gov.ae/-/media/Feature/Muashir/Jawda/2026/Outpatient-Medical-Center-Jawda-Guidance_V2_2026.ashx)
- [Jawda Indicators Submission Guidelines](https://www.doh.gov.ae/en/programs-initiatives/muashir/jawda-indicators-submission-guidelines2025)
- DOH Submission Portal: https://bpmweb.doh.gov.ae

## License
Proprietary — TriZodiac © 2026
