"use client";

import { useState } from "react";
import { solveIntegral, visualize } from "@/lib/api";
import type { TutorResponse, GraphData } from "@/lib/types";
import { SolutionView } from "@/components/SolutionView";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MathPreview } from "@/components/MathPreview";
import { GraphPanel } from "@/components/GraphPanel";
import { MathInputPanel } from "@/components/MathInputPanel";
import { addHistory } from "@/lib/history";
import { addGameEvent } from "@/lib/gamification";

export default function SolvePage() {
  const [input, setInput] = useState("x^2e^x");
  const [kind, setKind] = useState("indefinite");
  const [lower, setLower] = useState("-3");
  const [upper, setUpper] = useState("3");
  const [data, setData] = useState<TutorResponse | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      const solved = await solveIntegral(input, kind, lower, upper, "lecture");
      const graphed = await visualize(input, lower, upper);
      setData(solved);
      setGraph(graphed);
      addHistory({
        input,
        kind,
        topic: solved.diagnostics?.main_topic,
        createdAt: new Date().toISOString(),
      });
      addGameEvent("solve", `解析: ${input}`);
    } catch (e) {
      setData(null);
      setGraph(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        badge="Sukima v4.0"
        title="式・途中式・グラフ・復習を、ひとつの学習体験へ。"
        description="LaTeX入力支援、式に連動するグラフ、Stepごとのヒント、復習ルート、学習履歴までを統合した完成版です。"
      />

      <div className="grid">
        <MathInputPanel input={input} onInput={setInput} />
        <div className="card">
          <span className="badge">Integral Setting</span>
          <div className="grid">
            <label>種類<select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="indefinite">不定積分</option>
              <option value="definite">定積分</option>
            </select></label>
            <label>表示下端<input className="input" value={lower} onChange={(e) => setLower(e.target.value)} /></label>
            <label>表示上端<input className="input" value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
          </div>
        </div>
      </div>

      <MathPreview input={input} kind={kind} lower={lower} upper={upper} />

      <div className="card">
        <button onClick={run} disabled={loading}>{loading ? "解析中..." : "解析する"}</button>
      </div>

      <ErrorState message={error} />
      <LoadingState active={loading} label="数式・途中式・グラフ・復習ルートを生成しています..." />

      {data && <SolutionView data={data} />}
      {graph && <GraphPanel key={`${input}-${lower}-${upper}`} graph={graph} />}
    </div>
  );
}
