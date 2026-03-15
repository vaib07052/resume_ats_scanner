import pymysql
import pymysql.cursors
from flask import current_app, g


def get_db():
    """
    Get a database connection, reusing the one stored on Flask's g object
    within the same request context.
    """
    if "db" not in g:
        g.db = pymysql.connect(
            host=current_app.config["DB_HOST"],
            user=current_app.config["DB_USER"],
            password=current_app.config["DB_PASSWORD"],
            database=current_app.config["DB_NAME"],
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
    return g.db


def close_db(e=None):
    """Close the database connection at the end of a request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """
    Create all required tables if they do not exist.
    Called once when the Flask app starts.
    """
    db = pymysql.connect(
        host=current_app.config["DB_HOST"],
        user=current_app.config["DB_USER"],
        password=current_app.config["DB_PASSWORD"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

    with db.cursor() as cursor:
        # Create database if it doesn't exist
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{current_app.config['DB_NAME']}` "
            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        cursor.execute(f"USE `{current_app.config['DB_NAME']}`")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resumes (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                file_name   VARCHAR(255)  NOT NULL,
                upload_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                text_content LONGTEXT     NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                job_description LONGTEXT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ats_scores (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                resume_id        INT          NOT NULL,
                job_id           INT          NOT NULL,
                score            INT          NOT NULL,
                matched_keywords LONGTEXT,
                missing_keywords LONGTEXT,
                created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (resume_id) REFERENCES resumes(id),
                FOREIGN KEY (job_id)    REFERENCES jobs(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

    db.close()


def execute_query(sql: str, params=None, fetch_one=False, fetch_all=False, last_id=False):
    """
    Helper to run a SQL query with consistent error handling.

    Returns:
        Tuple (result, error_string | None)
    """
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(sql, params or ())
            db.commit()

            if fetch_one:
                return cursor.fetchone(), None
            if fetch_all:
                return cursor.fetchall(), None
            if last_id:
                return cursor.lastrowid, None
            return None, None
    except Exception as e:
        db.rollback()
        return None, str(e)