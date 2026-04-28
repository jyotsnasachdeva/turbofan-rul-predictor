# Turbofan RUL Backend

FastAPI backend for serving the exported `.keras` turbofan RUL models.

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/docs
```

Useful endpoints:

- `GET /health`
- `GET /features/FD001`
- `GET /sample/FD001`
- `POST /predict`

## Deploy

Deploy this `backend` folder separately on Render, Railway, or another Python web service.
Set the start command to:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```
