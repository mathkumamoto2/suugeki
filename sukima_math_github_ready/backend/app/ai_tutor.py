from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .schemas import Slide, Step, Diagnostic


def load_local_env() -> None:
    """Load backend/.env without adding a dependency.

    Existing environment variables win over file values.
    """
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def strip_thinking(text: str) -> str:
    """Remove thinking traces sometimes produced by reasoning-tuned local models."""
    if not text:
        return ""

    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"Thinking\.\.\..*?\.\.\.done thinking\.", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"思考中.*?思考終了", "", text, flags=re.DOTALL)
    return text.strip()


def extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    cleaned = strip_thinking(text).strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        obj = json.loads(cleaned)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(cleaned[start : end + 1])
            return obj if isinstance(obj, dict) else None
        except Exception:
            return None
    return None


class OllamaClient:
    def __init__(self) -> None:
        load_local_env()
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.model = os.getenv("SUKIMA_LLM_MODEL", "qwen3:8b")
        self.timeout = float(os.getenv("SUKIMA_LLM_TIMEOUT", "45"))
        self.temperature = float(os.getenv("SUKIMA_LLM_TEMPERATURE", "0.2"))

    def health(self) -> Dict[str, Any]:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=4) as res:
                payload = json.loads(res.read().decode("utf-8"))
            models = payload.get("models", [])
            names = [m.get("name") for m in models if isinstance(m, dict)]
            return {
                "provider": "ollama",
                "available": self.model in names,
                "server_reachable": True,
                "model": self.model,
                "models": names,
                "base_url": self.base_url,
            }
        except Exception as exc:
            return {
                "provider": "ollama",
                "available": False,
                "server_reachable": False,
                "model": self.model,
                "models": [],
                "base_url": self.base_url,
                "error": str(exc),
            }

    def chat_json(self, system: str, user: str) -> Tuple[Optional[Dict[str, Any]], str]:
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "options": {
                "temperature": self.temperature,
                "num_ctx": 4096,
            },
        }

        req = urllib.request.Request(
            f"{self.base_url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                raw = json.loads(res.read().decode("utf-8"))
            content = strip_thinking(raw.get("message", {}).get("content", ""))
            return extract_json_object(content), content
        except urllib.error.HTTPError as exc:
            return None, f"Ollama HTTP error: {exc.code}"
        except Exception as exc:
            return None, f"Ollama error: {exc}"


class TutorModel:
    """Tutor layer.

    SymPy remains responsible for the answer.
    The LLM only improves explanations, hints, slides, and learning guidance.
    """

    def __init__(self) -> None:
        load_local_env()
        self.provider = os.getenv("SUKIMA_LLM_PROVIDER", "ollama").lower()
        self.client = OllamaClient() if self.provider == "ollama" else None

    def status(self) -> Dict[str, Any]:
        if self.client is None:
            return {
                "provider": self.provider,
                "available": False,
                "used": False,
                "message": "LLM provider is disabled.",
            }

        h = self.client.health()
        h["used"] = False
        return h

    def _system_prompt(self) -> str:
        return (
            "あなたは大学微積の学習支援AIです。"
            "計算結果はSymPyが保証済みなので、あなたは説明・ヒント・復習提案だけを改善します。"
            "最終解答やTeXを勝手に変更してはいけません。"
            "隠れた思考過程、chain-of-thought、Thinking過程は絶対に出力しないでください。"
            "必ず有効なJSONオブジェクトのみを返してください。Markdownは禁止です。"
        )

    def enhance_steps(
        self,
        *,
        problem_tex: str,
        final_answer_tex: str | None,
        steps: List[Step],
        hide_answer: bool = False,
    ) -> Tuple[List[Step], List[str], Dict[str, Any]]:
        status = self.status()
        auto_enhance = os.getenv("SUKIMA_LLM_AUTO_ENHANCE", "false").lower() in {"1", "true", "yes", "on"}

        if not auto_enhance:
            status["used"] = False
            status["auto_enhance"] = False
            return steps, [], status

        if self.client is None or not status.get("server_reachable", False):
            return steps, ["AI接続なし: 決定論的チューターで表示しています。"], status

        step_payload = [
            {
                "id": s.id,
                "title": s.title,
                "tex": s.tex,
                "explanation": s.explanation,
                "hint": s.hint,
                "topics": s.related_topics,
            }
            for s in steps[:6]
        ]

        user = json.dumps(
            {
                "task": "Improve Japanese tutoring text for a calculus app.",
                "rules": [
                    "Do not change tex.",
                    "Do not change IDs.",
                    "If hide_answer is true, hints must not reveal final answer.",
                    "Use concise, educational Japanese.",
                    "Mention prerequisite knowledge when useful.",
                ],
                "problem_tex": problem_tex,
                "final_answer_tex": None if hide_answer else final_answer_tex,
                "hide_answer": hide_answer,
                "steps": step_payload,
                "required_json_schema": {
                    "steps": [
                        {
                            "id": "same id",
                            "explanation": "improved explanation in Japanese",
                            "hint": "hint in Japanese",
                        }
                    ],
                    "summary": "short Japanese summary",
                },
            },
            ensure_ascii=False,
        )

        obj, raw = self.client.chat_json(self._system_prompt(), user)
        if not obj or not isinstance(obj.get("steps"), list):
            status["used"] = False
            return steps, [f"AI応答をJSONとして読めなかったためフォールバックしました: {raw[:120]}"], status

        by_id = {item.get("id"): item for item in obj["steps"] if isinstance(item, dict)}
        enhanced: List[Step] = []

        for step in steps:
            patch = by_id.get(step.id)
            if not patch:
                enhanced.append(step)
                continue

            explanation = strip_thinking(str(patch.get("explanation") or step.explanation))
            hint = strip_thinking(str(patch.get("hint") or step.hint))

            enhanced.append(
                step.model_copy(
                    update={
                        "explanation": explanation or step.explanation,
                        "hint": hint or step.hint,
                    }
                )
            )

        status["used"] = True
        status["summary"] = strip_thinking(str(obj.get("summary", "")))[:300]
        return enhanced, [], status

    def hint_for_step(self, step: Step, hide_answer: bool = True) -> str:
        return step.hint if hide_answer else step.explanation

    def slides_from_steps(self, steps: List[Step], final_tex: str | None = None) -> List[Slide]:
        slides = [
            Slide(
                title="問題の見立て",
                tex="",
                body="まず、式の形を観察します。どの公式に近いかを見抜くのが最初の一手です。",
                visual_hint="問題を大きなブロックとして見せ、関連単元をタグで表示する。",
            )
        ]

        for s in steps:
            slides.append(
                Slide(
                    title=s.title,
                    tex=s.tex,
                    body=s.explanation,
                    visual_hint="1ステップ1メッセージ。数式の変化部分だけを強調する。",
                )
            )

        if final_tex:
            slides.append(
                Slide(
                    title="最終解答",
                    tex=final_tex,
                    body="最後に検算します。積分の答えは微分して元の関数に戻れば正しいです。",
                    visual_hint="答えカードと検算カードを並べる。",
                )
            )

        return slides

    def diagnostic_summary(self, diagnostic: Diagnostic) -> str:
        fallback = (
            f"主単元は「{diagnostic.main_topic}」です。"
            f"まず「{diagnostic.review_order[0]}」から復習するとよいです。"
        )

        if self.client is None:
            return fallback

        status = self.client.health()
        if not status.get("server_reachable", False):
            return fallback

        user = json.dumps(
            {
                "task": "Create a short Japanese diagnostic summary.",
                "diagnostic": diagnostic.model_dump(),
                "required_json_schema": {"summary": "short Japanese text under 160 chars"},
            },
            ensure_ascii=False,
        )

        obj, _ = self.client.chat_json(self._system_prompt(), user)
        if obj and isinstance(obj.get("summary"), str):
            return strip_thinking(obj["summary"])[:220]

        return fallback
