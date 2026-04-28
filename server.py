import json
from pathlib import Path

from flask import Flask, abort, jsonify, render_template, request

app = Flask(__name__)

_DATA_PATH = Path(__file__).resolve().parent / "data.json"
_PROGRESS_PATH = Path(__file__).resolve().parent / "learn_progress.json"


def load_lessons():
    with _DATA_PATH.open(encoding="utf-8") as f:
        raw = json.load(f)
    return {int(key): lesson for key, lesson in raw.items()}


def load_progress():
    if not _PROGRESS_PATH.exists():
        return {}
    with _PROGRESS_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def save_progress(progress):
    with _PROGRESS_PATH.open("w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def format_duration(ms):
    total_seconds = max(0, int(ms) // 1000)
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


LESSONS = load_lessons()


@app.route("/")
def home():
    progress = load_progress()
    last_time_ms = progress.get("last_learn_time_ms")
    last_learn_time = format_duration(last_time_ms) if last_time_ms else None
    return render_template("welcome.html", last_learn_time=last_learn_time)


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/quiz")
def quiz():
    return render_template("quiz.html")


@app.route("/contact")
def contact():
    return render_template("contact.html")


@app.route("/learn/<int:lesson_id>")
def learn(lesson_id):
    lesson = LESSONS.get(lesson_id)
    if lesson is None:
        abort(404)
    return render_template("learn.html", lesson_id=lesson_id, lesson=lesson)


@app.post("/learn/time")
def save_learn_time():
    payload = request.get_json(silent=True) or {}
    elapsed_ms = payload.get("elapsed_ms")
    if not isinstance(elapsed_ms, (int, float)) or elapsed_ms <= 0:
        abort(400)

    elapsed_ms = int(elapsed_ms)
    progress = load_progress()
    progress["last_learn_time_ms"] = elapsed_ms
    save_progress(progress)
    return jsonify({"last_learn_time": format_duration(elapsed_ms)})


if __name__ == "__main__":
    app.run(debug=True)
