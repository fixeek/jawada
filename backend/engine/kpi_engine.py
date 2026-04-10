"""
Jawda KPI Calculation Engine
DOH Outpatient Medical Centers Guidance V2 — Effective Q1 2026
(Updated from v1.4. Key change: OMC005 HbA1c threshold ≤8.0%)
Implements all 8 official KPIs with correct numerator/denominator logic.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import re

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS — from DOH Jawda Guidance V2 2026 (updated from v1.4)
# ─────────────────────────────────────────────────────────────────────────────

ASTHMA_MODERATE_SEVERE_ICD = [
    "J45.40","J45.41","J45.42","J45.50","J45.51","J45.52"
]
ASTHMA_EXCLUSION_ICD = [
    "J43.8","J43.9","J44.0","J44.1","J44.9",
    "E84.0","E84.11","E84.19","E84.8","E84.9",
    "J96.00","J96.01","J96.02"
]
ASTHMA_CONTROLLER_DRUGS = [
    "omalizumab","budesonide-formoterol","fluticasone-salmeterol",
    "mometasone-formoterol","beclomethasone","budesonide","ciclesonide",
    "flunisolide","fluticasone","mometasone","triamcinolone",
    "montelukast","zafirlukast","zileuton","cromolyn","nedocromil",
    "aminophylline","dyphylline","oxtriphylline","theophylline"
]
ASTHMA_RELIEVER_DRUGS = [
    "albuterol","levalbuterol","metaproterenol","pirbuterol"
]

# OMC002: V2 uses J20.3-J20.9, J21.0-J21.9 (NOT J20.0-J20.2)
BRONCHITIS_ICD = [
    "J20.3","J20.4","J20.5","J20.6","J20.7","J20.8","J20.9",
    "J21.0","J21.1","J21.8","J21.9"
]

# OMC002: Complete antibiotic list from DOH Appendix A
ANTIBIOTIC_DRUGS = [
    # Aminoglycosides
    "amikacin","tobramycin","gentamicin","streptomycin",
    # Aminopenicillins
    "amoxicillin","ampicillin",
    # Antipseudomonal penicillins
    "piperacillin-tazobactam","ticarcillin-clavulanate",
    # Beta-lactamase inhibitors
    "amoxicillin-clavulanate","ampicillin-sulbactam",
    # First-generation cephalosporins
    "cefadroxil","cephalexin","cefazolin",
    # Second-generation cephalosporins
    "cefaclor","cefotetan","cefprozil","cefoxitin","cefuroxime",
    # Third-generation cephalosporins
    "cefdinir","cefditoren","cefpodoxime","cefixime","cefotaxime","ceftibuten","ceftriaxone","ceftazidime",
    # Fourth-generation cephalosporins
    "cefepime",
    # Ketolides
    "telithromycin",
    # Lincomycin derivatives
    "clindamycin","lincomycin",
    # Macrolides
    "azithromycin","clarithromycin","erythromycin",
    "erythromycin stearate","erythromycin ethylsuccinate","erythromycin lactobionate",
    # Miscellaneous antibiotics
    "aztreonam","chloramphenicol","vancomycin","dalfopristin-quinupristin",
    "linezolid","daptomycin","metronidazole","erythromycin-sulfisoxazole",
    # Natural penicillins
    "penicillin g sodium","penicillin g potassium","penicillin g procaine",
    "penicillin g benzathine","penicillin v potassium",
    # Penicillinase resistant penicillins
    "dicloxacillin","oxacillin","nafcillin",
    # Quinolones
    "ciprofloxacin","gemifloxacin","ofloxacin","levofloxacin","moxifloxacin","norfloxacin",
    # Rifamycin derivatives
    "rifampin",
    # Sulfonamides
    "sulfadiazine","sulfamethoxazole-trimethoprim",
    # Tetracyclines
    "doxycycline","tetracycline","minocycline",
    # Urinary anti-infectives
    "fosfomycin","nitrofurantoin","trimethoprim",
]

HYPERTENSION_ICD_PREFIX = ["I10","I11","I12","I13"]
# OMC006 denominator exclusions
HTN_EXCLUSION_ICD = [
    "N18.6",  # ESRD
    "T86.10","T86.11","T86.12","T86.13","T86.19","Z48.22","Z94.0",  # Renal transplant
]

DIABETES_ICD_PREFIX = ["E10","E11","E13","O24"]
DIABETES_EXCLUSION_ICD = [
    "E28.2",  # Polycystic ovaries
    "O24.410","O24.414","O24.415","O24.419",
    "O24.420","O24.424","O24.425","O24.429",
    "O24.430","O24.434","O24.435","O24.439",
]
DIABETES_STEROID_PREFIX = ["E09"]

KIDNEY_CPT = ["82040","82042","82043","82044","82570","82565","82540"]
# OMC008 denominator exclusions
KIDNEY_EXCLUSION_ICD = [
    "N18.6",  # ESRD
    "T86.10","T86.11","T86.12","T86.13","T86.19","Z48.22","Z94.0",  # Kidney transplant
]

# OMC007: Complete opioid medication list from DOH Guidance V2
OPIOID_DRUGS = [
    "benzhydrocodone","buprenorphine","butorphanol","codeine",
    "dihydrocodeine","fentanyl","hydrocodone","hydromorphone",
    "levorphanol","meperidine","methadone","morphine","opium",
    "oxycodone","oxymorphone","pentazocine","tapentadol","tramadol",
    # Combination products from DOH table
    "acetaminophen-benzhydrocodone","acetaminophen-codeine",
    "aspirin-butalbital-caffeine-codeine","aspirin-carisoprodol-codeine",
    "acetaminophen-caffeine-dihydrocodeine",
    "acetaminophen-hydrocodone","hydrocodone-ibuprofen",
    "morphine-naltrexone","belladonna-opium",
    "acetaminophen-oxycodone","aspirin-oxycodone","ibuprofen-oxycodone",
    "naloxone-pentazocine","acetaminophen-tramadol",
]
# OMC007: Excluded opioid forms (not counted per DOH V2)
OPIOID_EXCLUDED_FORMS = [
    "injectable","injection","cough","cold",
    "buprenorphine sublingual","buprenorphine subcutaneous",
    "buprenorphine-naloxone","transdermal patch","transdermal",
]

BMI_THRESHOLD       = 25
HTN_SYSTOLIC_MAX    = 130
HTN_DIASTOLIC_MAX   = 80
HBAIC_THRESHOLD     = 8.0   # V2 2026: changed from 7.0 to 8.0
EGFR_THRESHOLD      = 90
AGE_MIN_GENERAL     = 18
AGE_MAX_HTN         = 85
AGE_MAX_DIABETES    = 75
AGE_MIN_ASTHMA      = 5
AGE_MAX_ASTHMA      = 64
OPIOID_DAYS_30      = 15   # 15 days in 30-day period
OPIOID_DAYS_62      = 31   # 31 days in 62-day period

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _strip_braces(val: str) -> str:
    """Strip curly braces from ICD/CPT codes: {I10} -> I10"""
    return re.sub(r'[{}]', '', str(val).strip())

def safe_hba1c(val) -> Optional[float]:
    """Parse HbA1c from various formats:
    - Numeric: 7.2, 6.5
    - Ratio (Excel stored as decimal): 0.065 -> 6.5%, 0.0649 -> 6.49%
    - Text: 'HBA1C not done', 'HBA1C  not done' -> None
    - Mixed: '7.2%' -> 7.2
    """
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    # Skip obvious text
    if any(word in s.lower() for word in ['not done', 'pending', 'n/a', 'none', 'nan', 'missing']):
        return None
    # Extract numeric part
    m = re.search(r'(\d+\.?\d*)', s)
    if not m:
        return None
    num = float(m.group(1))
    # If value < 1, it's likely a ratio (0.065 = 6.5%) — Excel stored percentage as decimal
    if num < 1 and num > 0:
        num = num * 100
    # Sanity check: HbA1c is typically 4-20%
    if num < 3 or num > 25:
        return None
    return round(num, 1)

def _extract_drug_name(drug_val) -> str:
    """Extract drug name from formats like '{G61-3963-01224-01} - OVITRELLE'
    Handles multi-drug fields: '{code1} - DRUG1/{code2} - DRUG2'
    Returns extracted names joined by /, or the full string if no code pattern."""
    if not drug_val or pd.isna(drug_val):
        return ""
    s = str(drug_val).strip()
    # Always split by / first to handle multi-drug fields
    parts = s.split('/')
    names = []
    for part in parts:
        part = part.strip()
        m = re.match(r'\{[^}]+\}\s*[-–]\s*(.+)', part)
        if m:
            names.append(m.group(1).strip())
        elif part and not part.startswith('{'):
            names.append(part)
        else:
            names.append(_strip_braces(part).strip())
    return '/'.join(n for n in names if n)

def safe_dob_to_age(dob_val, ref_date=None) -> Optional[float]:
    """Calculate age from DOB, handling DD/MM/YYYY format."""
    if dob_val is None or pd.isna(dob_val):
        return None
    try:
        if isinstance(dob_val, str):
            dob = pd.to_datetime(dob_val, dayfirst=True)
        else:
            dob = pd.to_datetime(dob_val)
        if ref_date is None:
            ref_date = pd.Timestamp.now()
        age = (ref_date - dob).days / 365.25
        if 0 < age < 150:
            return round(age, 1)
    except:
        pass
    return None

def _split_multi_codes(val) -> List[str]:
    """Split multi-value ICD/CPT fields: '{I10}/{E11.9}/{Z30.09}' -> ['I10','E11.9','Z30.09']
    Also handles comma-separated and semicolon-separated."""
    if not val or pd.isna(val):
        return []
    raw = str(val).strip()
    # Split by / , ; and strip braces from each
    parts = re.split(r'[/;,]', raw)
    return [_strip_braces(p).strip() for p in parts if _strip_braces(p).strip()]

def safe_age(val, dob_val=None, ref_date=None) -> Optional[float]:
    """Parse age from various formats:
    - Integer: 45
    - Verbose: '53 Year(s) 8 Month(s) 20 Day(s)'
    - DOB fallback: calculate from date of birth if age not available"""
    if val is not None and not (isinstance(val, float) and pd.isna(val)):
        s = str(val).strip()
        if s.lower() in ['', 'nan', 'none', 'nat', 'n/a']:
            pass  # Fall through to DOB
        else:
            # Try simple numeric first
            try:
                num = float(s)
                if not pd.isna(num) and 0 < num < 150:
                    return num
            except:
                pass
        # Parse verbose format: "53 Year(s) 8 Month(s) 20 Day(s)"
        years = re.search(r'(\d+)\s*[Yy]ear', s)
        months = re.search(r'(\d+)\s*[Mm]onth', s)
        if years:
            age = int(years.group(1))
            if months:
                age += int(months.group(1)) / 12.0
            return age
    # Fallback: calculate from DOB
    if dob_val is not None:
        return safe_dob_to_age(dob_val, ref_date)
    return None

def parse_bp(bp_str: str) -> Tuple[Optional[int], Optional[int]]:
    if not bp_str or pd.isna(bp_str):
        return None, None
    s = str(bp_str).strip()
    # Standard format: "130/70" or "130 / 70"
    m = re.match(r"(\d+)\s*[/\\]\s*(\d+)", s)
    if m:
        return int(m.group(1)), int(m.group(2))
    # Float like 121.8 — likely systolic only (data entry error), can't use
    # Two floats like "121.8/78.5"
    m2 = re.match(r"(\d+\.?\d*)\s*[/\\]\s*(\d+\.?\d*)", s)
    if m2:
        return int(float(m2.group(1))), int(float(m2.group(2)))
    return None, None

def is_pregnant(val) -> bool:
    if val is None or pd.isna(val):
        return False
    return str(val).strip().upper() in ["YES", "Y", "TRUE", "1"]

def is_pregnant_row(row, col_map) -> bool:
    """Check pregnancy from flag column AND ICD codes (O00-O9A = obstetric)."""
    preg_col = col_map.get("pregnancy")
    if preg_col:
        if is_pregnant(row.get(preg_col, "")):
            return True
    # Check ICD codes for obstetric O-codes
    for col_key in ["icd_code", "icd_secondary"]:
        col = col_map.get(col_key)
        if col:
            codes = _split_multi_codes(row.get(col, ""))
            for c in codes:
                if c.upper().startswith("O") and len(c) >= 3 and c[1:3].isdigit():
                    return True
    return False

def icd_matches(icd_val, prefixes: List[str]) -> bool:
    """Check if any ICD code in the field matches the prefixes.
    Handles multi-value fields: '{I10}/{E11.9}' and curly braces."""
    if not icd_val or pd.isna(icd_val):
        return False
    codes = _split_multi_codes(icd_val)
    if not codes:
        # Single value fallback
        codes = [_strip_braces(str(icd_val)).strip().upper()]
    return any(
        c.upper().startswith(p.upper())
        for c in codes for p in prefixes
    )

def icd_exact(icd_val, codes_list: List[str]) -> bool:
    """Check if any ICD code in the field exactly matches the code list.
    Handles multi-value fields and curly braces."""
    if not icd_val or pd.isna(icd_val):
        return False
    codes = _split_multi_codes(icd_val)
    if not codes:
        codes = [_strip_braces(str(icd_val)).strip().upper()]
    upper_list = [c.upper() for c in codes_list]
    return any(c.upper() in upper_list for c in codes)

def drug_matches(drug_val, drug_list: List[str]) -> bool:
    """Check if drug matches any in the list.
    Handles formats like '{G61-3963-01224-01} - OVITRELLE' and multi-drug fields."""
    if not drug_val or pd.isna(drug_val):
        return False
    # Extract name(s) from code+name format
    name = _extract_drug_name(drug_val).lower()
    raw = str(drug_val).strip().lower()
    # Check both extracted name and raw value
    return any(d.lower() in name or d.lower() in raw for d in drug_list)

def row_icd_matches(row, col_map, prefixes: List[str]) -> bool:
    """Check if any ICD code in primary OR secondary diagnosis matches the prefixes."""
    for col_key in ["icd_code", "icd_secondary"]:
        col = col_map.get(col_key)
        if col:
            val = row.get(col, "")
            if icd_matches(val, prefixes):
                return True
    return False

def row_icd_exact(row, col_map, codes_list: List[str]) -> bool:
    """Check if any ICD code in primary OR secondary diagnosis exactly matches."""
    for col_key in ["icd_code", "icd_secondary"]:
        col = col_map.get(col_key)
        if col:
            val = row.get(col, "")
            if icd_exact(val, codes_list):
                return True
    return False

def cpt_matches(cpt_val, cpt_list: List[str]) -> bool:
    """Check if any CPT code matches. Handles {99213} format and multi-value fields."""
    if not cpt_val or pd.isna(cpt_val):
        return False
    codes = _split_multi_codes(cpt_val)
    if not codes:
        codes = [_strip_braces(str(cpt_val)).strip()]
    return any(c.strip() in cpt_list for c in codes)

def _build_visit_index(df: pd.DataFrame, pid_col: str, date_col: str) -> dict:
    """Pre-compute a visit index: {patient_id: [sorted list of visit dates]}.
    Call once, use many times for count_prior_visits."""
    index = {}
    dates = pd.to_datetime(df[date_col], errors='coerce')
    pids = df[pid_col].astype(str)
    for pid, dt in zip(pids, dates):
        if pd.notna(dt):
            index.setdefault(pid, []).append(dt)
    for pid in index:
        index[pid].sort()
    return index

def count_prior_visits_fast(visit_index: dict, patient_id: str,
                            visit_date, months_prior: int = 9) -> int:
    """Count prior visits using pre-built index. O(1) lookup per patient."""
    visits = visit_index.get(str(patient_id), [])
    if not visits:
        return 0
    cutoff = visit_date - pd.DateOffset(months=months_prior)
    return sum(1 for d in visits if cutoff <= d < visit_date)


def parse_wait_minutes(val) -> Optional[float]:
    """Parse pre-calculated wait time in minutes from time data files."""
    if val is None or pd.isna(val):
        return None
    try:
        return float(val)
    except:
        return None

def normalise_df(df: pd.DataFrame) -> pd.DataFrame:
    """Standardise column names to lowercase with underscores. Handle duplicates."""
    df = df.copy()
    new_cols = [
        str(c).strip().lower()
         .replace("\t", "")
         .replace(" ", "_")
         .replace("/", "_")
         .replace("-", "_")
         .replace("(", "")
         .replace(")", "")
        for c in df.columns
    ]
    # If duplicate column names, keep first occurrence only
    seen = {}
    final_cols = []
    for i, c in enumerate(new_cols):
        if c in seen:
            final_cols.append(f"{c}_{seen[c]}")
            seen[c] += 1
        else:
            seen[c] = 1
            final_cols.append(c)
    df.columns = final_cols
    return df

def find_col(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Find first matching column from a list of candidates.
    Prefers: (1) non-suffixed columns with data, (2) suffixed columns with data,
    (3) any matching column. Suffixed columns (from merges like _visit, _time)
    are deprioritised to prefer the primary file's columns."""
    cols_lower = {c.lower(): c for c in df.columns}
    merge_suffixes = ('_visit', '_time', '_eclaims', '_1', '_2', '_3')

    # Pass 1: non-suffixed columns with data
    for c in candidates:
        if c.lower() in cols_lower:
            actual = cols_lower[c.lower()]
            if not any(actual.endswith(s) for s in merge_suffixes):
                if df[actual].notna().sum() > 0:
                    return actual
    # Pass 2: any column with data (including suffixed)
    for c in candidates:
        if c.lower() in cols_lower:
            actual = cols_lower[c.lower()]
            if df[actual].notna().sum() > 0:
                return actual
    # Pass 3: any matching column even if empty
    for c in candidates:
        if c.lower() in cols_lower:
            return cols_lower[c.lower()]
    return None

