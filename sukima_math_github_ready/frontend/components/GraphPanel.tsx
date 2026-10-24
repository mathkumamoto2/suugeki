"use client";

import type { GraphData, GraphPoint } from "@/lib/types";
import { MathBlock } from "./MathBlock";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function scale(value: number, min: number, max: number, outMin: number, outMax: number) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function format(value: number) {
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) return value.toExponential(1);
  return value.toFixed(2);
}

function pathFor(points: GraphPoint[], sx: (x: number) => number, sy: (y: number) => number) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`)
    .join(" ");
}

export function GraphPanel({ graph }: { graph?: GraphData | null }) {
  const width = 860;
  const height = 440;
  const pad = 52;
  const points = (graph?.points ?? []).filter((p) => isFiniteNumber(p.x) && isFiniteNumber(p.y));

  if (!graph || points.length < 2) {
    return <div className="card">グラフ用データが不足しています。範囲を広げるか、式を確認してください。</div>;
  }

  const xs = points.map((p) => p.x);
  const ys = [
    ...points.map((p) => p.y),
    ...(graph.primitive_points ?? []).map((p) => p.y),
    ...(graph.primitive_shift_up_points ?? []).map((p) => p.y),
    ...(graph.primitive_shift_down_points ?? []).map((p) => p.y),
    0,
  ];

  const minX = isFiniteNumber(graph.x_min) ? graph.x_min : Math.min(...xs);
  const maxX = isFiniteNumber(graph.x_max) ? graph.x_max : Math.max(...xs);
  const minY = isFiniteNumber(graph.y_min) ? graph.y_min : Math.min(...ys);
  const maxY = isFiniteNumber(graph.y_max) ? graph.y_max : Math.max(...ys);

  const sx = (val: number) => scale(val, minX, maxX, pad, width - pad);
  const sy = (val: number) => scale(val, minY, maxY, height - pad, pad);

  const zeroY = sy(0);
  const zeroX = sx(0);
  const lower = isFiniteNumber(graph.lower) ? graph.lower : minX;
  const upper = isFiniteNumber(graph.upper) ? graph.upper : maxX;
  const shaded = points.filter((p) => p.x >= Math.min(lower, upper) && p.x <= Math.max(lower, upper));
  const area = shaded.length >= 2
    ? `M ${sx(shaded[0].x).toFixed(2)} ${zeroY.toFixed(2)} `
      + shaded.map((p) => `L ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(" ")
      + ` L ${sx(shaded[shaded.length - 1].x).toFixed(2)} ${zeroY.toFixed(2)} Z`
    : "";

  return (
    <div className="card">
      <span className="badge">Graph linked to current expression</span>
      <h2>グラフ可視化</h2>

      <div className="grid">
        <div className="card">
          <p className="small">元の関数</p>
          <MathBlock tex={graph.function_tex} />
        </div>
        {graph.primitive_tex && (
          <div className="card">
            <p className="small">原始関数と +C のイメージ</p>
            <MathBlock tex={graph.primitive_tex} />
          </div>
        )}
        {graph.integral_value_tex && (
          <div className="card">
            <p className="small">指定範囲の定積分値</p>
            <MathBlock tex={graph.integral_value_tex} />
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="graph" role="img">
        <defs>
          <linearGradient id="sukimaArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="sukimaLine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => {
          const y = pad + (height - 2 * pad) * t;
          return <line key={`gy-${t}`} x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(148,163,184,0.18)" />;
        })}
        {[0.25, 0.5, 0.75].map((t) => {
          const x = pad + (width - 2 * pad) * t;
          return <line key={`gx-${t}`} x1={x} y1={pad} x2={x} y2={height - pad} stroke="rgba(148,163,184,0.13)" />;
        })}

        {minY <= 0 && maxY >= 0 && <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke="#94a3b8" strokeWidth="1.2" />}
        {minX <= 0 && maxX >= 0 && <line x1={zeroX} y1={pad} x2={zeroX} y2={height - pad} stroke="#64748b" strokeWidth="1" />}

        {area && <path d={area} fill="url(#sukimaArea)" />}
        {(graph.primitive_shift_up_points ?? []).length > 1 && <path d={pathFor(graph.primitive_shift_up_points ?? [], sx, sy)} fill="none" stroke="#64748b" strokeDasharray="7 7" strokeWidth="2" opacity="0.55" />}
        {(graph.primitive_shift_down_points ?? []).length > 1 && <path d={pathFor(graph.primitive_shift_down_points ?? [], sx, sy)} fill="none" stroke="#64748b" strokeDasharray="7 7" strokeWidth="2" opacity="0.55" />}
        {(graph.primitive_points ?? []).length > 1 && <path d={pathFor(graph.primitive_points ?? [], sx, sy)} fill="none" stroke="#34d399" strokeWidth="3" opacity="0.9" />}
        <path d={pathFor(points, sx, sy)} fill="none" stroke="url(#sukimaLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        <text x={pad} y={height - 12} fontSize="12" fill="#cbd5e1">{format(minX)}</text>
        <text x={width - pad - 48} y={height - 12} fontSize="12" fill="#cbd5e1">{format(maxX)}</text>
        <text x={8} y={pad + 5} fontSize="12" fill="#cbd5e1">{format(maxY)}</text>
        <text x={8} y={height - pad + 5} fontSize="12" fill="#cbd5e1">{format(minY)}</text>
      </svg>

      <div className="card">
        <span className="badge">読み方</span>
        <p className="small">
          青い線が元の関数、青い塗りが定積分の面積、緑の線が原始関数です。
          破線は +C による上下移動を表します。
        </p>
      </div>
    </div>
  );
}
