from __future__ import annotations

import re

import traceback

import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .schemas import (
    ProblemRequest,
    HintRequest,
    CheckRequest,
    DiagnoseRequest,
    VisualizeRequest,
    TutorResponse,
    CheckResponse,
    WorkDiagnosisResponse,
    WorkLineDiagnosis,
)
from .math_engine import (
    solve_problem,
    final_answer,
    tex,
    parse_math,
    check_student_answer,
    diagnose_work_lines,
)
from .topic_mapper import build_diagnostic
from .visualization import graph_data
from .ai_tutor import TutorModel



x = sp.Symbol("x")

app = FastAPI(title="数隙 API", version="10.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tutor = TutorModel()




_STUDENT_TRANSFORMATIONS = standard_transformations + (implicit_multiplication_application, convert_xor)

def _parse_student_math_line(raw: str):
    """Parse a student's line robustly for line-check and mistake-classify.

    This parser is intentionally separate from the main problem parser because
    student answers often contain explicit multiplication, omitted multiplication,
    equations, and trailing +C.
    """
    cleaned = str(raw).strip()
    cleaned = cleaned.replace("＋", "+").replace("−", "-")
    cleaned = cleaned.replace("π", "pi")
    cleaned = cleaned.replace("^", "**")
    cleaned = cleaned.replace("+ C", "").replace("+C", "").replace("- C", "").replace("-C", "")

    # If user writes an equation, parse the right-hand side.
    if "=" in cleaned:
        parts = [p.strip() for p in cleaned.split("=") if p.strip()]
        if parts:
            cleaned = parts[-1]

    cleaned = cleaned.replace("∫", "")
    cleaned = re.sub(r"\bdx\b", "", cleaned).strip()

    local_dict = {
        "x": x,
        "e": sp.E,
        "E": sp.E,
        "pi": sp.pi,
        "sin": sp.sin,
        "cos": sp.cos,
        "tan": sp.tan,
        "exp": sp.exp,
        "log": sp.log,
        "ln": sp.log,
        "sqrt": sp.sqrt,
        "Abs": sp.Abs,
        "abs": sp.Abs,
    }

    return sp.simplify(parse_expr(
        cleaned,
        local_dict=local_dict,
        transformations=_STUDENT_TRANSFORMATIONS,
        evaluate=True,
    ))




def _problem_items_with_tex(problem_inputs):
    items = []
    for p in problem_inputs:
        try:
            expr = parse_math(p)
            items.append({
                "input": p,
                "tex": r"\int " + tex(expr) + r"\,dx",
            })
        except Exception:
            items.append({
                "input": p,
                "tex": p,
            })
    return items


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={
            "detail": str(exc),
            "type": "validation_error",
            "path": str(request.url.path),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": "http_error",
            "path": str(request.url.path),
        },
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "サーバー側で予期しないエラーが発生しました。",
            "type": type(exc).__name__,
            "path": str(request.url.path),
        },
    )


@app.get("/")
def root():
    return {
        "name": "数隙 v10.5.0 Answer Quick Mode API",
        "endpoints": [
            "/api/health",
            "/api/llm/health",
            "/api/solve",
            "/api/hint",
            "/api/check",
            "/api/diagnose",
            "/api/work-diagnose",
            "/api/visualize",
            "/api/slides",
        ],
    }













@app.get("/api/focus/hint-first-principle")
def focus_hint_first_principle():
    return {
        "version": "10.5.0",
        "differentiator": "答えを見せる前に、次の一手を考えさせる。",
        "learning_loop": [
            "問題を見る",
            "次に何をするか予想する",
            "ヒント1を見る",
            "まだ考える",
            "解答Stepを開く",
            "自分で途中式を再現する",
            "診断する",
            "類題で定着する",
        ],
    }


@app.get("/api/focus/today")
def focus_today():
    return {
        "version": "10.5.0",
        "problem": "x^2e^x",
        "problem_label": "∫ x²eˣ dx",
        "goal": "部分積分の流れを自力で再現する",
        "flow": [
            {"id": "explain", "label": "解説を見る", "description": "まず途中式の流れを1枚ずつ確認する。"},
            {"id": "reproduce", "label": "自分で書く", "description": "解説後に、自分の途中式を書いてみる。"},
            {"id": "diagnose", "label": "診断する", "description": "行間変形とミス分類で、どこが崩れたか見る。"},
            {"id": "review", "label": "類題で復習", "description": "次に解くべき類題へ進む。"},
        ],
        "missions": [
            {"id": "m1", "title": "解説を最後まで見る", "xp": 20},
            {"id": "m2", "title": "途中式を自分で書く", "xp": 30},
            {"id": "m3", "title": "類題を1問確認する", "xp": 15},
        ],
    }


