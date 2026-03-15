-- ATS Scanner Database Schema
-- Run this file manually or let init_db() handle it automatically.

CREATE DATABASE IF NOT EXISTS ats_scanner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ats_scanner;

-- Stores uploaded resumes and their extracted text
CREATE TABLE IF NOT EXISTS resumes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    file_name    VARCHAR(255) NOT NULL,
    upload_date  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    text_content LONGTEXT     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stores job descriptions submitted by users
CREATE TABLE IF NOT EXISTS jobs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_description LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stores ATS score results linking a resume to a job
CREATE TABLE IF NOT EXISTS ats_scores (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    resume_id        INT      NOT NULL,
    job_id           INT      NOT NULL,
    score            INT      NOT NULL,
    matched_keywords LONGTEXT,
    missing_keywords LONGTEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id)    REFERENCES jobs(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;