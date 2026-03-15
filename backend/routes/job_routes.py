from flask import Blueprint, request, jsonify
from models.resume_model import get_resume_by_id, save_ats_score, get_ats_result_by_id
from services.ats_scoring import calculate_ats_score

job_bp = Blueprint("job", __name__)


@job_bp.route("/calculate-ats", methods=["GET", "POST", "OPTIONS"])
def calculate_ats():
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response, 200

    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    resume_id = data.get("resume_id")
    job_description = data.get("job_description", "").strip()

    if not resume_id:
        return jsonify({"error": "resume_id is required."}), 400

    if not job_description:
        return jsonify({"error": "job_description is required."}), 400

    resume, error = get_resume_by_id(resume_id)
    if error:
        return jsonify({"error": error}), 500
    if not resume:
        return jsonify({"error": f"Resume with id {resume_id} not found."}), 404

    resume_text = resume["text_content"]
    score, matched, missing = calculate_ats_score(resume_text, job_description)

    result_id, db_error = save_ats_score(resume_id, job_description, score, matched, missing)
    if db_error:
        return jsonify({"error": db_error}), 500

    return jsonify({
        "result_id": result_id,
        "score": score,
        "matched_keywords": matched,
        "missing_keywords": missing
    }), 200


@job_bp.route("/result/<int:result_id>", methods=["GET", "OPTIONS"])
def get_result(result_id):
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response, 200

    result, error = get_ats_result_by_id(result_id)
    if error:
        return jsonify({"error": error}), 500
    if not result:
        return jsonify({"error": f"Result with id {result_id} not found."}), 404

    return jsonify(result), 200