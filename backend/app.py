from flask import Flask
from flask_cors import CORS
from config import Config
from routes.resume_routes import resume_bp
from routes.job_routes import job_bp
from database.db import init_db
 
app = Flask(__name__)
app.config.from_object(Config)
 
CORS(app)
 
# Register blueprints
app.register_blueprint(resume_bp)
app.register_blueprint(job_bp)
 
# Initialize database tables on startup
with app.app_context():
    init_db()
 
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
 