def map_columns(df: pd.DataFrame) -> Dict[str, Optional[str]]:
    """Map standard field names to actual dataframe columns.
    Aliases include real column names from clinic HIS exports (Visit Details CSV,
    E-Claims CSV, Time Data CSV, KPI Excel)."""
    mapping = {
        "patient_id":      find_col(df, [
            "mrn","mrn_no","mrn_no.","patient_id",
            "file_no","file_no.","file no",
            "patient id","claim_id","claimid","claim id","sno","sno."]),
        "file_no":         find_col(df, [
            "file_no","file_no.","file no"]),
        "date_of_service": find_col(df, [
            "date_of_service","date of service","dos","visit_date","visit date",
            "service_date","claim_date"]),
        "date_of_birth":   find_col(df, [
            "date_of_birth","dob","date of birth","birthdate","date_of_birth"]),
        "age":             find_col(df, ["age"]),
        "gender":          find_col(df, ["gender","sex"]),
        "icd_code":        find_col(df, [
            "primary_diagnosis","primary diagnosis","primarydx",
            "icd_code","icd code","icd_10","icd","diagnosis","diagnosis_code"]),
        "icd_secondary":   find_col(df, [
            "secondary_diagnosis","secondary diagnosis","secondary_dx","secondarydx"]),
        "cpt_code":        find_col(df, [
            "cpt_code","cpt code","cpt","procedure_code","procedure code",
            "enm","e&m","procedures"]),
        "lab_services":    find_col(df, [
            "lab_services","lab services","lab"]),
        "rad_services":    find_col(df, [
            "rad_services","rad services","radiology"]),
        "bmi":             find_col(df, [
            "bmi","body_mass_index","bmi_counsel_flag"]),
        "bp_reading":      find_col(df, [
            "bp_reading","bp reading","blood_pressure","bp_value","bp value","bp"]),
        "bp_systolic":     find_col(df, [
            "systolic","bp_systolic","sys","systolic_bp"]),
        "bp_diastolic":    find_col(df, [
            "diastolic","bp_diastolic","dia","diastolic_bp"]),
        "pregnancy":       find_col(df, [
            "pregnancy","pregnant","pregnancy_flag"]),
        "opioid":          find_col(df, [
            "opioid_prescription","opioid","opiod_prescription_yes_no",
            "opiod_prescription_yes/no","opiod prescription yes_no",
            "opiod_prescription"]),
        "drug_name":       find_col(df, [
            "drug_name","drugs","drug","medication","medicine","drug name"]),
        "drug_class":      find_col(df, [
            "drug_class","drug class","medication_class"]),
        "days_supplied":   find_col(df, [
            "days_supplied","days supplied","days_supply","supply_days"]),
        "hba1c":           find_col(df, [
            "hba1c","hba1c_result","hba1c_value","a1c","hemoglobin_a1c"]),
        "diabetes_flag":   find_col(df, [
            "diabetes","diabetic","diabetes_flag"]),
        "htn_flag":        find_col(df, [
            "hypertensive","hypertension","htn_flag","htn"]),
        "egfr":            find_col(df, [
            "egfr_status","egfr status",
            "egfr","egfr_value","egfr_result","gfr",
            "egfr_report_status"]),
        "egfr_flag":       find_col(df, [
            "egfr_report","egfr report"]),
        "uacr":            find_col(df, [
            "uacr","uacr_value","uacr_result","albumin_creatinine"]),
        "facility_id":     find_col(df, [
            "facility_id","facility","clinic_id","clinic"]),
        "management_plan": find_col(df, [
            "management_plan","mgmt_plan","plan_documented","management plan"]),
        # Timestamps for OMC003
        "registration_ts": find_col(df, [
            "registration_time","reg_time","registration_timestamp","arrival_time",
            "registration_date_time","registration date_time","registration_date"]),
        "consult_ts":      find_col(df, [
            "consult_time","consult_start","physician_time","doctor_time",
            "doctor_encountercheck_in_date_time","doctor_encountercheck_in_date",
            "doctor_encounter_check_in__date"]),
        # Pre-calculated wait time in minutes (from Time Data CSV)
        "wait_minutes":    find_col(df, [
            "duration_from_reception_to_doctor_checkin",
            "duration from reception to doctor checkin",
            "duration_from_reception_to_doctor_checkout",
            "wait_time","wait_minutes"]),
        # LWBS flag
        "lwbs":            find_col(df, [
            "lwbs","left_without_being_seen","left without being seen"]),
        # Visit type
        "visit_type":      find_col(df, [
            "visit_type","visit type","i_o","ipop"]),
    }
    # Also check lab CPT columns (numeric column names from spreadsheet)
    for cpt in KIDNEY_CPT:
        col = find_col(df, [cpt, f"lab_{cpt}", f"cpt_{cpt}"])
        if col:
            mapping[f"lab_{cpt}"] = col
    return mapping

