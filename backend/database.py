"""
Database module — PostgreSQL connection and schema management.
Uses psycopg2 directly (no ORM needed at this scale).
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Optional

# Connection string — from environment variable or default
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "jawda")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "")
DB_SSL = os.environ.get("DB_SSL", "prefer")

def get_conn():
    """Get a database connection."""
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS, sslmode=DB_SSL
    )


# NOTE: PostgreSQL Row-Level Security (RLS) is planned for a follow-up.
# For now, multi-tenancy is enforced at the application layer via facility_id checks
# in every query that filters by user.facility_id. RLS would require migrating every
# query to use a session-context connection — done in a dedicated sprint.


def init_db():
    """Create tables if they don't exist."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS facilities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            name_lower VARCHAR(255) NOT NULL UNIQUE,
            license_no VARCHAR(100),
            doh_facility_id VARCHAR(100),
            address TEXT,
            contact_name VARCHAR(255),
            contact_email VARCHAR(255),
            contact_phone VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Add columns to existing facilities table if they don't exist
        DO $$
        BEGIN
            BEGIN ALTER TABLE facilities ADD COLUMN doh_facility_id VARCHAR(100); EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE facilities ADD COLUMN address TEXT; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE facilities ADD COLUMN contact_name VARCHAR(255); EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE facilities ADD COLUMN contact_email VARCHAR(255); EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE facilities ADD COLUMN contact_phone VARCHAR(50); EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE facilities ADD COLUMN is_active BOOLEAN DEFAULT TRUE; EXCEPTION WHEN duplicate_column THEN END;
        END $$;

        CREATE TABLE IF NOT EXISTS uploads (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER REFERENCES facilities(id),
            quarter VARCHAR(20) NOT NULL,
            filename VARCHAR(500),
            total_records INTEGER DEFAULT 0,
            files_used TEXT[],
            file_details JSONB DEFAULT '{}',
            col_mapping JSONB DEFAULT '{}',
            data_quality JSONB DEFAULT '{}',
            calculation_time_ms INTEGER DEFAULT 0,
            uploaded_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS kpi_results (
            id SERIAL PRIMARY KEY,
            upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
            facility_id INTEGER REFERENCES facilities(id),
            quarter VARCHAR(20) NOT NULL,
            kpi_id VARCHAR(10) NOT NULL,
            title VARCHAR(255),
            domain VARCHAR(100),
            numerator INTEGER DEFAULT 0,
            denominator INTEGER DEFAULT 0,
            percentage FLOAT DEFAULT 0,
            target FLOAT DEFAULT 0,
            target_direction VARCHAR(10) DEFAULT 'higher',
            meets_target BOOLEAN,
            gap_patients INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'calculated',
            missing_fields TEXT[],
            notes TEXT[],
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(facility_id, quarter, kpi_id)
        );

        CREATE TABLE IF NOT EXISTS jawda_summaries (
            id SERIAL PRIMARY KEY,
            upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE,
            facility_id INTEGER REFERENCES facilities(id),
            quarter VARCHAR(20) NOT NULL,
            total_kpis INTEGER DEFAULT 8,
            calculable INTEGER DEFAULT 0,
            meeting_target INTEGER DEFAULT 0,
            below_target INTEGER DEFAULT 0,
            missing_data INTEGER DEFAULT 0,
            proxy_data INTEGER DEFAULT 0,
            readiness_pct FLOAT DEFAULT 0,
            verdict VARCHAR(20) DEFAULT 'not_ready',
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(facility_id, quarter)
        );

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            email_lower VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
            role VARCHAR(50) DEFAULT 'quality_officer',
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP,
            must_change_password BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Add columns to existing users table if they don't exist
        DO $$
        BEGIN
            BEGIN ALTER TABLE users ADD COLUMN email_lower VARCHAR(255); EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE users ADD COLUMN last_login TIMESTAMP; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN END;
            BEGIN ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
            UPDATE users SET email_lower = LOWER(email) WHERE email_lower IS NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS audit_log (
            id SERIAL PRIMARY KEY,
            facility_id INTEGER REFERENCES facilities(id),
            upload_id INTEGER REFERENCES uploads(id) ON DELETE SET NULL,
            action VARCHAR(100) NOT NULL,
            quarter VARCHAR(20),
            details JSONB DEFAULT '{}',
            user_email VARCHAR(255),
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_kpi_facility_quarter ON kpi_results(facility_id, quarter);
        CREATE INDEX IF NOT EXISTS idx_summary_facility ON jawda_summaries(facility_id);
        CREATE INDEX IF NOT EXISTS idx_audit_facility ON audit_log(facility_id);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
    """)
    conn.commit()
    cur.close()
    conn.close()


def log_audit(facility_name: str, action: str, quarter: str = None,
              details: dict = None, upload_id: int = None, user_email: str = None,
              ip_address: str = None, user_agent: str = None):
    """Log an audit trail entry."""
    conn = get_conn()
    cur = conn.cursor()
    facility_id = None
    try:
        name_lower = (facility_name or "").strip().lower()
        if name_lower:
            cur.execute("SELECT id FROM facilities WHERE name_lower = %s", (name_lower,))
            row = cur.fetchone()
            if row:
                facility_id = row[0]
    except:
        pass

    # Store user_agent in details JSON since we don't have a column for it
    full_details = details or {}
    if user_agent:
        full_details["_user_agent"] = user_agent[:500]

    cur.execute("""
        INSERT INTO audit_log (facility_id, upload_id, action, quarter, details, user_email, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (facility_id, upload_id, action, quarter,
          json.dumps(full_details), user_email, ip_address))
    conn.commit()
    cur.close()
    conn.close()


def get_audit_log(facility_name: str, limit: int = 50) -> list:
    """Get audit log entries for a facility."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    name_lower = facility_name.strip().lower()

    cur.execute("""
        SELECT a.*, f.name as facility_name
        FROM audit_log a
        LEFT JOIN facilities f ON a.facility_id = f.id
        WHERE f.name_lower = %s
        ORDER BY a.created_at DESC
        LIMIT %s
    """, (name_lower, limit))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        entry = dict(row)
        entry['created_at'] = entry['created_at'].isoformat() if entry.get('created_at') else None
        if isinstance(entry.get('details'), str):
            entry['details'] = json.loads(entry['details'])
        result.append(entry)
    return result


def get_or_create_facility(name: str) -> int:
    """Get facility ID by name, or create if it doesn't exist."""
    conn = get_conn()
    cur = conn.cursor()
    name_lower = name.strip().lower()

    cur.execute("SELECT id FROM facilities WHERE name_lower = %s", (name_lower,))
    row = cur.fetchone()
    if row:
        facility_id = row[0]
    else:
        cur.execute(
            "INSERT INTO facilities (name, name_lower) VALUES (%s, %s) RETURNING id",
            (name.strip(), name_lower)
        )
        facility_id = cur.fetchone()[0]
        conn.commit()

    cur.close()
    conn.close()
    return facility_id


def save_results(facility_name: str, results: dict) -> int:
    """Save KPI results to database. Returns upload ID."""
    conn = get_conn()
    cur = conn.cursor()

    facility_id = get_or_create_facility(facility_name)
    quarter = results.get("quarter", "Unknown")

    # Create upload record with audit details
    cur.execute(
        "INSERT INTO uploads (facility_id, quarter, filename, total_records, files_used, "
        "file_details, col_mapping, data_quality) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (facility_id, quarter, results.get("filename", ""),
         results.get("total_records", 0), results.get("files_used", []),
         json.dumps({"run_at": results.get("run_at", ""), "facility": results.get("facility", "")}),
         json.dumps(results.get("col_mapping", {})),
         json.dumps({"overall_score": results.get("data_quality", {}).get("overall_score", 0),
                      "fields": {k: {"status": v.get("status"), "pct": v.get("populated_pct", 0)}
                                 for k, v in results.get("data_quality", {}).get("fields", {}).items()}}))
    )
    upload_id = cur.fetchone()[0]

    # Save each KPI result (upsert — replace if same facility+quarter+kpi_id)
    for kpi_id, kpi in results.get("kpis", {}).items():
        if kpi_id.startswith("ERROR"):
            continue
        cur.execute("""
            INSERT INTO kpi_results
                (upload_id, facility_id, quarter, kpi_id, title, domain,
                 numerator, denominator, percentage, target, target_direction,
                 meets_target, gap_patients, status, missing_fields, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (facility_id, quarter, kpi_id)
            DO UPDATE SET
                upload_id = EXCLUDED.upload_id,
                numerator = EXCLUDED.numerator,
                denominator = EXCLUDED.denominator,
                percentage = EXCLUDED.percentage,
                target = EXCLUDED.target,
                target_direction = EXCLUDED.target_direction,
                meets_target = EXCLUDED.meets_target,
                gap_patients = EXCLUDED.gap_patients,
                status = EXCLUDED.status,
                missing_fields = EXCLUDED.missing_fields,
                notes = EXCLUDED.notes,
                created_at = NOW()
        """, (
            upload_id, facility_id, quarter, kpi_id,
            kpi.get("title", ""), kpi.get("domain", ""),
            kpi.get("numerator", 0), kpi.get("denominator", 0),
            kpi.get("percentage", 0), kpi.get("target", 0),
            kpi.get("target_direction", "higher"),
            kpi.get("meets_target"), kpi.get("gap_patients", 0),
            kpi.get("status", ""), kpi.get("missing_fields", []),
            kpi.get("notes", [])
        ))

    # Save summary (upsert)
    summary = results.get("jawda_summary", {})
    cur.execute("""
        INSERT INTO jawda_summaries
            (upload_id, facility_id, quarter, total_kpis, calculable,
             meeting_target, below_target, missing_data, proxy_data,
             readiness_pct, verdict)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (facility_id, quarter)
        DO UPDATE SET
            upload_id = EXCLUDED.upload_id,
            calculable = EXCLUDED.calculable,
            meeting_target = EXCLUDED.meeting_target,
            below_target = EXCLUDED.below_target,
            missing_data = EXCLUDED.missing_data,
            proxy_data = EXCLUDED.proxy_data,
            readiness_pct = EXCLUDED.readiness_pct,
            verdict = EXCLUDED.verdict,
            created_at = NOW()
    """, (
        upload_id, facility_id, quarter,
        summary.get("total_kpis", 8), summary.get("calculable", 0),
        summary.get("meeting_target", 0), summary.get("below_target", 0),
        summary.get("missing_data", 0), summary.get("proxy_data", 0),
        summary.get("readiness_pct", 0), summary.get("verdict", "not_ready")
    ))

    conn.commit()
    cur.close()
    conn.close()
    return upload_id


def get_platform_stats() -> dict:
    """Super admin: get platform-wide statistics."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT COUNT(*) as total FROM facilities WHERE is_active = TRUE")
    active_facilities = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM facilities")
    total_facilities = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM users WHERE is_active = TRUE")
    active_users = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM uploads")
    total_uploads = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(DISTINCT facility_id) as total FROM uploads")
    facilities_with_data = cur.fetchone()["total"]

    cur.execute("""
        SELECT COUNT(*) as total
        FROM jawda_summaries
        WHERE verdict = 'ready'
    """)
    ready_count = cur.fetchone()["total"]

    cur.execute("""
        SELECT COUNT(*) as total
        FROM jawda_summaries
    """)
    total_summaries = cur.fetchone()["total"]

    # Recent activity
    cur.execute("""
        SELECT COUNT(*) as total
        FROM uploads
        WHERE uploaded_at >= NOW() - INTERVAL '7 days'
    """)
    uploads_last_7d = cur.fetchone()["total"]

    cur.execute("""
        SELECT COUNT(*) as total
        FROM uploads
        WHERE uploaded_at >= NOW() - INTERVAL '30 days'
    """)
    uploads_last_30d = cur.fetchone()["total"]

    # Facilities by quarter (latest)
    cur.execute("""
        SELECT verdict, COUNT(*) as count
        FROM jawda_summaries js
        WHERE NOT EXISTS (
            SELECT 1 FROM jawda_summaries js2
            WHERE js2.facility_id = js.facility_id
            AND js2.created_at > js.created_at
        )
        GROUP BY verdict
    """)
    verdict_breakdown = {r["verdict"]: r["count"] for r in cur.fetchall()}

    cur.close()
    conn.close()

    return {
        "facilities": {
            "total": total_facilities,
            "active": active_facilities,
            "with_data": facilities_with_data,
        },
        "users": {
            "active": active_users,
        },
        "uploads": {
            "total": total_uploads,
            "last_7_days": uploads_last_7d,
            "last_30_days": uploads_last_30d,
        },
        "compliance": {
            "ready": ready_count,
            "total_summaries": total_summaries,
            "verdict_breakdown": verdict_breakdown,
        },
    }


def get_platform_audit_log(limit: int = 100) -> list:
    """Super admin: platform-wide audit across all clinics."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT a.*, f.name as facility_name
        FROM audit_log a
        LEFT JOIN facilities f ON a.facility_id = f.id
        ORDER BY a.created_at DESC
        LIMIT %s
    """, (limit,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        entry = dict(row)
        entry['created_at'] = entry['created_at'].isoformat() if entry.get('created_at') else None
        if isinstance(entry.get('details'), str):
            entry['details'] = json.loads(entry['details'])
        result.append(entry)
    return result


def get_system_health() -> dict:
    """Super admin: check database health and stats."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # DB version
    cur.execute("SELECT version()")
    db_version = cur.fetchone()["version"]

    # Database size
    cur.execute("SELECT pg_size_pretty(pg_database_size(current_database())) as size")
    db_size = cur.fetchone()["size"]

    # Table sizes
    cur.execute("""
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
            (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename) as row_count
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
    """)
    tables = [dict(r) for r in cur.fetchall()]

    cur.close()
    conn.close()

    return {
        "database": {
            "version": db_version.split(' ')[1] if 'PostgreSQL' in db_version else db_version[:50],
            "size": db_size,
            "tables": tables,
        },
        "status": "healthy",
    }


def get_facility_history(facility_name: str) -> dict:
    """Get all quarterly results for a facility — same format as in-memory history."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    name_lower = facility_name.strip().lower()
    cur.execute("SELECT id FROM facilities WHERE name_lower = %s", (name_lower,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return {}

    facility_id = row["id"]

    # Get all KPI results grouped by quarter
    cur.execute("""
        SELECT quarter, kpi_id, title, domain, numerator, denominator,
               percentage, target, target_direction, meets_target, status
        FROM kpi_results
        WHERE facility_id = %s
        ORDER BY quarter, kpi_id
    """, (facility_id,))

    kpi_rows = cur.fetchall()

    # Get summaries
    cur.execute("""
        SELECT quarter, total_kpis, calculable, meeting_target, below_target,
               missing_data, proxy_data, readiness_pct, verdict
        FROM jawda_summaries
        WHERE facility_id = %s
        ORDER BY quarter
    """, (facility_id,))

    summary_rows = cur.fetchall()

    cur.close()
    conn.close()

    # Build history dict (same format as in-memory facility_history)
    history = {}
    for row in kpi_rows:
        q = row["quarter"]
        if q not in history:
            history[q] = {"quarter": q, "kpis": {}, "jawda_summary": {}}
        history[q]["kpis"][row["kpi_id"]] = {
            "title": row["title"],
            "domain": row["domain"],
            "numerator": row["numerator"],
            "denominator": row["denominator"],
            "percentage": row["percentage"],
            "target": row["target"],
            "target_direction": row["target_direction"],
            "meets_target": row["meets_target"],
            "status": row["status"],
        }

    for row in summary_rows:
        q = row["quarter"]
        if q in history:
            history[q]["jawda_summary"] = {
                "total_kpis": row["total_kpis"],
                "calculable": row["calculable"],
                "meeting_target": row["meeting_target"],
                "below_target": row["below_target"],
                "missing_data": row["missing_data"],
                "proxy_data": row["proxy_data"],
                "readiness_pct": row["readiness_pct"],
                "verdict": row["verdict"],
            }

    return history
