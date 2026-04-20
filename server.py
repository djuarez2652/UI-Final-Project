import json
from pathlib import Path

from flask import Flask, abort, render_template

app = Flask(__name__)

_DATA_PATH = Path(__file__).resolve().parent / "data.json"


def load_lessons():
    with _DATA_PATH.open(encoding="utf-8") as f:
        raw = json.load(f)
    return {int(key): lesson for key, lesson in raw.items()}


LESSONS = load_lessons()


@app.route("/")
def home():
    return render_template("welcome.html")


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


if __name__ == "__main__":
    app.run(debug=True)
