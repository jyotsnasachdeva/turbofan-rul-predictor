from __future__ import annotations

import json
import pickle
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from tensorflow import keras


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "model_export"
SUBSETS = ("FD001", "FD002", "FD003", "FD004")


app = FastAPI(
    title="Turbofan RUL Prediction API",
    description="Backend API for NASA C-MAPSS turbofan Remaining Useful Life prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    subset: Literal["FD001", "FD002", "FD003", "FD004"] = "FD001"
    values: list[list[float]] = Field(
        ...,
        description="Either 50 rows x 25 scaled features, or raw rows that can be scaled.",
    )
    already_scaled: bool = Field(
        True,
        description="Set false when sending raw feature rows that need StandardScaler preprocessing.",
    )


class PredictResponse(BaseModel):
    subset: str
    model_name: str
    raw_prediction: float
    predicted_rul_cycles: float
    risk_band: str
    input_shape: list[int]


def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


@lru_cache(maxsize=1)
def config() -> dict:
    return read_json(MODEL_DIR / "model_config.json")


@lru_cache(maxsize=4)
def load_model(subset: str):
    if subset not in SUBSETS:
        raise HTTPException(status_code=400, detail=f"Unknown subset: {subset}")
    return keras.models.load_model(MODEL_DIR / f"best_model_{subset}.keras", compile=False)


@lru_cache(maxsize=4)
def load_scaler(subset: str):
    with (MODEL_DIR / f"scaler_{subset}.pkl").open("rb") as file:
        return pickle.load(file)


def prepare_window(request: PredictRequest) -> np.ndarray:
    rows = np.asarray(request.values, dtype=np.float32)
    if rows.ndim != 2:
        raise HTTPException(status_code=422, detail="values must be a 2D array of rows and features")

    expected_features = int(config()["n_features"][request.subset])
    if rows.shape[1] != expected_features:
        raise HTTPException(
            status_code=422,
            detail=f"{request.subset} expects {expected_features} features per row; received {rows.shape[1]}",
        )

    window_size = int(config()["window_size"])
    if rows.shape[0] < window_size:
        raise HTTPException(
            status_code=422,
            detail=f"{request.subset} needs at least {window_size} cycles; received {rows.shape[0]}",
        )

    if not request.already_scaled:
        rows = load_scaler(request.subset).transform(rows).astype(np.float32)

    return rows[-window_size:].reshape(1, window_size, expected_features)


def risk_band(rul: float) -> str:
    if rul < 35:
        return "Critical"
    if rul < 70:
        return "Watch"
    return "Stable"


@app.get("/")
def root() -> dict:
    return {
        "message": "Turbofan RUL Prediction API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_dir_exists": MODEL_DIR.exists(),
        "subsets": list(SUBSETS),
    }


@app.get("/features/{subset}")
def features(subset: Literal["FD001", "FD002", "FD003", "FD004"]) -> dict:
    return {
        "subset": subset,
        "window_size": config()["window_size"],
        "features": config()["features"][subset],
    }


@app.get("/sample/{subset}", response_model=PredictResponse)
def sample_predict(subset: Literal["FD001", "FD002", "FD003", "FD004"]) -> PredictResponse:
    sample = np.load(MODEL_DIR / f"sample_input_{subset}.npy")[0]
    return predict(PredictRequest(subset=subset, values=sample.tolist(), already_scaled=True))


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    window = prepare_window(request)
    raw = float(load_model(request.subset).predict(window, verbose=0).reshape(-1)[0])
    rul_cap = float(config()["rul_cap"])
    rul = max(0.0, min(rul_cap, raw * rul_cap))
    model_key = config()["best_model_per_subset"][request.subset]

    return PredictResponse(
        subset=request.subset,
        model_name=model_key,
        raw_prediction=raw,
        predicted_rul_cycles=round(rul, 2),
        risk_band=risk_band(rul),
        input_shape=list(window.shape),
    )
