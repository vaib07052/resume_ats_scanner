import os
import uuid


def validate_and_save_file(file, upload_folder: str, allowed_extensions: set):
    """
    Validate an uploaded file's extension and save it to the upload folder.
    The file is renamed with a UUID to avoid naming collisions.

    Args:
        file: Werkzeug FileStorage object from request.files.
        upload_folder: Directory path where the file should be saved.
        allowed_extensions: Set of permitted file extensions (e.g. {'pdf', 'docx'}).

    Returns:
        Tuple (saved_file_path: str | None, error: str | None)
    """
    original_filename = file.filename

    if not original_filename or "." not in original_filename:
        return None, "Invalid filename. File must have an extension."

    ext = original_filename.rsplit(".", 1)[1].lower()

    if ext not in allowed_extensions:
        allowed = ", ".join(sorted(allowed_extensions)).upper()
        return None, f"File type '.{ext}' is not allowed. Accepted types: {allowed}."

    # Generate a unique filename to avoid overwrites
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    # Ensure the upload directory exists
    os.makedirs(upload_folder, exist_ok=True)

    save_path = os.path.join(upload_folder, unique_name)

    try:
        file.save(save_path)
    except OSError as e:
        return None, f"Could not save file: {str(e)}"

    return save_path, None