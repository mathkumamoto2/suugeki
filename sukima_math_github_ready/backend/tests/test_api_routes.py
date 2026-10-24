import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def post(path, payload):
    r = client.post(path, json=payload)
    assert r.status_code == 200, (path, r.status_code, r.text)
    return r.json()

assert client.get("/api/health").status_code == 200
llm = client.get("/api/llm/health")
assert llm.status_code == 200
assert client.get("/api/llm/health").status_code == 200

solve = post("/api/solve", {"input": "x^2e^x", "kind": "indefinite"})
assert solve["final_answer"]["tex"]
assert solve["steps"]

hint = post("/api/hint", {"input": "x^2e^x", "current_step": 0})
assert hint["mode"] == "hint"
assert hint["final_answer"] is None

check = post("/api/check", {"problem": "x^2e^x", "student_answer": "(x^2-2*x+2)*e^x"})
assert check["is_correct"] is True

diag = post("/api/diagnose", {"input": "x^2e^x"})
assert diag["diagnostics"]["review_order"]

work = post("/api/work-diagnose", {"input": "x^2e^x", "student_work": "(x^2-2*x+2)*e^x\nx^2-2*x+2*e^x"})
assert len(work["lines"]) == 2

graph = post("/api/visualize", {"input": "x^2", "lower": "0", "upper": "2"})
assert graph["points"]
assert graph["y_max"] != graph["y_min"]
assert graph["integral_value_tex"]
graph2 = post("/api/visualize", {"input": "sin(x)", "lower": "-3", "upper": "3"})
assert graph2["points"]
assert graph["function_tex"] != graph2["function_tex"]

slides = post("/api/slides", {"input": "x^2e^x"})
assert slides["slides"]

bad = client.post("/api/solve", json={"input": "a*x"})
assert bad.status_code == 400
assert "x のみ" in bad.text

print("API_ROUTE_TEST_OK")


hard = post("/api/solve", {"input": "e^(-x^2)", "kind": "indefinite"})
assert "erf" in hard["final_answer"]["tex"]
assert hard["steps"]

atan_case = post("/api/solve", {"input": "1/(1+x^2)", "kind": "indefinite"})
assert "atan" in atan_case["final_answer"]["tex"] or "tan^{-1}" in atan_case["final_answer"]["tex"] or "arctan" in atan_case["final_answer"]["tex"]


preview = client.post("/api/preview", json={"input": "x^2e^x", "kind": "indefinite"})
assert preview.status_code == 200, preview.text
assert "display_tex" in preview.json()

graph_a = client.post("/api/visualize", json={"input": "x^2", "lower": "-3", "upper": "3"}).json()
graph_b = client.post("/api/visualize", json={"input": "sin(x)", "lower": "-3", "upper": "3"}).json()
assert graph_a["function_tex"] != graph_b["function_tex"]
assert graph_a["points"] != graph_b["points"]


skill_map = client.get("/api/neo/skill-map")
assert skill_map.status_code == 200, skill_map.text
assert skill_map.json()["skills"]

missions = client.get("/api/neo/missions")
assert missions.status_code == 200, missions.text
assert missions.json()["daily"]

bank = client.get("/api/neo/practice-bank")
assert bank.status_code == 200, bank.text
assert bank.json()["levels"]


line = client.post("/api/neo/line-check", json={"problem": "x^2", "student_work": "x^3/3"})
assert line.status_code == 200, line.text
assert line.json()["line_results"]

mistake = client.post("/api/neo/mistake-classify", json={"problem": "x^2", "answer": "x^3/3"})
assert mistake.status_code == 200, mistake.text
assert mistake.json()["categories"]

similar = client.post("/api/neo/similar-problems", json={"input": "x^2e^x"})
assert similar.status_code == 200, similar.text
assert similar.json()["problems"]

review = client.post("/api/neo/review-plan", json={"input": "2*x*cos(x^2)"})
assert review.status_code == 200, review.text
assert review.json()["review_order"]

spaced = client.post("/api/neo/spaced-review", json={"input": "x^2"})
assert spaced.status_code == 200, spaced.text
assert spaced.json()["schedule"]


features = client.get("/api/ultimate/feature-matrix")
assert features.status_code == 200, features.text
assert features.json()["groups"]

hints = client.post("/api/neo/staged-hints", json={"input": "x^2e^x"})
assert hints.status_code == 200, hints.text
assert hints.json()["hints"]

