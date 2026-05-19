"""
Gemini ortak yardimcilari.

Tum AI servisleri once yerel ve aciklanabilir hesaplamayi kullanir; Gemini
aktifse bu sonucu tarimsal baglamla birlikte yeniden degerlendirir.
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(ROOT_DIR / ".env")

try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    GEMINI_AVAILABLE = False


def gemini_is_ready() -> bool:
    return GEMINI_AVAILABLE and bool(os.getenv("GEMINI_API_KEY", ""))


def extract_json(raw_text: str) -> dict[str, Any] | None:
    text = (raw_text or "").strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


async def generate_gemini_json(
    prompt: str,
    *,
    system_instruction: str,
    image_bytes: bytes | None = None,
    mime_type: str = "image/jpeg",
    model_name: str = "gemini-2.0-flash",
) -> dict[str, Any] | None:
    if not gemini_is_ready():
        return None

    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    model_candidates = [model_name, "gemini-1.5-flash", "gemini-1.5-flash-8b"]
    for candidate in dict.fromkeys(model_candidates):
        try:
            model = genai.GenerativeModel(
                model_name=candidate,
                system_instruction=system_instruction,
            )
            if image_bytes:
                image_part = {
                    "mime_type": mime_type or "image/jpeg",
                    "data": base64.b64encode(image_bytes).decode("utf-8"),
                }
                response = model.generate_content([prompt, image_part])
            else:
                response = model.generate_content(prompt)
            parsed = extract_json(response.text)
            if parsed is not None:
                parsed["_gemini_model"] = candidate
                return parsed
        except Exception:
            continue
    return None
