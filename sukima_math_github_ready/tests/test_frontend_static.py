from pathlib import Path

root = Path(__file__).resolve().parents[1]
frontend = root / "frontend"

learn = (frontend / "app" / "learn" / "page.tsx").read_text(encoding="utf-8")

for text in [
    "answerMode",
    "setAnswerMode",
    "解答をポンポン見る",
    "解答連続モード",
    "次の解答へ",
    "answer-mode-switch",
    "quick-mode-box",
]:
    assert text in learn

assert "answerMode: boolean" in learn
assert "setRevealed(answerMode)" in learn

css = (frontend / "app" / "globals.css").read_text(encoding="utf-8")
for text in ["v10.5 Answer Quick Mode", "answer-mode-switch", "active-mode-button", "quick-mode-box"]:
    assert text in css

print("FRONTEND_STATIC_CHECK_OK")
