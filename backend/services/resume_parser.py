import os
import PyPDF2
import docx


def parse_resume(file_path: str):
    """
    Extract plain text from a PDF or DOCX resume file.

    Args:
        file_path: Absolute or relative path to the resume file.

    Returns:
        Tuple (extracted_text: str, error: str | None)
    """
    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == ".pdf":
            return _parse_pdf(file_path)
        elif ext == ".docx":
            return _parse_docx(file_path)
        else:
            return None, f"Unsupported file type: {ext}"
    except Exception as e:
        return None, f"Failed to parse resume: {str(e)}"


def _parse_pdf(file_path: str):
    """Extract text from a PDF file using PyPDF2."""
    text_parts = []

    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        if reader.is_encrypted:
            return None, "PDF is encrypted and cannot be read."

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    extracted = "\n".join(text_parts).strip()
    if not extracted:
        return None, "No text could be extracted from the PDF."

    return extracted, None


def _parse_docx(file_path: str):
    """Extract text from a DOCX file using python-docx."""
    doc = docx.Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    extracted = "\n".join(paragraphs).strip()

    if not extracted:
        return None, "No text could be extracted from the DOCX."

    return extracted, None