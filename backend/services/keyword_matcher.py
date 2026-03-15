import re
import string

# Common English stop words to exclude from keyword matching
STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "it", "its", "this", "that", "these", "those", "we", "you",
    "he", "she", "they", "i", "me", "him", "her", "us", "them", "my",
    "your", "his", "our", "their", "what", "which", "who", "whom", "not",
    "no", "nor", "so", "yet", "both", "either", "neither", "as", "if",
    "then", "than", "such", "more", "also", "about", "up", "out", "into",
    "through", "during", "before", "after", "above", "below", "between",
    "each", "other", "all", "any", "both", "few", "most", "own", "same",
    "only", "just", "over", "under", "again", "further", "once", "per",
    "well", "must", "able", "within", "while", "strong", "good", "new",
    "high", "large", "small", "long", "great", "little", "own", "right",
    "big", "next", "early", "young", "important", "public", "private"
}


def extract_keywords(text: str) -> set:
    """
    Extract meaningful keywords from a block of text.
    Lowercases, strips punctuation, removes stop words, and filters short tokens.

    Args:
        text: Raw text string.

    Returns:
        Set of cleaned keyword strings.
    """
    text = text.lower()
    # Remove punctuation except hyphens inside words (e.g. "full-stack")
    text = re.sub(r"[^\w\s\-]", " ", text)
    # Normalize multiple spaces
    tokens = text.split()

    keywords = set()
    for token in tokens:
        token = token.strip("-").strip()
        if len(token) < 3:
            continue
        if token in STOP_WORDS:
            continue
        keywords.add(token)

    return keywords


def match_keywords(resume_text: str, job_description: str):
    """
    Compare extracted keywords from the resume against the job description.

    Args:
        resume_text: Full text of the resume.
        job_description: Full text of the job description.

    Returns:
        Tuple (matched: list, missing: list, total_jd_keywords: int)
    """
    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(job_description)

    matched = sorted(list(jd_keywords & resume_keywords))
    missing = sorted(list(jd_keywords - resume_keywords))

    return matched, missing, len(jd_keywords)