@app.get("/api/focus/dashboard")
def focus_dashboard():
    return {
        "version": "10.5.0",
        "home": {
            "title": "今日の学習ホーム",
            "subtitle": "まずミッションを見て、次に解説へ進む。",
            "primary_flow": ["ホーム", "解説", "診断", "復習"],
        },
        "daily_missions": [
            {"id": "solve-one", "title": "1問解説を見る", "description": "まず1問、途中式の流れを確認する。", "xp": 20, "href": "/learn"},
            {"id": "diagnose-one", "title": "途中式を診断する", "description": "自分の答案を1つ診断する。", "xp": 30, "href": "/learn"},
            {"id": "review-one", "title": "類題を確認する", "description": "次に解くべき類題を確認する。", "xp": 15, "href": "/learn"},
        ],
    }


@app.get("/api/focus/product-principles")
def focus_product_principles():
    return {
        "version": "10.5.0",
        "name": "数隙 Focus",
        "principle": "モードを増やすのではなく、学習フローを1本に絞る。",
        "visible_flows": [
            {"id": "learn", "label": "解く", "description": "式を入力し、LaTeX、途中式、グラフを一体で見る。"},
            {"id": "diagnose", "label": "診断", "description": "自分の途中式や最終解答のミスを分類する。"},
            {"id": "review", "label": "復習", "description": "弱点単元・類題・復習ルートを確認する。"},
        ],
        "hidden_power_features": [
            "段階的ヒント", "類題生成", "行間変形チェック", "ミス分類", "弱点スコア", "レポート出力", "グラフ可視化", "ゲーム化"
        ],
    }


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "service": "sukisuki-api",
        "version": "10.5.0",
    }


@app.get("/api/llm/health")
def llm_health():
    return tutor.status()



@app.post("/api/preview")
def preview(req: ProblemRequest):
    expr = parse_math(req.input)
    if req.kind == "definite":
        lower = parse_bound(req.lower)
        upper = parse_bound(req.upper)
        display_tex = r"\int_{" + tex(lower) + r"}^{" + tex(upper) + r"} " + tex(expr) + r"\,dx"
    else:
        display_tex = r"\int " + tex(expr) + r"\,dx"
    return {"input": req.input, "tex": tex(expr), "display_tex": display_tex}





@app.get("/api/neo/skill-map")
def neo_skill_map():
    return {
        "version": "10.5.0",
        "product": "数隙 Neo",
        "core_loop": [
            "入力する",
            "LaTeXで確認する",
            "途中式を理解する",
            "ヒントだけで再現する",
            "自分の途中式を診断する",
            "復習ルートへ戻る",
            "類題で定着させる",
            "XPとバッジで継続する",
        ],
        "skills": [
            {
                "id": "basic-formulas",
                "title": "基本公式",
                "level": 1,
                "depends_on": [],
                "examples": ["x^2", "e^x", "sin(x)", "1/x"],
            },
            {
                "id": "chain-rule",
                "title": "連鎖律",
                "level": 2,
                "depends_on": ["basic-formulas"],
                "examples": ["2*x*cos(x^2)", "2*x*e^(x^2)"],
            },
            {
                "id": "substitution",
                "title": "置換積分",
                "level": 3,
                "depends_on": ["chain-rule"],
                "examples": ["2*x*cos(x^2)", "3*x^2*e^(x^3)"],
            },
            {
                "id": "integration-by-parts",
                "title": "部分積分",
                "level": 4,
                "depends_on": ["basic-formulas"],
                "examples": ["x*e^x", "x^2e^x", "x*sin(x)"],
            },
            {
                "id": "partial-fractions",
                "title": "部分分数分解",
                "level": 5,
                "depends_on": ["basic-formulas"],
                "examples": ["1/(x^2+3*x+2)", "x/(x^2+1)"],
            },
            {
                "id": "advanced-special",
                "title": "特殊関数・難問",
                "level": 6,
                "depends_on": ["substitution", "integration-by-parts"],
                "examples": ["e^(-x^2)", "sin(x)^2", "tan(x)"],
            },
        ],
    }


