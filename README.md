# User Interface Design Final Project

## Setup (Python venv)

```bash
python3 -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt
```

## Run the Flask app

```bash
source .venv/bin/activate
flask --app server.py run --debug --port 8181
```

## Stop / exit

```bash
deactivate
```