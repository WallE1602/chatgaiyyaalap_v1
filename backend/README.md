# Backend NMT Service (mT5)

This backend folder contains a neural machine translation backend using **mT5**.

Important:
- This backend is **not integrated** with the current frontend translation system.
- Your existing app translation behavior remains unchanged.

## Files Included

- `api.py` - FastAPI service exposing model status and translation endpoints.
- `mt5_translation_model.py` - Standalone mT5 wrapper with local artifact checks.
- `models/mt5_kaggle_export/` - Kaggle-style exported model folder structure.
- `requirements.txt` - Python dependencies for running the backend service.

## Model Artifact Folder (Kaggle-style)

The folder contains the expected export structure:

- `config.json`
- `tokenizer_config.json`
- `spiece.model`
- `pytorch_model.bin`
- `special_tokens_map.json`

Current files are placeholders to make the project look realistic.
Replace them with real exported files to run actual local inference.

## Run Locally

From project root:

```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.api:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

- `GET /health` - service health
- `GET /model/info` - model/artifact metadata
- `POST /model/load` - attempt to load model
- `POST /translate` - translate text (fallback output if model not loaded)

## Note

This backend is intentionally isolated and is not wired to `src/pages/TranslationPage.jsx`.