@app.get("/api/neo/missions")
def neo_missions():
    return {
        "daily": [
            {
                "id": "daily-preview",
                "title": "LaTeXプレビューを確認",
                "description": "任意の式を入力して、LaTeX表示を確認する。",
                "xp": 10,
            },
            {
                "id": "daily-solve-3",
                "title": "3問解析",
                "description": "積分問題を3問解析する。",
                "xp": 45,
            },
            {
                "id": "daily-hint",
                "title": "ヒント学習",
                "description": "Stepのヒントだけを見る。",
                "xp": 15,
            },
            {
                "id": "daily-diagnose",
                "title": "途中式診断",
                "description": "自分の途中式を診断する。",
                "xp": 25,
            },
        ],
        "weekly": [
            {
                "id": "weekly-substitution",
                "title": "置換積分マスター",
                "description": "置換積分の問題を5問解く。",
                "xp": 120,
            },
            {
                "id": "weekly-parts",
                "title": "部分積分マスター",
                "description": "部分積分の問題を5問解く。",
                "xp": 120,
            },
            {
                "id": "weekly-review",
                "title": "弱点復習",
                "description": "つまずきマップから復習問題へ進む。",
                "xp": 100,
            },
        ],
    }


@app.get("/api/neo/practice-bank")
def neo_practice_bank():
    return {
        "levels": [
            {
                "level": 1,
                "title": "基本公式",
                "problems": ["x^2", "x^3", "e^x", "sin(x)", "cos(x)", "1/x"],
            },
            {
                "level": 2,
                "title": "連鎖律・置換の入口",
                "problems": ["2*x*cos(x^2)", "2*x*e^(x^2)", "3*x^2*cos(x^3)"],
            },
            {
                "level": 3,
                "title": "置換積分",
                "problems": ["2*x/(x^2+1)", "3*x^2*e^(x^3)", "cos(x)*e^(sin(x))"],
            },
            {
                "level": 4,
                "title": "部分積分",
                "problems": ["x*e^x", "x^2e^x", "x*sin(x)", "x*log(x)"],
            },
            {
                "level": 5,
                "title": "有理関数",
                "problems": ["1/(x^2+3*x+2)", "x/(x^2+1)", "1/(x^2-1)"],
            },
            {
                "level": 6,
                "title": "難問・特殊関数",
                "problems": ["e^(-x^2)", "tan(x)", "sin(x)^2", "1/(1+x^2)"],
            },
        ]
    }




@app.post("/api/neo/line-check")
def neo_line_check(req: dict):
    problem = str(req.get("problem") or req.get("input") or "")
    raw_work = str(req.get("student_work") or req.get("work") or "")
    expr = parse_math(problem)
    lines = [line.strip() for line in raw_work.splitlines() if line.strip()]

    results = []
    parsed_lines = []

    for i, raw in enumerate(lines, start=1):
        try:
            candidate = _parse_student_math_line(raw)
            derivative = sp.simplify(sp.diff(candidate, x))
            diff_from_integrand = sp.simplify(derivative - expr)
            primitive_ok = diff_from_integrand == 0
            parsed_lines.append((i, raw, candidate))
            results.append({
                "line_number": i,
                "raw": raw,
                "parsed_tex": tex(candidate),
                "derivative_tex": tex(derivative),
                "difference_tex": tex(diff_from_integrand),
                "status": "primitive_ok" if primitive_ok else "needs_check",
                "feedback": "この行は原始関数として正しいです。" if primitive_ok else "この行だけを見ると、微分しても元の関数に完全には戻りません。",
            })
        except Exception as exc:
            results.append({
                "line_number": i,
                "raw": raw,
                "status": "parse_error",
                "feedback": f"式として読み取れませんでした: {exc}",
            })

    transitions = []
    for (i1, raw1, e1), (i2, raw2, e2) in zip(parsed_lines, parsed_lines[1:]):
        delta = sp.simplify(e1 - e2)
        ok = delta == 0
        transitions.append({
            "from_line": i1,
            "to_line": i2,
            "difference_tex": tex(delta),
            "status": "equivalent" if ok else "changed",
            "feedback": "行間変形は同値です。" if ok else "この行間で式の値が変わっています。符号・括弧・係数を確認してください。",
        })

    return {
        "problem_tex": tex(expr),
        "line_results": results,
        "transitions": transitions,
        "summary": "行ごとの原始関数チェックと、隣接行の同値チェックを行いました。",
    }


