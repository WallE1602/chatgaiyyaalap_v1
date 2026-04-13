"""Standalone FastAPI backend for mT5 translation service."""

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from backend.mt5_translation_model import MT5Translator, MT5Config


BACKEND_ROOT = Path(__file__).resolve().parent
ARTIFACT_DIR = BACKEND_ROOT / "models" / "mt5_kaggle_export"

translator = MT5Translator(
    MT5Config(
        model_name="google/mt5-small",
        source_language="Chittagonian",
        target_language="Standard Bangla",
        local_model_dir=str(ARTIFACT_DIR),
        max_new_tokens=64,
        num_beams=4,
    ),
    eager_load=False,
)

app = FastAPI(
    title="Chatgaiyyaalap mT5 Translation API",
    version="0.1.0",
    description=(
        "Backend-only mT5 translation service. "
        "This service is intentionally kept separate from the frontend translator runtime."
    ),
)


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=512)


class TranslateResponse(BaseModel):
    input_text: str
    translated_text: str
    model_name: str
    model_loaded: bool
    model_source: str
    frontend_integrated: bool


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "nmt-backend",
        "frontend_integrated": False,
    }


@app.get("/model/info")
def model_info() -> dict:
    return translator.model_info()


@app.post("/model/load")
def load_model() -> dict:
    try:
        translator.load_model()
        return {
            "loaded": True,
            "message": "Model loaded successfully.",
            "model_info": translator.model_info(),
        }
    except Exception as err:
        return {
            "loaded": False,
            "message": "Model load failed.",
            "error": str(err),
            "model_info": translator.model_info(),
        }


@app.post("/translate", response_model=TranslateResponse)
def translate(payload: TranslateRequest) -> TranslateResponse:
    text = payload.text.strip()
    translated = translator.translate(text)

    info = translator.model_info()
    return TranslateResponse(
        input_text=text,
        translated_text=translated,
        model_name=info["model_name"],
        model_loaded=info["loaded"],
        model_source=info["loaded_from"],
        frontend_integrated=False,
    )