# ─────────────────────────────────────────────────────────────────────────────
# DOH JAWDA v1.4 TARGETS
# ─────────────────────────────────────────────────────────────────────────────

DOH_TARGETS = {
    "OMC001": {"target": 50.0, "direction": "higher", "domain": "Effectiveness",       "label": "Asthma controller ratio >= 50%"},
    "OMC002": {"target": 50.0, "direction": "higher", "domain": "Safety",              "label": "Patients NOT given antibiotics >= 50%"},
    "OMC003": {"target": 80.0, "direction": "higher", "domain": "Timeliness",          "label": "Seen within 60 min >= 80%"},
    "OMC004": {"target": 50.0, "direction": "higher", "domain": "Patient-Centredness", "label": "BMI counselling plan >= 50%"},
    "OMC005": {"target": 36.0, "direction": "higher", "domain": "Effectiveness",       "label": "HbA1c <= 8.0% >= 36%"},  # V2: threshold 8.0%, DOH target >36%
    "OMC006": {"target": 50.0, "direction": "higher", "domain": "Effectiveness",       "label": "BP controlled < 130/80 >= 50%"},
    "OMC007": {"target": 10.0, "direction": "lower",  "domain": "Coordination",        "label": "Opioid risk rate <= 10%"},
    "OMC008": {"target": 50.0, "direction": "higher", "domain": "Effectiveness",       "label": "eGFR + uACR monitored >= 50%"},
}