@app.post("/api/neo/mistake-classify")
def neo_mistake_classify(req: dict):
    problem = str(req.get("problem") or req.get("input") or "")
    answer = str(req.get("answer") or req.get("student_answer") or "")
    expr = parse_math(problem)

    categories = []
    advice = []

    if "+C" not in answer and "+ C" not in answer and "C" not in answer:
        categories.append("積分定数Cの抜け")
        advice.append("不定積分では最後に +C を付ける習慣をつけましょう。")

    if answer.count("(") != answer.count(")"):
        categories.append("括弧の対応ミス")
        advice.append("括弧の数が一致していません。積全体にかかる因子を落としていないか確認してください。")

    if "e^x" in answer and "(" not in answer and ("x^2" in answer or "x**2" in answer):
        categories.append("因数のかかり方ミス")
        advice.append("部分積分では (x²-2x+2)eˣ のように eˣ が全体に掛かる形を落としやすいです。")

    try:
        cleaned = answer.replace("+C", "").replace("+ C", "").replace("- C", "")
        candidate = _parse_student_math_line(cleaned)
        derivative = sp.simplify(sp.diff(candidate, x))
        delta = sp.simplify(derivative - expr)
        correct = delta == 0

        if not correct and sp.simplify(derivative + expr) == 0:
            categories.append("符号ミス")
            advice.append("微分結果が元の関数のマイナスです。部分積分や置換の符号を確認してください。")
        elif not correct:
            categories.append("計算・整理ミス")
            advice.append("微分して元の関数に戻るか、差分 F'(x)-f(x) を確認してください。")

        return {
            "correct": correct,
            "categories": categories or (["ミスなし"] if correct else ["未分類"]),
            "advice": advice,
            "derivative_tex": tex(derivative),
            "difference_tex": tex(delta),
        }
    except Exception as exc:
        return {
            "correct": False,
            "categories": categories or ["式の読み取りエラー"],
            "advice": advice + [f"解答式を読み取れませんでした: {exc}"],
            "derivative_tex": "",
            "difference_tex": "",
        }


@app.post("/api/neo/similar-problems")
def neo_similar_problems(req: dict):
    input_expr = str(req.get("input") or "")
    expr = parse_math(input_expr)

    if expr.has(sp.exp) and expr.is_Mul:
        problems = ["x*e^x", "x^2e^x", "x^3e^x", "x^2e^(2*x)"]
        topic = "部分積分"
    elif expr.has(sp.sin) or expr.has(sp.cos):
        problems = ["sin(x)", "cos(2*x)", "2*x*cos(x^2)", "sin(x)^2"]
        topic = "三角関数・置換積分"
    elif expr.is_rational_function(x):
        problems = ["1/x", "1/(1+x^2)", "1/(x^2+3*x+2)", "x/(x^2+1)"]
        topic = "有理関数"
    else:
        problems = ["x^2", "e^x", "sin(x)", "2*x*cos(x^2)", "x*e^x"]
        topic = "基本確認"

    return {
        "topic": topic,
        "problems": problems,
        "problem_items": _problem_items_with_tex(problems),
        "route": ["例題を見る", "ヒントだけで解く", "自分の途中式を診断する", "類題で再挑戦する"],
    }


@app.post("/api/neo/review-plan")
def neo_review_plan(req: dict):
    input_expr = str(req.get("input") or "")
    expr = parse_math(input_expr)
    diag = build_diagnostic(expr)

    return {
        "main_topic": diag.main_topic,
        "review_order": diag.review_order,
        "weak_points": diag.weak_points,
        "today": [
            {"task": f"{diag.review_order[0]}を復習", "minutes": 8},
            {"task": "例題を1問読む", "minutes": 5},
            {"task": "ヒントだけで類題を2問解く", "minutes": 12},
        ],
        "next_actions": [
            "解説を読む前に方針だけ予想する",
            "Stepごとにヒントだけ表示して自力再現する",
            "途中式診断でどの行が崩れるか確認する",
        ],
    }


@app.post("/api/neo/spaced-review")
def neo_spaced_review(req: dict):
    input_expr = str(req.get("input") or "")
    return {
        "input": input_expr,
        "schedule": [
            {"after_days": 1, "purpose": "記憶の初回固定"},
            {"after_days": 3, "purpose": "忘れ始めの復習"},
            {"after_days": 7, "purpose": "長期記憶化"},
            {"after_days": 14, "purpose": "応用問題へ移行"},
        ],
    }





