from services.keyword_matcher import match_keywords


def calculate_ats_score(resume_text: str, job_description: str):
    """
    Calculate an ATS compatibility score between a resume and a job description.

    Scoring formula:
        score = (number of matched keywords / total JD keywords) * 100

    Args:
        resume_text: Extracted plain text from the resume.
        job_description: Full job description text.

    Returns:
        Tuple (score: int, matched_keywords: list, missing_keywords: list)
    """
    matched, missing, total = match_keywords(resume_text, job_description)

    if total == 0:
        return 0, [], []

    raw_score = (len(matched) / total) * 100
    score = round(raw_score)

    return score, matched, missing