# ─────────────────────────────────────────────────────────────────────────────
# KPI RESULT STRUCTURE
# ─────────────────────────────────────────────────────────────────────────────

class KPIResult:
    def __init__(self, kpi_id: str, title: str):
        self.kpi_id = kpi_id
        self.title = title
        self.numerator = 0
        self.denominator = 0
        self.percentage = 0.0
        self.status = "calculated"   # calculated | insufficient_data | not_applicable
        self.missing_fields = []
        self.patient_details = []    # list of dicts per patient
        self.notes = []

    def calculate_percentage(self):
        if self.denominator > 0:
            self.percentage = round((self.numerator / self.denominator) * 100, 1)
        else:
            self.percentage = 0.0

    def to_dict(self) -> dict:
        target_info = DOH_TARGETS.get(self.kpi_id, {})
        target_pct = target_info.get("target", 50.0)
        direction = target_info.get("direction", "higher")

        # Determine effective status:
        # - insufficient_data: required fields missing, can't even attempt
        # - not_applicable: fields present but no eligible patients (0/0) — clinic
        #   simply doesn't have this patient population (e.g., no asthma in OB/GYN)
        # - proxy: calculated from partial data
        # - calculated: full calculation with real patients
        effective_status = self.status
        if self.denominator == 0 and effective_status not in ("insufficient_data",):
            effective_status = "not_applicable"

        if effective_status in ("insufficient_data", "not_applicable"):
            meets_target = None
        elif direction == "lower":
            meets_target = self.percentage <= target_pct
        else:
            meets_target = self.percentage >= target_pct

        import math
        if self.denominator > 0 and meets_target is False:
            if direction == "lower":
                gap_patients = self.numerator - math.floor(self.denominator * target_pct / 100)
            else:
                gap_patients = math.ceil(self.denominator * target_pct / 100) - self.numerator
        else:
            gap_patients = 0

        return {
            "kpi_id": self.kpi_id,
            "title": self.title,
            "numerator": self.numerator,
            "denominator": self.denominator,
            "percentage": self.percentage,
            "status": effective_status,
            "missing_fields": self.missing_fields,
            "notes": self.notes,
            "patient_details": self.patient_details[:100],
            "target": target_pct,
            "target_direction": direction,
            "meets_target": meets_target,
            "gap_patients": gap_patients,
            "domain": target_info.get("domain", ""),
        }

