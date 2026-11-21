from flask import Flask, render_template

from backend.services.threat_service import get_all_threats
from backend.services.collection_service import (
    collect_nvd_data,
    collect_github_data,
)


app = Flask(
    __name__,
    template_folder="../../frontend/templates",
    static_folder="../../frontend/static"
)


@app.route("/")
def home():
    return render_template("dashboard.html")


@app.route("/threat-feed")
def threat_feed():
    return render_template("threat_feed.html")


@app.route("/api/health")
def api_health():
    return {
        "status": "online",
        "service": "CyberNexus API"
    }


@app.route("/api/threats")
def api_threats():
    threats = get_all_threats()

    return {
        "count": len(threats),
        "threats": threats
    }


@app.route("/api/collect/nvd", methods=["POST"])
def collect_nvd():
    result = collect_nvd_data(10)

    return result


@app.route("/api/collect/github", methods=["POST"])
def collect_github():
    result = collect_github_data(10)

    return result


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    return response