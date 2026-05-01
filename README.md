# Turbofan RUL Predictor

Deep learning project for Remaining Useful Life (RUL) prediction on NASA C-MAPSS turbofan engine degradation data.

This repository contains my final Jupyter notebook, experiment outputs, and model comparison results for turbofan engine predictive maintenance. The goal is to estimate how many cycles remain before engine failure using multivariate time-series sensor data.

## Live Links

- Website: https://jyotsna-turbofan-rul-predictor.vercel.app/?api=https://turbofan-rul-api.onrender.com
- Frontend only: https://jyotsna-turbofan-rul-predictor.vercel.app/
- Backend health: https://turbofan-rul-api.onrender.com/health
- API docs: https://turbofan-rul-api.onrender.com/docs

## Structure

```text
index.html              # static frontend entry
styles.css
app.js
assets/                 # frontend images
backend/                # FastAPI model API
model_export/           # exported .keras models, scalers, configs, samples
notebooks/              # final Jupyter notebook
PROJECT_README.md       # original ML project README
render.yaml             # Render backend deployment config
vercel.json             # Vercel frontend config
```

## Run frontend locally

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173/
```

## Run backend locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then open:

```text
http://localhost:8000/docs
```

To make the frontend call the backend locally:

```text
http://localhost:5173/?api=http://localhost:8000
```

## Deploy

Deploy the frontend with Vercel from the repository root. Deploy the backend separately on Render using `render.yaml`.

After the backend is live, open the frontend with:

```text
https://your-frontend.vercel.app/?api=https://your-backend.onrender.com
```
