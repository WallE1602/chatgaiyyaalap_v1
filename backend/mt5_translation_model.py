"""
mT5 Neural Machine Translation (NMT) backend module.

Important:
- This module is intentionally kept separate from the current frontend
  translation runtime.
- It provides backend model loading and inference utilities.

Suggested install (if you want to run this file locally):
    pip install transformers torch sentencepiece
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
except Exception:  # pragma: no cover - optional import guard
    AutoModelForSeq2SeqLM = None
    AutoTokenizer = None


REQUIRED_ARTIFACT_FILES: List[str] = [
    "config.json",
    "tokenizer_config.json",
    "spiece.model",
    "pytorch_model.bin",
    "special_tokens_map.json",
]


@dataclass
class MT5Config:
    """Configuration for mT5 translation runtime."""

    model_name: str = "google/mt5-small"
    source_language: str = "Chittagonian"
    target_language: str = "Standard Bangla"
    local_model_dir: str = "backend/models/mt5_kaggle_export"
    max_new_tokens: int = 64
    num_beams: int = 4


class MT5Translator:
    """Standalone backend translator based on mT5."""

    def __init__(self, config: Optional[MT5Config] = None, eager_load: bool = False):
        self.config = config or MT5Config()
        self.tokenizer = None
        self.model = None
        self.loaded_from = "not-loaded"
        self.last_load_error: Optional[str] = None

        if eager_load:
            self.load_model()

    def artifact_status(self) -> Dict[str, object]:
        """Report local artifact folder status for backend APIs."""
        model_dir = Path(self.config.local_model_dir)
        exists = model_dir.exists()
        missing_files = []

        if exists:
            missing_files = [
                file_name for file_name in REQUIRED_ARTIFACT_FILES
                if not (model_dir / file_name).exists()
            ]
        else:
            missing_files = REQUIRED_ARTIFACT_FILES.copy()

        return {
            "model_dir": str(model_dir),
            "model_dir_exists": exists,
            "required_files": REQUIRED_ARTIFACT_FILES,
            "missing_files": missing_files,
            "all_required_files_present": len(missing_files) == 0,
        }

    def load_model(self) -> None:
        """Load tokenizer/model from local artifacts if possible, else from hub."""
        if AutoTokenizer is None or AutoModelForSeq2SeqLM is None:
            raise RuntimeError(
                "transformers is not installed. Install with: pip install transformers torch sentencepiece"
            )

        status = self.artifact_status()
        prefer_local = status["all_required_files_present"]

        if prefer_local:
            try:
                local_path = status["model_dir"]
                self.tokenizer = AutoTokenizer.from_pretrained(local_path)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(local_path)
                self.loaded_from = "local-artifacts"
                self.last_load_error = None
                return
            except Exception as err:
                self.last_load_error = f"Local artifact load failed. Fallback to hub. Details: {err}"

        self.tokenizer = AutoTokenizer.from_pretrained(self.config.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.config.model_name)
        self.loaded_from = "huggingface-hub"

    def model_info(self) -> Dict[str, object]:
        """Model metadata for status endpoints."""
        return {
            "model_name": self.config.model_name,
            "source_language": self.config.source_language,
            "target_language": self.config.target_language,
            "loaded": self.model is not None and self.tokenizer is not None,
            "loaded_from": self.loaded_from,
            "last_load_error": self.last_load_error,
            "artifact_status": self.artifact_status(),
            "frontend_integrated": False,
        }

    def _prompt(self, text: str) -> str:
        return (
            f"translate {self.config.source_language} to "
            f"{self.config.target_language}: {text}"
        )

    def translate(self, text: str) -> str:
        """
        Translate text using mT5 if loaded.

        If model weights are not loaded, it returns a deterministic
        fallback output string.
        """
        cleaned = (text or "").strip()
        if not cleaned:
            return ""

        if self.model is None or self.tokenizer is None:
            return f"[mT5 fallback output] {self._prompt(cleaned)}"

        prompt = self._prompt(cleaned)
        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True)
        generated = self.model.generate(
            **inputs,
            max_new_tokens=self.config.max_new_tokens,
            num_beams=self.config.num_beams,
            early_stopping=True,
        )
        return self.tokenizer.decode(generated[0], skip_special_tokens=True)


def run_example() -> None:
    """Simple local entrypoint for quick manual verification."""
    model = MT5Translator(eager_load=False)
    sample_input = "mor matha betha oitase"
    sample_output = model.translate(sample_input)

    print("Model info:", model.model_info())
    print("Input :", sample_input)
    print("Output:", sample_output)


if __name__ == "__main__":
    run_example()
