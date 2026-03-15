import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads/resumes")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max upload size

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "ats_scanner")

    ALLOWED_EXTENSIONS = {"pdf", "docx"}