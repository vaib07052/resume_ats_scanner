import json
from database.db import execute_query


# ─── Resume Operations ──────────────────────────────────────────────────────

def save_resume(file_name: str, text_content: str):
    """
    Insert a new resume record into the database.

    Returns:
        Tuple (resume_id: int, error: str | None)
    """
    sql = "INSERT INTO resumes (file_name, text_content) VALUES (%s, %s)"
    resume_id, error = execute_query(sql, (file_name, text_content), last_id=True)
    return resume_id, error


def get_resume_by_id(resume_id: int):
    """
    Fetch a single resume row by its primary key.

    Returns:
        Tuple (resume_dict | None, error: str | None)
    """
    sql = "SELECT id, file_name, upload_date, text_content FROM resumes WHERE id = %s"
    resume, error = execute_query(sql, (resume_id,), fetch_one=True)
    return resume, error


# ─── ATS Score Operations ────────────────────────────────────────────────────

def save_ats_score(resume_id: int, job_description: str, score: int,
                   matched_keywords: list, missing_keywords: list):
    """
    Save a job description and its ATS score result.
    1. Inserts the job description into the jobs table.
    2. Inserts the ATS score result into ats_scores.

    Returns:
        Tuple (ats_score_id: int, error: str | None)
    """
    # Save job description
    job_sql = "INSERT INTO jobs (job_description) VALUES (%s)"
    job_id, error = execute_query(job_sql, (job_description,), last_id=True)
    if error:
        return None, error

    # Serialize keyword lists to JSON strings for storage
    matched_json = json.dumps(matched_keywords)
    missing_json = json.dumps(missing_keywords)

    score_sql = """
        INSERT INTO ats_scores (resume_id, job_id, score, matched_keywords, missing_keywords)
        VALUES (%s, %s, %s, %s, %s)
    """
    result_id, error = execute_query(
        score_sql,
        (resume_id, job_id, score, matched_json, missing_json),
        last_id=True
    )
    return result_id, error


def get_ats_result_by_id(result_id: int):
    """
    Retrieve a stored ATS result with its associated resume file name and job description.

    Returns:
        Tuple (result_dict | None, error: str | None)
    """
    sql = """
        SELECT
            s.id,
            s.score,
            s.matched_keywords,
            s.missing_keywords,
            s.created_at,
            r.file_name,
            j.job_description
        FROM ats_scores s
        JOIN resumes r ON s.resume_id = r.id
        JOIN jobs    j ON s.job_id    = j.id
        WHERE s.id = %s
    """
    row, error = execute_query(sql, (result_id,), fetch_one=True)
    if error or not row:
        return row, error

    # Deserialize JSON keyword lists
    try:
        row["matched_keywords"] = json.loads(row["matched_keywords"] or "[]")
        row["missing_keywords"] = json.loads(row["missing_keywords"] or "[]")
    except (ValueError, TypeError):
        pass

    # Convert datetime to string for JSON serialization
    if row.get("created_at"):
        row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")

    return row, None