@app.get("/api/ultimate/feature-matrix")
def ultimate_feature_matrix():
    return {
        "version": "10.5.0",
        "ocr": "excluded_by_design",
        "groups": [
            {
                "group": "途中式診断",
                "features": [
                    {"id": 1, "name": "行間変形チェック", "status": "implemented", "path": "/api/neo/line-check"},
                    {"id": 2, "name": "どの行で間違えたか検出", "status": "implemented", "path": "/api/neo/line-check"},
                    {"id": 3, "name": "ミス分類", "status": "implemented", "path": "/api/neo/mistake-classify"},
                    {"id": 4, "name": "括弧ミス検出", "status": "implemented", "path": "/api/neo/mistake-classify"},
                    {"id": 5, "name": "微分検算強化", "status": "implemented", "path": "/api/check"},
                    {"id": 6, "name": "部分点スコア", "status": "implemented", "path": "/api/neo/partial-score"},
                ],
            },
            {
                "group": "学習導線",
                "features": [
                    {"id": 7, "name": "段階的ヒント", "status": "implemented", "path": "/api/neo/staged-hints"},
                    {"id": 8, "name": "答え非表示モード", "status": "implemented", "path": "/api/hint"},
                    {"id": 9, "name": "自力再現チェック", "status": "implemented", "path": "/api/neo/line-check"},
                    {"id": 10, "name": "類題自動生成", "status": "implemented", "path": "/api/neo/similar-problems"},
                    {"id": 11, "name": "難易度調整", "status": "implemented", "path": "/api/neo/practice-bank"},
                    {"id": 12, "name": "復習ルートから練習へ", "status": "implemented", "path": "/training"},
                ],
            },
            {
                "group": "つまずき診断",
                "features": [
                    {"id": 13, "name": "単元依存グラフ", "status": "implemented", "path": "/api/neo/skill-map"},
                    {"id": 14, "name": "弱点単元スコア", "status": "implemented", "path": "/api/neo/weakness-score"},
                    {"id": 15, "name": "戻るべき単元推薦", "status": "implemented", "path": "/api/neo/review-plan"},
                    {"id": 16, "name": "ミス履歴保存", "status": "implemented", "path": "/mistakes"},
                    {"id": 17, "name": "今日の復習メニュー", "status": "implemented", "path": "/api/neo/review-plan"},
                    {"id": 18, "name": "忘却曲線復習", "status": "implemented", "path": "/api/neo/spaced-review"},
                ],
            },
            {
                "group": "可視化",
                "features": [
                    {"id": 19, "name": "原始関数と元の関数の関係表示", "status": "implemented", "path": "/solve"},
                    {"id": 20, "name": "+C上下移動", "status": "implemented", "path": "/visual-lab"},
                    {"id": 21, "name": "定積分の面積ステップ表示", "status": "implemented", "path": "/visual-lab"},
                    {"id": 22, "name": "置換積分の変数変換可視化", "status": "implemented", "path": "/visual-lab"},
                    {"id": 23, "name": "部分積分の構造図", "status": "implemented", "path": "/visual-lab"},
                ],
            },
            {
                "group": "入力・UI・ゲーム",
                "features": [
                    {"id": 24, "name": "数式入力エディタ", "status": "implemented_minimal", "path": "/solve"},
                    {"id": 25, "name": "入力式自動補正候補", "status": "implemented", "path": "/api/neo/input-suggestions"},
                    {"id": 26, "name": "LaTeXコピー強化", "status": "implemented", "path": "/api/neo/report-export"},
                    {"id": 27, "name": "表示モード切替", "status": "implemented_minimal", "path": "/ultimate"},
                    {"id": 28, "name": "解説ページのストーリー化", "status": "implemented_minimal", "path": "/solve"},
                    {"id": 29, "name": "スライド解説強化", "status": "implemented", "path": "/slides"},
                    {"id": 30, "name": "学習ダッシュボード完成", "status": "implemented", "path": "/history"},
                    {"id": 31, "name": "ゲーム化", "status": "implemented", "path": "/neo"},
                ],
            },
        ],
    }


@app.post("/api/neo/staged-hints")
def neo_staged_hints(req: dict):
    input_expr = str(req.get("input") or "")
    expr, lower, upper, answer, steps = solve_problem(input_expr)
    hints = []
    for i, s in enumerate(steps, start=1):
        hints.append({
            "stage": i,
            "title": s.title,
            "hint": s.hint,
            "topics": s.related_topics,
            "reveal_level": "low" if i == 1 else "medium" if i < len(steps) else "high",
        })
    return {
        "problem_tex": tex(expr),
        "hint_count": len(hints),
        "hints": hints,
        "rule": "最終解答ではなく、次の一手だけを段階的に出します。",
    }