# ─────────────────────────────────────────────────────────────────────────────
# OMC001 — Asthma Medication Ratio
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc001(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC001", "Asthma Medication Ratio")
    r.notes.append("Requires prescription-level data (controller vs reliever drug units per patient per quarter).")

    has_icd = col_map.get("icd_code") or col_map.get("icd_secondary")
    age_col   = col_map.get("age")
    drug_col  = col_map.get("drug_name")

    if not has_icd:
        r.status = "insufficient_data"
        r.missing_fields.append("ICD-10 diagnosis code")
    if not drug_col:
        r.status = "insufficient_data"
        r.missing_fields.append("Drug name / prescription data")
    if not age_col:
        r.missing_fields.append("Age")

    if r.status == "insufficient_data":
        return r

    for _, row in df.iterrows():
        age = safe_age(row.get(age_col, ""))
        if age is None or age < AGE_MIN_ASTHMA or age > AGE_MAX_ASTHMA:
            continue
        if not row_icd_exact(row, col_map, ASTHMA_MODERATE_SEVERE_ICD):
            continue
        if row_icd_matches(row, col_map, ASTHMA_EXCLUSION_ICD):
            continue
        r.denominator += 1
        drug = row.get(drug_col, "")
        is_controller = drug_matches(drug, ASTHMA_CONTROLLER_DRUGS)
        is_reliever   = drug_matches(drug, ASTHMA_RELIEVER_DRUGS)
        r.patient_details.append({
            "patient": str(row.get(col_map.get("patient_id",""), "")),
            "drug": str(drug),
            "is_controller": is_controller,
            "is_reliever": is_reliever,
        })

    # Group by patient and calculate ratio
    from collections import defaultdict
    patient_drugs = defaultdict(lambda: {"controller": 0, "reliever": 0})
    for p in r.patient_details:
        pid = p["patient"]
        if p["is_controller"]: patient_drugs[pid]["controller"] += 1
        if p["is_reliever"]:   patient_drugs[pid]["reliever"]   += 1

    r.denominator = len(patient_drugs)
    r.numerator = 0
    for pid, counts in patient_drugs.items():
        total = counts["controller"] + counts["reliever"]
        if total > 0:
            ratio = counts["controller"] / total
            if ratio >= 0.50:
                r.numerator += 1

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC002 — Avoidance of Antibiotics for Bronchitis
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc002(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC002", "Avoidance of Antibiotics for Acute Bronchitis")
    r.notes.append("Requires ICD-10 bronchitis diagnosis and prescription data within 3 days of visit.")

    has_icd  = col_map.get("icd_code") or col_map.get("icd_secondary")
    age_col  = col_map.get("age")
    drug_col = col_map.get("drug_name")

    if not has_icd:
        r.status = "insufficient_data"
        r.missing_fields.append("ICD-10 diagnosis code")
    if not drug_col:
        r.status = "insufficient_data"
        r.missing_fields.append("Drug name / prescription data")

    if r.status == "insufficient_data":
        return r

    # Per-patient: if any visit has bronchitis, check if ANY visit had antibiotic
    from collections import defaultdict
    patient_bronchitis = {}  # pid -> {"has_antibiotic": bool, "drug": str}
    for _, row in df.iterrows():
        age = safe_age(row.get(age_col, "")) if age_col else None
        if age is not None and age < 0.25:  # 3 months minimum
            continue
        if not row_icd_exact(row, col_map, BRONCHITIS_ICD):
            continue
        pid = str(row.get(col_map.get("patient_id",""), row.name))
        drug = str(row.get(drug_col, "")).strip()
        is_antibiotic = drug_matches(drug, ANTIBIOTIC_DRUGS) if drug else False
        if pid not in patient_bronchitis:
            patient_bronchitis[pid] = {"has_antibiotic": False, "drug": drug or "none"}
        if is_antibiotic:
            patient_bronchitis[pid]["has_antibiotic"] = True
            patient_bronchitis[pid]["drug"] = drug

    for pid, info in patient_bronchitis.items():
        r.denominator += 1
        if not info["has_antibiotic"]:
            r.numerator += 1
        r.patient_details.append({"patient": pid, "drug": info["drug"], "antibiotic": info["has_antibiotic"]})

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC003 — Time to See Physician (<60 minutes)
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc003(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC003", "Time to See Physician (<60 minutes)")
    r.notes.append("Collected automatically by Malaffi — not self-submitted. "
                   "App must pass registration and consult-start timestamps to Malaffi FHIR R4.")

    wait_col    = col_map.get("wait_minutes")
    reg_col     = col_map.get("registration_ts")
    consult_col = col_map.get("consult_ts")
    lwbs_col    = col_map.get("lwbs")

    has_timestamps = reg_col and consult_col
    has_wait_min = wait_col is not None

    if not has_wait_min and not has_timestamps:
        r.status = "insufficient_data"
        r.missing_fields.append("Wait time data (either pre-calculated minutes or registration + consult timestamps)")
        r.notes.append("This KPI requires either a 'Duration from Reception to Doctor checkin' column "
                       "or separate registration and consult timestamps.")
        return r

    if has_wait_min:
        r.notes.append("Using pre-calculated wait time minutes from clinic system.")

    for _, row in df.iterrows():
        # Skip LWBS patients
        if lwbs_col:
            lwbs = str(row.get(lwbs_col, "")).strip().upper()
            if lwbs in ["YES","Y","TRUE","1"]:
                continue

        wait_min = None

        # Prefer pre-calculated minutes
        if has_wait_min:
            wait_min = parse_wait_minutes(row.get(wait_col, None))
        elif has_timestamps:
            try:
                reg     = pd.to_datetime(row[reg_col])
                consult = pd.to_datetime(row[consult_col])
                wait_min = (consult - reg).total_seconds() / 60
            except:
                continue

        if wait_min is None or wait_min < 0:
            continue

        pid = str(row.get(col_map.get("patient_id",""), ""))
        r.denominator += 1
        if wait_min <= 60:
            r.numerator += 1
            r.patient_details.append({"patient": pid, "wait_min": round(wait_min, 1), "within_60": True})
        else:
            r.patient_details.append({"patient": pid, "wait_min": round(wait_min, 1), "within_60": False})

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC004 — Weight/BMI Assessment and Counselling
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc004(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC004", "Weight Assessment and Counselling for Nutrition in Adults")

    bmi_col  = col_map.get("bmi")
    age_col  = col_map.get("age")
    preg_col = col_map.get("pregnancy")
    plan_col = col_map.get("management_plan")

    if not bmi_col:
        r.status = "insufficient_data"
        r.missing_fields.append("BMI")
        return r
    if not age_col:
        r.missing_fields.append("Age (using available data)")
    if not plan_col:
        r.missing_fields.append("Management plan documentation (physician screen required)")
        r.notes.append("Official OMC004 numerator requires documented management plan every 6 months. "
                       "Without physician screen, this is a proxy count only.")

    seen_patients = set()

    for _, row in df.iterrows():
        pid = str(row.get(col_map.get("patient_id",""), id(row)))

        if pid in seen_patients:
            continue

        age = safe_age(row.get(age_col, "")) if age_col else None
        if age is not None and age < AGE_MIN_GENERAL:
            continue

        try:
            bmi_val = row.get(bmi_col, None)
            if bmi_val is None or str(bmi_val).strip() in ["","nan","None","NaT"]:
                continue
            bmi = float(bmi_val)
        except:
            continue
        if bmi < BMI_THRESHOLD:
            continue

        if is_pregnant_row(row, col_map):
            continue

        seen_patients.add(pid)
        r.denominator += 1

        if plan_col:
            plan_val = row.get(plan_col, "")
            if plan_val and str(plan_val).strip().upper() in ["YES","Y","TRUE","1","DOCUMENTED"]:
                r.numerator += 1
                r.patient_details.append({"patient": pid, "bmi": round(bmi,1), "plan": "documented"})
            else:
                r.patient_details.append({"patient": pid, "bmi": round(bmi,1), "plan": "missing"})
        else:
            r.patient_details.append({"patient": pid, "bmi": round(bmi,1), "plan": "unknown"})

    if not plan_col:
        r.notes.append(f"Denominator (proxy): {r.denominator} unique patients with BMI >= 25, age 18+, not pregnant.")
        r.status = "proxy"
    else:
        r.calculate_percentage()

    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC005 — Diabetes HbA1c Good Control
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc005(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC005", "Diabetes: HbA1c Good Control Rate (<=8.0%)")

    has_icd   = col_map.get("icd_code") or col_map.get("icd_secondary")
    hba1c_col = col_map.get("hba1c")
    age_col   = col_map.get("age")
    diabetes_flag_col = col_map.get("diabetes_flag")

    if not has_icd and not diabetes_flag_col:
        r.status = "insufficient_data"
        r.missing_fields.append("ICD-10 diagnosis code (E10/E11/E13 diabetes codes required)")
    if not hba1c_col:
        r.status = "insufficient_data"
        r.missing_fields.append("HbA1c result value (CPT 83036) — lab integration required")

    if r.status == "insufficient_data":
        r.notes.append("OMC005 cannot be calculated from current data. "
                       "Requires confirmed diabetes diagnosis (ICD E10/E11/E13) and HbA1c result <= 8.0%.")
        return r

    # DOH V2: denominator requires 2+ visits in prior 9 months at same facility
    # We check if the data has enough visit history to verify this
    pid_col = col_map.get("patient_id")
    date_col = col_map.get("date_of_service")
    dob_col = col_map.get("date_of_birth")
    can_check_visits = pid_col and date_col

    if not can_check_visits:
        r.notes.append("Cannot verify 2-visit-in-9-months requirement (no date column). "
                       "All qualifying patients included in denominator.")

    # Pre-compute visit index and data span for performance
    visit_index = None
    check_visit_history = False
    if can_check_visits:
        try:
            all_dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
            data_span_days = (all_dates.max() - all_dates.min()).days
            if data_span_days > 100:
                visit_index = _build_visit_index(df, pid_col, date_col)
                check_visit_history = True
        except:
            pass

    # Collect all qualifying rows per patient, then pick the most recent HbA1c
    patient_data = {}  # pid -> {"hba1c": float|None, "date": datetime|None}
    for _, row in df.iterrows():
        pid = str(row.get(col_map.get("patient_id",""), row.name))

        age = safe_age(
            row.get(age_col, "") if age_col else None,
            dob_val=row.get(dob_col, None) if dob_col else None
        )
        if age is not None and (age < AGE_MIN_GENERAL or age > AGE_MAX_DIABETES):
            continue

        # DOH V2: denominator requires 2+ visits in prior 9 months
        if check_visit_history and visit_index:
            try:
                visit_date = pd.to_datetime(row.get(date_col, None), dayfirst=True)
                if pd.notna(visit_date):
                    prior = count_prior_visits_fast(visit_index, pid, visit_date, 9)
                    if prior < 2:
                        continue
            except:
                pass

        # Check diabetes via ICD (primary + secondary) or diabetes flag column
        is_diabetic = False
        if has_icd:
            is_diabetic = row_icd_matches(row, col_map, DIABETES_ICD_PREFIX)
        if not is_diabetic and diabetes_flag_col:
            flag = str(row.get(diabetes_flag_col, "")).strip().upper()
            is_diabetic = flag in ["YES", "Y", "TRUE", "1"]
        if not is_diabetic:
            continue
        # Exclusions — check both primary and secondary
        if row_icd_exact(row, col_map, DIABETES_EXCLUSION_ICD):
            continue
        if row_icd_matches(row, col_map, DIABETES_STEROID_PREFIX):
            continue

        hba1c = safe_hba1c(row.get(hba1c_col, ""))
        row_date = None
        if date_col:
            try:
                row_date = pd.to_datetime(row.get(date_col), dayfirst=True)
            except:
                pass

        # Keep this patient, update if this row has a more recent HbA1c
        if pid not in patient_data:
            patient_data[pid] = {"hba1c": hba1c, "date": row_date}
        elif hba1c is not None:
            existing = patient_data[pid]
            # Prefer most recent date, or any HbA1c over None
            if existing["hba1c"] is None:
                patient_data[pid] = {"hba1c": hba1c, "date": row_date}
            elif row_date and existing["date"] and row_date > existing["date"]:
                patient_data[pid] = {"hba1c": hba1c, "date": row_date}

    # Score each patient
    for pid, info in patient_data.items():
        r.denominator += 1
        hba1c = info["hba1c"]
        if hba1c is not None:
            if hba1c <= HBAIC_THRESHOLD:
                r.numerator += 1
                r.patient_details.append({"patient": pid, "hba1c": hba1c, "controlled": True})
            else:
                r.patient_details.append({"patient": pid, "hba1c": hba1c, "controlled": False})
        else:
            r.patient_details.append({"patient": pid, "hba1c": "not done", "controlled": False})

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC006 — Controlling High Blood Pressure
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc006(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC006", "Controlling High Blood Pressure")

    bp_col  = col_map.get("bp_reading")
    sys_col = col_map.get("bp_systolic")
    dia_col = col_map.get("bp_diastolic")
    age_col = col_map.get("age")
    has_icd  = col_map.get("icd_code") or col_map.get("icd_secondary")
    preg_col = col_map.get("pregnancy")

    has_bp = bp_col or (sys_col and dia_col)

    if not has_bp:
        r.status = "insufficient_data"
        r.missing_fields.append("BP reading (systolic/diastolic)")
        return r

    if not has_icd:
        r.missing_fields.append("ICD-10 hypertension diagnosis (I10-I13) — required for official denominator")
        r.notes.append("Proxy mode: patients with BP readings used as denominator. "
                       "Official OMC006 requires confirmed hypertension diagnosis + 2 visits in prior 9 months.")
        r.status = "proxy"

    # DOH V2: denominator requires 2+ visits in prior 9 months
    pid_col = col_map.get("patient_id")
    date_col = col_map.get("date_of_service")
    can_check_visits = pid_col and date_col
    visit_index = None
    check_visit_history = False
    if can_check_visits:
        try:
            all_dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
            data_span_days = (all_dates.max() - all_dates.min()).days
            if data_span_days > 100:
                visit_index = _build_visit_index(df, pid_col, date_col)
                check_visit_history = True
        except:
            pass

    def _collect_bp_patients(use_icd_filter):
        """Iterate rows, optionally filtering by ICD (primary + secondary), return {pid: (sys, dia)}."""
        seen = {}
        for _, row in df.iterrows():
            pid = str(row.get(col_map.get("patient_id",""), id(row)))

            age = safe_age(row.get(age_col, "")) if age_col else None
            if age is not None and (age < AGE_MIN_GENERAL or age > AGE_MAX_HTN):
                continue

            # Exclusion: ESRD and kidney transplant patients
            if has_icd and row_icd_exact(row, col_map, HTN_EXCLUSION_ICD):
                continue

            if use_icd_filter:
                is_htn = False
                if has_icd:
                    is_htn = row_icd_matches(row, col_map, HYPERTENSION_ICD_PREFIX)
                htn_flag_col = col_map.get("htn_flag")
                if not is_htn and htn_flag_col:
                    flag = str(row.get(htn_flag_col, "")).strip().upper()
                    is_htn = flag in ["YES", "Y", "TRUE", "1"]
                if not is_htn:
                    continue

            # 2-visit-in-9-months check
            if check_visit_history and use_icd_filter:
                try:
                    visit_date = pd.to_datetime(row.get(date_col), dayfirst=True)
                    prior = count_prior_visits_fast(pid, visit_date, visit_index)
                    if prior < 2:
                        continue
                except:
                    pass  # If date parsing fails, include the patient

            # Get BP — try separate columns first, then combined
            sys, dia = None, None
            if sys_col and dia_col:
                try:
                    s = row.get(sys_col, None)
                    d = row.get(dia_col, None)
                    if hasattr(s, 'iloc'): s = s.iloc[0]
                    if hasattr(d, 'iloc'): d = d.iloc[0]
                    if s is not None and d is not None:
                        sv = str(s).strip()
                        dv = str(d).strip()
                        if sv not in ["","nan","None"] and dv not in ["","nan","None"]:
                            sys = int(float(sv))
                            dia = int(float(dv))
                except:
                    pass
            if (sys is None or dia is None) and bp_col:
                bp_raw = row.get(bp_col, "")
                sys, dia = parse_bp(str(bp_raw))

            if sys is None or dia is None:
                continue

            if is_pregnant_row(row, col_map):
                continue

            seen[pid] = (sys, dia)
        return seen

    # Try official denominator first (ICD-filtered), fall back to proxy if 0/0
    seen_latest = _collect_bp_patients(use_icd_filter=True) if has_icd else {}

    if not seen_latest:
        # No hypertension-coded patients found — use all patients with BP as proxy
        seen_latest = _collect_bp_patients(use_icd_filter=False)
        if r.status != "proxy":
            r.status = "proxy"
            r.missing_fields.append("ICD-10 hypertension diagnosis (I10-I13) — no matching codes found")
            r.notes.append("Proxy mode: all patients with BP readings used as denominator. "
                           "Official OMC006 requires confirmed hypertension diagnosis + 2 visits in prior 9 months.")

    for pid, (sys, dia) in seen_latest.items():
        r.denominator += 1
        controlled = sys < HTN_SYSTOLIC_MAX and dia < HTN_DIASTOLIC_MAX
        if controlled:
            r.numerator += 1
        r.patient_details.append({
            "patient": pid,
            "systolic": sys,
            "diastolic": dia,
            "controlled": controlled
        })

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC007 — Risk of Continued Opioid Use
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc007(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC007", "Risk of Continued Opioid Use")
    r.notes.append("Desired direction: LOWER is better.")

    opioid_col = col_map.get("opioid")
    age_col    = col_map.get("age")
    days_col   = col_map.get("days_supplied")
    drug_col   = col_map.get("drug_name")

    if not opioid_col and not drug_col:
        r.status = "insufficient_data"
        r.missing_fields.append("Opioid prescription flag or drug name")
        return r

    if not days_col:
        r.missing_fields.append("Days supplied (required for 15/30 and 31/62 day threshold logic)")
        r.notes.append("Proxy mode: counting patients with any opioid prescription as new opioid users. "
                       "Official OMC007 requires days-supplied to calculate 15/30 and 31/62 day rates.")
        r.status = "proxy"

    from collections import defaultdict
    patient_days = defaultdict(int)
    opioid_patients = set()
    drug_class_col = col_map.get("drug_class")

    for _, row in df.iterrows():
        pid = str(row.get(col_map.get("patient_id",""), row.name))

        age = safe_age(row.get(age_col, "")) if age_col else None
        if age is not None and age < AGE_MIN_GENERAL:
            continue

        has_opioid = False
        if opioid_col:
            val = row.get(opioid_col, "")
            has_opioid = str(val).strip().upper() in ["YES","Y","TRUE","1"]
        if not has_opioid and drug_col:
            drug = row.get(drug_col, "")
            has_opioid = drug_matches(drug, OPIOID_DRUGS)

        if not has_opioid:
            continue

        # Exclude injectable, cough/cold, transdermal etc per DOH V2
        drug_text = str(row.get(drug_col, "")).strip().lower() if drug_col else ""
        drug_class = str(row.get(drug_class_col, "")).strip().lower() if drug_class_col else ""
        combined = drug_text + " " + drug_class
        if any(excl in combined for excl in OPIOID_EXCLUDED_FORMS):
            continue

        opioid_patients.add(pid)

        if days_col:
            try:
                days = int(row.get(days_col, 0))
                patient_days[pid] += days
            except:
                pass

    # Denominator: unique patients with opioid prescriptions
    r.denominator = len(opioid_patients)

    if days_col and opioid_patients:
        # Rate 1: >= 15 days in 30-day period
        at_risk_30 = sum(1 for pid in opioid_patients if patient_days.get(pid, 0) >= OPIOID_DAYS_30)
        # Rate 2: >= 31 days in 62-day period (use total days as proxy for window)
        at_risk_62 = sum(1 for pid in opioid_patients if patient_days.get(pid, 0) >= OPIOID_DAYS_62)
        # Use the higher of the two rates (more conservative)
        r.numerator = max(at_risk_30, at_risk_62)
    elif opioid_patients:
        # Proxy: all opioid patients flagged
        r.numerator = r.denominator

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# OMC008 — Kidney Disease Evaluation
# ─────────────────────────────────────────────────────────────────────────────

def calc_omc008(df: pd.DataFrame, col_map: dict) -> KPIResult:
    r = KPIResult("OMC008", "Kidney Disease Evaluation (eGFR)")

    egfr_col = col_map.get("egfr")
    egfr_flag_col = col_map.get("egfr_flag")
    uacr_col = col_map.get("uacr")
    age_col  = col_map.get("age")
    lab_services_col = col_map.get("lab_services")

    # Check for kidney CPT codes in dedicated columns
    has_kidney_cpts = any(col_map.get(f"lab_{cpt}") for cpt in KIDNEY_CPT)

    # Also check if lab_services field contains kidney CPTs
    has_lab_services = lab_services_col is not None

    # Try to find eGFR values — also check coalesced columns (egfr_report_status)
    # When sheets have different column names, both may exist after concat
    egfr_alt_col = None
    for candidate in ['egfr_report_status', 'egfr_value', 'gfr']:
        if candidate in df.columns and df[candidate].notna().sum() > 0:
            egfr_alt_col = candidate
            break

    if not egfr_col and not has_kidney_cpts and not has_lab_services and not egfr_alt_col:
        r.status = "insufficient_data"
        r.missing_fields.append("eGFR result value (numeric, <90 required for denominator)")
        r.missing_fields.append("uACR result value")
        return r

    if not egfr_col and not egfr_alt_col:
        r.missing_fields.append("eGFR numeric result (required for denominator — eGFR <90)")
        r.notes.append("Proxy mode: using presence of kidney CPT codes as indicator.")
        r.status = "proxy"

    seen = set()

    has_icd = col_map.get("icd_code") or col_map.get("icd_secondary")

    for _, row in df.iterrows():
        pid = str(row.get(col_map.get("patient_id",""), row.name))
        if pid in seen:
            continue

        age = safe_age(row.get(age_col, "")) if age_col else None
        if age is not None and age < AGE_MIN_GENERAL:
            continue

        # Exclusion: ESRD and kidney transplant patients
        if has_icd and row_icd_exact(row, col_map, KIDNEY_EXCLUSION_ICD):
            continue

        in_denominator = False

        # Check eGFR numeric value (primary column or alt column)
        for ecol in [egfr_col, egfr_alt_col]:
            if ecol and not in_denominator:
                try:
                    egfr = float(row.get(ecol, ""))
                    if not pd.isna(egfr) and egfr < EGFR_THRESHOLD:
                        in_denominator = True
                except (ValueError, TypeError):
                    pass

        # Check kidney CPTs in dedicated columns
        if not in_denominator and has_kidney_cpts:
            for cpt in KIDNEY_CPT:
                cpt_val = row.get(col_map.get(f"lab_{cpt}", ""), None)
                if cpt_val is not None and not pd.isna(cpt_val):
                    in_denominator = True
                    break

        # Check kidney CPTs in lab_services multi-code field
        if not in_denominator and lab_services_col:
            lab_val = row.get(lab_services_col, "")
            if lab_val and not pd.isna(lab_val):
                lab_codes = _split_multi_codes(lab_val)
                if any(c.strip() in KIDNEY_CPT for c in lab_codes):
                    in_denominator = True

        if not in_denominator:
            continue

        seen.add(pid)
        r.denominator += 1

        # Numerator: both eGFR and uACR tested in last 6 months
        has_egfr_test = egfr_col and not pd.isna(row.get(egfr_col, ""))
        has_uacr_test = uacr_col and not pd.isna(row.get(uacr_col, ""))

        if has_kidney_cpts and not egfr_col:
            # Proxy: any lab CPT code counts as monitored
            has_egfr_test = True

        if has_egfr_test and has_uacr_test:
            r.numerator += 1
            r.patient_details.append({"patient": pid, "monitored": True})
        elif has_egfr_test:
            r.patient_details.append({"patient": pid, "monitored": False, "missing": "uACR"})
        else:
            r.patient_details.append({"patient": pid, "monitored": False, "missing": "eGFR+uACR"})

    r.calculate_percentage()
    return r

# ─────────────────────────────────────────────────────────────────────────────
# DATA QUALITY REPORT
# ─────────────────────────────────────────────────────────────────────────────

def data_quality_report(df: pd.DataFrame, col_map: dict) -> dict:
    total = len(df)
    report = {"total_rows": total, "fields": {}, "kpi_readiness": {}, "overall_score": 0}

    # All clinical fields that the 8 KPI calculations actually use
    checks = {
        "Patient MRN/ID":       col_map.get("patient_id"),
        "Age":                  col_map.get("age"),
        "Date of service":      col_map.get("date_of_service"),
        "ICD-10 code":          col_map.get("icd_code"),
        "CPT code":             col_map.get("cpt_code"),
        "Drug name":            col_map.get("drug_name"),
        "BMI":                  col_map.get("bmi"),
        "BP reading":           col_map.get("bp_reading") or col_map.get("bp_systolic"),
        "HbA1c result":         col_map.get("hba1c"),
        "eGFR value":           col_map.get("egfr"),
        "uACR value":           col_map.get("uacr"),
        "Pregnancy flag":       col_map.get("pregnancy"),
        "Opioid flag":          col_map.get("opioid"),
        "Days supplied":        col_map.get("days_supplied"),
        "Management plan":      col_map.get("management_plan"),
        "Registration time":    col_map.get("registration_ts"),
        "Consult time":         col_map.get("consult_ts"),
    }

    for field_name, col in checks.items():
        if col is None:
            report["fields"][field_name] = {
                "present": False,
                "populated_pct": 0,
                "column": None,
                "status": "missing"
            }
        else:
            series = df[col]
            non_empty = series.apply(lambda x: str(x).strip() not in ["","None","nan","NaT","#N/A"] if x is not None else False).sum()
            pct = round((non_empty / total) * 100, 1) if total > 0 else 0
            report["fields"][field_name] = {
                "present": True,
                "populated_pct": pct,
                "column": col,
                "status": "good" if pct >= 80 else "partial" if pct >= 20 else "poor"
            }

    # Overall score: average of actual populated percentages across all 9 fields
    # Missing fields count as 0%. This gives an honest picture.
    pct_sum = sum(f["populated_pct"] for f in report["fields"].values())
    report["overall_score"] = round(pct_sum / len(checks), 1) if checks else 0

    # Per-KPI readiness: split into critical (blocks calculation) vs optional (improves accuracy)
    # Critical = causes insufficient_data in the engine; Optional = causes proxy or better filtering
    kpi_field_reqs = {
        "OMC001": { "critical": ["ICD-10 code", "Drug name"],           "optional": ["Age"] },
        "OMC002": { "critical": ["ICD-10 code", "Drug name"],           "optional": ["Age"] },
        "OMC003": { "critical": ["Wait time OR Registration + Consult timestamps"],  "optional": [] },
        "OMC004": { "critical": ["BMI"],                                "optional": ["Age", "Pregnancy flag", "Management plan"] },
        "OMC005": { "critical": ["ICD-10 code", "HbA1c result"],        "optional": ["Age"] },
        "OMC006": { "critical": ["BP reading"],                         "optional": ["ICD-10 code", "Age", "Pregnancy flag"] },
        "OMC007": { "critical": ["Opioid flag"],                        "optional": ["Days supplied", "Age"] },
        "OMC008": { "critical": ["eGFR value"],                         "optional": ["uACR value", "Age"] },
    }

    def _field_present(name):
        info = report["fields"].get(name, {})
        return info.get("present", False) and info.get("populated_pct", 0) >= 20

    for kpi_id, reqs in kpi_field_reqs.items():
        critical_missing = [f for f in reqs["critical"] if not _field_present(f)]
        optional_missing = [f for f in reqs["optional"] if not _field_present(f)]
        critical_ok = [f for f in reqs["critical"] if _field_present(f)]
        optional_ok = [f for f in reqs["optional"] if _field_present(f)]

        # OMC007 special case: needs Opioid flag OR Drug name
        if kpi_id == "OMC007" and "Opioid flag" in critical_missing and _field_present("Drug name"):
            critical_missing.remove("Opioid flag")
            critical_ok.append("Drug name (as opioid identifier)")

        can_calculate = len(critical_missing) == 0
        all_fields = reqs["critical"] + reqs["optional"]
        filled = len(critical_ok) + len(optional_ok)
        score = round(filled / len(all_fields) * 100) if all_fields else 100

        report["kpi_readiness"][kpi_id] = {
            "ready": can_calculate,
            "score": score,
            "critical_missing": critical_missing,
            "optional_missing": optional_missing,
        }

    return report

# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENGINE — run all KPIs
# ─────────────────────────────────────────────────────────────────────────────

def run_all_kpis(df: pd.DataFrame, quarter: str = None) -> dict:
    """
    Main entry point. Takes a DataFrame, runs all 8 KPIs, returns results dict.
    """
    df = normalise_df(df)
    col_map = map_columns(df)

    results = {
        "quarter":      quarter or "Unknown",
        "total_records": len(df),
        "run_at":       datetime.now().isoformat(),
        "col_mapping":  {k: v for k, v in col_map.items() if v is not None},
        "data_quality": data_quality_report(df, col_map),
        "kpis": {}
    }

    kpi_functions = [
        calc_omc001, calc_omc002, calc_omc003, calc_omc004,
        calc_omc005, calc_omc006, calc_omc007, calc_omc008,
    ]

    for fn in kpi_functions:
        try:
            result = fn(df, col_map)
            results["kpis"][result.kpi_id] = result.to_dict()
        except Exception as e:
            results["kpis"][f"ERROR_{fn.__name__}"] = {"error": str(e)}

    # Jawda readiness summary
    kpi_vals = [v for k, v in results["kpis"].items() if not k.startswith("ERROR")]
    not_applicable = [k for k in kpi_vals if k["status"] == "not_applicable"]
    missing_data = [k for k in kpi_vals if k["status"] == "insufficient_data"]
    # Calculable = has real patients (denominator > 0, not insufficient/not_applicable)
    calculable = [k for k in kpi_vals if k["status"] not in ("insufficient_data", "not_applicable")]
    meeting = [k for k in calculable if k.get("meets_target") is True]
    below = [k for k in calculable if k.get("meets_target") is False]
    proxy = [k for k in kpi_vals if k["status"] == "proxy"]

    # Verdict logic:
    # - "ready": all calculable KPIs pass, no missing data (N/A is fine)
    # - "attention": some pass, some don't
    # - "not_ready": none pass or critical data missing
    results["jawda_summary"] = {
        "total_kpis": len(kpi_vals),
        "calculable": len(calculable),
        "meeting_target": len(meeting),
        "below_target": len(below),
        "missing_data": len(missing_data),
        "not_applicable": len(not_applicable),
        "proxy_data": len(proxy),
        "readiness_pct": round(len(meeting) / len(calculable) * 100) if calculable else 0,
        "verdict": "ready" if len(calculable) > 0 and len(below) == 0 and len(missing_data) == 0
                   else "attention" if len(meeting) > 0
                   else "not_ready",
    }

    return results


MONTH_NAMES = {
    "jan":1,"january":1,"feb":2,"february":2,"mar":3,"march":3,
    "apr":4,"april":4,"may":5,"jun":6,"june":6,
    "jul":7,"july":7,"aug":8,"august":8,"sep":9,"september":9,
    "oct":10,"october":10,"nov":11,"november":11,"dec":12,"december":12,
}

def _detect_month_from_name(name: str) -> Optional[int]:
    """Extract expected month number from a sheet name like 'JULY 2025'."""
    for word in str(name).lower().split():
        if word in MONTH_NAMES:
            return MONTH_NAMES[word]
    return None

def _infer_dayfirst(values) -> Optional[bool]:
    """Infer whether dates are DD/MM or MM/DD by looking at unambiguous values.
    If any string date has first number > 12 (e.g. '25/07/2025'), it must be DD/MM.
    If any string date has second number > 12 (e.g. '07/25/2025'), it must be MM/DD.
    Returns True for DD/MM, False for MM/DD, None if all ambiguous."""
    dayfirst_evidence = 0
    monthfirst_evidence = 0

    for val in values:
        if not isinstance(val, str):
            continue
        s = str(val).strip()
        m = re.match(r'^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$', s)
        if not m:
            continue
        first, second = int(m.group(1)), int(m.group(2))
        if first > 12 and second <= 12:
            dayfirst_evidence += 1      # first number can't be month -> DD/MM
        elif second > 12 and first <= 12:
            monthfirst_evidence += 1    # second number can't be month -> MM/DD

    if dayfirst_evidence > 0 and monthfirst_evidence == 0:
        return True    # DD/MM confirmed
    elif monthfirst_evidence > 0 and dayfirst_evidence == 0:
        return False   # MM/DD confirmed
    return None        # all ambiguous or conflicting


def _fix_date_column(series, expected_month: Optional[int] = None, dayfirst: Optional[bool] = None):
    """Fix a date column handling DD/MM vs MM/DD issues.

    Strategy (in priority order):
    1. Infer format from unambiguous string dates in the column (day > 12)
    2. Use expected_month from sheet name context (Excel files)
    3. Default to dayfirst=True (UAE standard DD/MM/YYYY)
    """
    # Step 1: infer from unambiguous values
    if dayfirst is None:
        dayfirst = _infer_dayfirst(series)

    # Default to DD/MM for UAE data
    use_dayfirst = dayfirst if dayfirst is not None else True

    fixed = []
    for val in series:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            fixed.append(val)
        elif isinstance(val, str):
            # Parse string dates with inferred format
            try:
                fixed.append(pd.to_datetime(val, dayfirst=use_dayfirst))
            except:
                fixed.append(val)
        elif isinstance(val, (pd.Timestamp, datetime)):
            # Already a datetime — check if day/month are swapped using context
            if expected_month and val.month != expected_month and val.day <= 12:
                try:
                    swapped = val.replace(month=val.day, day=val.month)
                    if swapped.month == expected_month:
                        fixed.append(swapped)
                        continue
                except (ValueError, AttributeError):
                    pass
            fixed.append(val)
        else:
            fixed.append(val)
    return fixed


def _fix_dates_in_df(df: pd.DataFrame, sheet_name: str = "") -> pd.DataFrame:
    """Fix date columns in a dataframe.
    Uses sheet name context for Excel files AND infers format from unambiguous dates."""
    expected_month = _detect_month_from_name(sheet_name)

    # Find all date columns — service dates use sheet context, DOBs use format inference
    date_cols = [c for c in df.columns if 'date' in str(c).lower()]
    if not date_cols:
        return df

    df = df.copy()
    for col in date_cols:
        # Only use sheet-name month context for service dates, not birth dates
        is_birth = 'birth' in str(col).lower()
        col_expected = None if is_birth else expected_month
        df[col] = _fix_date_column(df[col], expected_month=col_expected)
    return df


def load_file(file_path: str) -> pd.DataFrame:
    """Load CSV or Excel file into DataFrame.
    For Excel with multiple sheets, concatenates all sheets.
    Fixes DD/MM vs MM/DD date issues using:
      1. Unambiguous dates in the column (day > 12 tells us the format)
      2. Sheet name context for Excel (e.g. 'JULY 2025')
      3. Default to DD/MM (UAE standard)"""
    if file_path.endswith(".csv"):
        try:
            df = pd.read_csv(file_path, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding='latin-1')
        df = _fix_dates_in_df(df)
        return df
    elif file_path.endswith((".xlsx",".xls")):
        xl = pd.ExcelFile(file_path)
        sheets = []
        for sheet in xl.sheet_names:
            try:
                s = pd.read_excel(file_path, sheet_name=sheet)
                if len(s.columns) > 3:  # skip empty/config sheets
                    s = _fix_dates_in_df(s, sheet_name=sheet)
                    s["_sheet"] = sheet
                    sheets.append(s)
            except:
                pass
        if sheets:
            return pd.concat(sheets, ignore_index=True)
        return pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")
