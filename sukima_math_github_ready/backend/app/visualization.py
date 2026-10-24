from __future__ import annotations

import math
from typing import Callable, List, Tuple

import sympy as sp

from .math_engine import parse_math, parse_bound, tex, x
from .schemas import GraphData, GraphPoint


def _safe_float(value: sp.Expr) -> float:
    return float(sp.N(value))


def _nice_domain(lower: str, upper: str) -> Tuple[float, float]:
    lo = _safe_float(parse_bound(lower))
    hi = _safe_float(parse_bound(upper))

    if not math.isfinite(lo) or not math.isfinite(hi):
        raise ValueError("グラフ範囲には有限の数を指定してください。")

    if lo == hi:
        hi = lo + 1.0

    if lo > hi:
        lo, hi = hi, lo

    return lo, hi


def _pad_range(min_value: float, max_value: float, ratio: float = 0.14) -> Tuple[float, float]:
    if min_value == max_value:
        delta = abs(min_value) * 0.2 + 1.0
        return min_value - delta, max_value + delta

    delta = (max_value - min_value) * ratio
    return min_value - delta, max_value + delta


def _sample(fn: Callable[[float], float], lo: float, hi: float, samples: int) -> List[GraphPoint]:
    points: List[GraphPoint] = []

    for i in range(samples):
        t = lo + (hi - lo) * i / (samples - 1)
        try:
            y = float(fn(t))
            if not math.isfinite(y) or abs(y) > 1e8:
                continue
            points.append(GraphPoint(x=t, y=y))
        except Exception:
            continue

    return points


def graph_data(input_expr: str, lower: str = "-3", upper: str = "3", samples: int = 240) -> GraphData:
    """Generate expression-specific function and primitive graph data.

    v4.0 focus:
    - current function curve
    - shaded integral interval
    - primitive function curve
    - +C family preview by vertical shifts
    """
    expr = parse_math(input_expr)
    lo, hi = _nice_domain(lower, upper)
    samples = max(48, min(int(samples), 900))

    fn = sp.lambdify(x, expr, "math")
    points = _sample(fn, lo, hi, samples)

    if len(points) < 2:
        raise ValueError("この式は指定範囲でグラフ化できませんでした。範囲を変えてください。")

    primitive_tex = None
    primitive_points: List[GraphPoint] = []
    up_points: List[GraphPoint] = []
    down_points: List[GraphPoint] = []

    try:
        primitive = sp.simplify(sp.integrate(expr, x))
        if not primitive.has(sp.Integral):
            primitive_tex = r"F(x)=" + tex(primitive)
            pfn = sp.lambdify(x, primitive, "math")
            primitive_points = _sample(pfn, lo, hi, samples)

            if primitive_points:
                y_values = [p.y for p in primitive_points]
                span = max(y_values) - min(y_values)
                shift = span * 0.18 + 1.0
                up_points = [GraphPoint(x=p.x, y=p.y + shift) for p in primitive_points]
                down_points = [GraphPoint(x=p.x, y=p.y - shift) for p in primitive_points]
    except Exception:
        primitive_tex = None

    all_y = [p.y for p in points] + [0.0]
    all_y += [p.y for p in primitive_points]
    all_y += [p.y for p in up_points]
    all_y += [p.y for p in down_points]

    xs = [p.x for p in points]
    x_min = min(xs)
    x_max = max(xs)
    y_min, y_max = _pad_range(min(all_y), max(all_y))

    integral_value_tex = None
    try:
        value = sp.integrate(expr, (x, parse_bound(lower), parse_bound(upper)))
        integral_value_tex = tex(sp.simplify(value))
    except Exception:
        integral_value_tex = None

    return GraphData(
        function_tex=r"y=" + tex(expr),
        lower=lo,
        upper=hi,
        x_min=x_min,
        x_max=x_max,
        y_min=y_min,
        y_max=y_max,
        integral_value_tex=integral_value_tex,
        primitive_tex=primitive_tex,
        primitive_points=primitive_points,
        primitive_shift_up_points=up_points,
        primitive_shift_down_points=down_points,
        points=points,
    )