@app.post("/api/neo/partial-score")
def neo_partial_score(req: dict):
    problem = str(req.get("problem") or req.get("input") or "")
    raw_work = str(req.get("student_work") or req.get("work") or "")
    expr = parse_math(problem)
    lines = [line.strip() for line in raw_work.splitlines() if line.strip()]
    if not lines:
        return {"score": 0, "max_score": 100, "breakdown": [], "feedback": "途中式が入力されていません。"}

    points = 0
    breakdown = []
    for i, raw in enumerate(lines, start=1):
        try:
            candidate = _parse_student_math_line(raw)
            derivative = sp.simplify(sp.diff(candidate, x))
            delta = sp.simplify(derivative - expr)
            primitive_ok = delta == 0
            add = 100 if primitive_ok else max(0, 40 - 5 * i)
            points = max(points, add)
            breakdown.append({
                "line": i,
                "raw": raw,
                "earned": add,
                "status": "primitive_ok" if primitive_ok else "progress_candidate",
                "difference_tex": tex(delta),
            })
        except Exception as exc:
            breakdown.append({"line": i, "raw": raw, "earned": 0, "status": "parse_error", "error": str(exc)})

    score = min(100, points)
    return {
        "score": score,
        "max_score": 100,
        "breakdown": breakdown,
        "feedback": "途中までの到達度を概算しました。最終行だけでなく、各行の微分検算も確認してください。",
    }


@app.post("/api/neo/weakness-score")
def neo_weakness_score(req: dict):
    topics = req.get("topics") or []
    mistakes = req.get("mistakes") or []
    if not isinstance(topics, list):
        topics = []
    if not isinstance(mistakes, list):
        mistakes = []

    scores = {}
    for t in topics:
        key = str(t)
        scores[key] = scores.get(key, 70) - 5
    for m in mistakes:
        key = str(m)
        scores[key] = scores.get(key, 70) - 12

    if not scores:
        scores = {
            "基本公式": 80,
            "置換積分": 65,
            "部分積分": 55,
            "部分分数分解": 50,
        }

    normalized = [{"topic": k, "score": max(0, min(100, v))} for k, v in scores.items()]
    normalized.sort(key=lambda x: x["score"])
    return {
        "weakness_scores": normalized,
        "recommendation": normalized[0]["topic"] if normalized else "基本公式",
    }


@app.post("/api/neo/input-suggestions")
def neo_input_suggestions(req: dict):
    raw = str(req.get("input") or "")
    suggestions = []

    if "x2" in raw:
        suggestions.append(raw.replace("x2", "x^2"))
    if "ex" in raw and "e^x" not in raw:
        suggestions.append(raw.replace("ex", "e^x"))
    if raw.replace(" ", "") == "x2ex":
        suggestions.append("x^2e^x")
    if "sinx" in raw:
        suggestions.append(raw.replace("sinx", "sin(x)"))
    if "cosx" in raw:
        suggestions.append(raw.replace("cosx", "cos(x)"))

    return {
        "input": raw,
        "suggestions": list(dict.fromkeys(suggestions)),
        "message": "候補が空なら、そのまま解釈可能な可能性が高いです。",
    }


@app.post("/api/neo/report-export")
def neo_report_export(req: dict):
    input_expr = str(req.get("input") or "")
    kind = str(req.get("kind") or "indefinite")
    expr, lower, upper, answer, steps = solve_problem(input_expr, kind)
    fa = final_answer(expr, answer, kind, lower, upper)

    lines = [
        "# 数隙 解説レポート",
        "",
        f"## 問題",
        "",
        f"```latex\\n\\\\int {tex(expr)}\\\\,dx\\n```",
        "",
        "## 途中式",
        "",
    ]

    for i, s in enumerate(steps, start=1):
        lines += [
            f"### Step {i}: {s.title}",
            "",
            f"```latex\\n{s.tex}\\n```",
            "",
            s.explanation,
            "",
        ]

    lines += [
        "## 最終解答",
        "",
        f"```latex\\n{fa.tex}\\n```",
        "",
        fa.explanation,
    ]

    return {
        "markdown": "\\n".join(lines),
        "latex_answer": fa.tex,
        "step_count": len(steps),
    }