score = client.post("/api/neo/partial-score", json={"problem": "x^2", "student_work": "x^3/3"})
assert score.status_code == 200, score.text
assert score.json()["score"] >= 0

weak = client.post("/api/neo/weakness-score", json={"topics": ["部分積分"], "mistakes": ["符号ミス"]})
assert weak.status_code == 200, weak.text
assert weak.json()["weakness_scores"]

suggest = client.post("/api/neo/input-suggestions", json={"input": "x2ex"})
assert suggest.status_code == 200, suggest.text
assert suggest.json()["suggestions"]

report = client.post("/api/neo/report-export", json={"input": "x^2"})
assert report.status_code == 200, report.text
assert "markdown" in report.json()

visual = client.post("/api/neo/visual-explain", json={"input": "x^2e^x"})
assert visual.status_code == 200, visual.text
assert "mode" in visual.json()


selftest = client.get("/api/system/self-test")
assert selftest.status_code == 200, selftest.text
assert selftest.json()["ok"] is True

critical_gets = [
    "/api/health",
    "/api/system/self-test",
    "/api/ultimate/feature-matrix",
    "/api/neo/skill-map",
    "/api/neo/missions",
    "/api/neo/practice-bank",
]

for path in critical_gets:
    r = client.get(path)
    assert r.status_code == 200, f"{path}: {r.text}"

critical_posts = [
    ("/api/preview", {"input": "x^2e^x", "kind": "indefinite"}),
    ("/api/solve", {"input": "x^2e^x", "kind": "indefinite"}),
    ("/api/visualize", {"input": "sin(x)", "lower": "-3", "upper": "3"}),
    ("/api/neo/line-check", {"problem": "x^2", "student_work": "x^3/3"}),
    ("/api/neo/mistake-classify", {"problem": "x^2", "answer": "x^3/3+C"}),
    ("/api/neo/similar-problems", {"input": "x^2e^x"}),
    ("/api/neo/review-plan", {"input": "2*x*cos(x^2)"}),
    ("/api/neo/spaced-review", {"input": "x^2"}),
    ("/api/neo/staged-hints", {"input": "x^2e^x"}),
    ("/api/neo/partial-score", {"problem": "x^2", "student_work": "x^3/3"}),
    ("/api/neo/weakness-score", {"topics": ["部分積分"], "mistakes": ["符号ミス"]}),
    ("/api/neo/input-suggestions", {"input": "x2ex"}),
    ("/api/neo/report-export", {"input": "x^2"}),
    ("/api/neo/visual-explain", {"input": "x^2e^x"}),
]

for path, payload in critical_posts:
    r = client.post(path, json=payload)
    assert r.status_code == 200, f"{path}: {r.text}"


focus = client.get("/api/focus/product-principles")
assert focus.status_code == 200, focus.text
assert focus.json()["visible_flows"]


# v9.1 regression: line-check should parse x/e expressions without "name x is not defined"
line_reg = client.post("/api/neo/line-check", json={
    "problem": "x^2e^x",
    "student_work": "x^2*e^x - 2*x*e^x + 2*e^x\n(x^2-2*x+2)*e^x"
})
assert line_reg.status_code == 200, line_reg.text
line_json = line_reg.json()
assert line_json["line_results"]
assert all(item["status"] != "parse_error" for item in line_json["line_results"]), line_json


dashboard = client.get("/api/focus/dashboard")
assert dashboard.status_code == 200, dashboard.text
assert dashboard.json()["daily_missions"]


# v9.4 dashboard still works
dash = client.get("/api/focus/dashboard")
assert dash.status_code == 200, dash.text
assert dash.json()["daily_missions"]


today = client.get("/api/focus/today")
assert today.status_code == 200, today.text
today_json = today.json()
assert today_json["problem"]
assert today_json["flow"]
assert today_json["missions"]


# v10.1 similar problem items include tex for UI
sim_ui = client.post("/api/neo/similar-problems", json={"input": "x^2e^x"})
assert sim_ui.status_code == 200, sim_ui.text
sim_json = sim_ui.json()
assert sim_json["problem_items"]
assert "tex" in sim_json["problem_items"][0]


hint_principle = client.get("/api/focus/hint-first-principle")
assert hint_principle.status_code == 200, hint_principle.text
assert hint_principle.json()["learning_loop"]
