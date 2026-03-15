import os
from flask import Blueprint, request, jsonify, current_app
from utils.file_handler import validate_and_save_file
from services.resume_parser import parse_resume
from models.resume_model import save_resume, get_resume_by_id

resume_bp = Blueprint("resume", __name__)


@resume_bp.route("/upload-resume", methods=["POST"])
def upload_resume():
    """
    Upload a resume file (PDF or DOCX), extract its text, and store in the database.
    Returns the resume ID and extracted text.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    allowed_extensions = current_app.config["ALLOWED_EXTENSIONS"]

    # Validate and save the file
    saved_path, error = validate_and_save_file(file, upload_folder, allowed_extensions)
    if error:
        return jsonify({"error": error}), 400

    # Parse resume text from the saved file
    extracted_text, parse_error = parse_resume(saved_path)
    if parse_error:
        return jsonify({"error": parse_error}), 500

    # Save resume record to database
    resume_id, db_error = save_resume(file.filename, extracted_text)
    if db_error:
        return jsonify({"error": db_error}), 500

    return jsonify({
        "message": "Resume uploaded successfully.",
        "resume_id": resume_id,
        "extracted_text": extracted_text
    }), 201