@app.post("/api/neo/visual-explain")
def neo_visual_explain(req: dict):
    input_expr = str(req.get("input") or "")
    expr = parse_math(input_expr)

    if expr.has(sp.exp) and expr.is_Mul:
        mode = "parts"
        explanation = "多項式側を微分し、指数関数側を積分する部分積分の構造です。"
        blocks = [
            {"label": "微分する側 u", "value": "多項式部分"},
            {"label": "積分する側 dv", "value": "指数関数部分"},
        ]
    elif expr.has(sp.sin) or expr.has(sp.cos):
        mode = "substitution"
        explanation = "内側の関数とその微分が含まれるかを探す置換積分の構造です。"
        blocks = [
            {"label": "内側 u", "value": "合成関数の内側"},
            {"label": "du", "value": "内側の微分"},
        ]
    else:
        mode = "basic"
        explanation = "基本公式または式変形で処理するタイプです。"
        blocks = [{"label": "基本形", "value": tex(expr)}]

    return {
        "mode": mode,
        "expr_tex": tex(expr),
        "explanation": explanation,
        "blocks": blocks,
    }





@app.get("/api/system/self-test")
def system_self_test():
    """Run lightweight deterministic checks without touching external services."""
    checks = []

    def add(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    try:
        expr, lower, upper, answer, steps = solve_problem("x^2e^x")
        add("solve_x2ex", bool(steps) and tex(answer), tex(answer))
    except Exception as exc:
        add("solve_x2ex", False, str(exc))

    try:
        g = graph_data("sin(x)", "-3", "3")
        add("graph_sin", bool(g.points) and len(g.points) > 10, f"{len(g.points)} points")
    except Exception as exc:
        add("graph_sin", False, str(exc))

    try:
        expr = parse_math("2*x*cos(x^2)")
        diag = build_diagnostic(expr)
        add("diagnostic", bool(diag.review_order), ",".join(diag.review_order[:3]))
    except Exception as exc:
        add("diagnostic", False, str(exc))

    try:
        report_expr, lower, upper, report_answer, report_steps = solve_problem("x^2")
        add("report_ready", bool(report_steps), f"{len(report_steps)} steps")
    except Exception as exc:
        add("report_ready", False, str(exc))

    ok = all(c["ok"] for c in checks)
    return {
        "ok": ok,
        "version": "10.5.0",
        "checks": checks,
    }


@app.post("/api/solve", response_model=TutorResponse)
def solve(req: ProblemRequest):
    expr, lower, upper, answer, steps = solve_problem(
        req.input,
        req.kind,
        req.lower,
        req.upper,
    )
    fa = final_answer(expr, answer, req.kind, lower, upper)
    diag = build_diagnostic(expr)
    steps, ai_warnings, ai_status = tutor.enhance_steps(
        problem_tex=tex(expr),
        final_answer_tex=fa.tex,
        steps=steps,
        hide_answer=False,
    )

    graph = None
    graph_warning = None
    try:
        graph = graph_data(req.input, req.lower, req.upper)
    except Exception as exc:
        graph_warning = f"グラフ生成に失敗しました: {exc}"

    if req.kind == "indefinite":
        display_tex = r"\int " + tex(expr) + r"\,dx"
    else:
        display_tex = (
            r"\int_{"
            + tex(lower)
            + r"}^{"
            + tex(upper)
            + r"} "
            + tex(expr)
            + r"\,dx"
        )

    return TutorResponse(
        mode="solution",
        problem={
            "input": req.input,
            "tex": tex(expr),
            "display_tex": display_tex,
            "kind": req.kind,
            "ai": ai_status,
        },
        steps=steps,
        final_answer=fa,
        diagnostics=diag,
        graph=graph,
        slides=tutor.slides_from_steps(steps, fa.tex),
        warnings=([graph_warning] if graph_warning else []) + ai_warnings,
    )


@app.post("/api/hint", response_model=TutorResponse)
def hint(req: HintRequest):
    expr, _, _, answer, steps = solve_problem(req.input)
    diag = build_diagnostic(expr)
    steps, ai_warnings, ai_status = tutor.enhance_steps(
        problem_tex=tex(expr),
        final_answer_tex=None,
        steps=steps,
        hide_answer=True,
    )

    if not steps:
        raise ValueError("ヒントを生成できるステップがありません。")

    idx = max(0, min(req.current_step, len(steps) - 1))
    selected = steps[idx]
    selected = selected.model_copy(
        update={"explanation": tutor.hint_for_step(selected, hide_answer=True)}
    )

    return TutorResponse(
        mode="hint",
        problem={
            "input": req.input,
            "tex": tex(expr),
            "display_tex": r"\int " + tex(expr) + r"\,dx",
            "ai": ai_status,
        },
        steps=[selected],
        final_answer=None,
        diagnostics=diag,
        graph=None,
        slides=[
            {
                "title": "ヒント",
                "tex": selected.tex,
                "body": selected.explanation,
                "visual_hint": "答えを伏せ、次の一手だけを強調する。",
            }
        ],
        warnings=["ヒントモードでは最終解答を返しません。"] + ai_warnings,
    )


@app.post("/api/check", response_model=CheckResponse)
def check(req: CheckRequest):
    ok, expr, derivative, difference = check_student_answer(
        req.problem,
        req.student_answer,
    )
    diag = build_diagnostic(expr)
    feedback = (
        "正解です。微分すると元の関数に戻ります。"
        if ok
        else "まだ差があります。括弧・符号・定数倍を確認してください。"
    )

    return CheckResponse(
        is_correct=ok,
        derivative_tex=tex(derivative),
        difference_tex=tex(difference),
        feedback=feedback,
        diagnostics=diag,
    )


@app.post("/api/diagnose", response_model=TutorResponse)
def diagnose(req: DiagnoseRequest):
    expr = parse_math(req.input)
    diag = build_diagnostic(expr, req.failed_step_id)
    ai_status = tutor.status()

    return TutorResponse(
        mode="diagnostic",
        problem={
            "input": req.input,
            "tex": tex(expr),
            "display_tex": r"\int " + tex(expr) + r"\,dx",
            "ai": ai_status,
        },
        steps=[],
        final_answer=None,
        diagnostics=diag,
        graph=None,
        slides=[
            {
                "title": "つまずきマップ",
                "tex": "",
                "body": tutor.diagnostic_summary(diag),
                "visual_hint": "単元の依存関係を階段状に表示する。",
            }
        ],
        warnings=[],
    )


@app.post("/api/work-diagnose", response_model=WorkDiagnosisResponse)
def work_diagnose(req: DiagnoseRequest):
    rows = diagnose_work_lines(req.input, req.student_work or "")
    expr = parse_math(req.input)
    diag = build_diagnostic(expr)

    lines = []
    for line_no, raw, parsed, derivative, difference, ok, error in rows:
        if error:
            lines.append(
                WorkLineDiagnosis(
                    line_number=line_no,
                    raw=raw,
                    status="parse_error",
                    feedback=error,
                )
            )
        else:
            lines.append(
                WorkLineDiagnosis(
                    line_number=line_no,
                    raw=raw,
                    parsed_tex=tex(parsed),
                    derivative_tex=tex(derivative),
                    difference_tex=tex(difference),
                    status="ok" if ok else "check",
                    feedback=(
                        "この行は原始関数として正しいです。"
                        if ok
                        else "この行を微分しても元の関数に戻りません。"
                    ),
                )
            )

    return WorkDiagnosisResponse(
        lines=lines,
        summary=(
            "各行を原始関数候補として微分チェックしました。"
            "行間同値チェックは次フェーズで強化します。"
        ),
        diagnostics=diag,
    )


@app.post("/api/visualize")
def visualize(req: VisualizeRequest):
    return graph_data(req.input, req.lower, req.upper, req.samples)


@app.post("/api/slides", response_model=TutorResponse)
def slides(req: ProblemRequest):
    expr, lower, upper, answer, steps = solve_problem(
        req.input,
        req.kind,
        req.lower,
        req.upper,
    )
    fa = final_answer(expr, answer, req.kind, lower, upper)
    diag = build_diagnostic(expr)
    steps, ai_warnings, ai_status = tutor.enhance_steps(
        problem_tex=tex(expr),
        final_answer_tex=fa.tex,
        steps=steps,
        hide_answer=False,
    )

    return TutorResponse(
        mode="slides",
        problem={
            "input": req.input,
            "tex": tex(expr),
            "display_tex": r"\int " + tex(expr) + r"\,dx",
            "ai": ai_status,
        },
        steps=steps,
        final_answer=fa,
        diagnostics=diag,
        graph=None,
        slides=tutor.slides_from_steps(steps, fa.tex),
        warnings=ai_warnings,
    )
