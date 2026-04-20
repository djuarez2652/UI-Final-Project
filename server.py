from flask import Flask, render_template

app = Flask(__name__)


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


if __name__ == "__main__":
    app.run(debug=True)
