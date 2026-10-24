"use client";

import { useState } from "react";
import { checkAnswer } from "@/lib/api";
import type { CheckResponse } from "@/lib/types";
import { MathBlock } from "@/components/MathBlock";
import { DiagnosticMap } from "@/components/DiagnosticMap";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { addGameEvent } from "@/lib/gamification";

export default function CheckPage() {
  const [problem, setProblem] = useState("x^2e^x");
  const [answer, setAnswer] = useState("(x^2 - 2*x + 2)*e^x");
  const [data, setData] = useState<CheckResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      const result = await checkAnswer(problem, answer);
      setData(result);
      if (result.is_correct) addGameEvent("check-correct", `正解: ${problem}`);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="Check Mode" title="答えが合っているか、微分で判定。" description="自分の解答を入力すると、微分して元の関数に戻るか確認します。" />
      <div className="card">
        <div className="grid">
          <label>元の関数<input className="input" value={problem} onChange={(e) => setProblem(e.target.value)} /></label>
          <label>あなたの答え<input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
        </div>
        <br />
        <button onClick={run} disabled={loading}>{loading ? "判定中..." : "チェックする"}</button>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {data && (
        <div>
          <div className="card">
            <h2 className={data.is_correct ? "status-ok" : "status-warn"}>{data.is_correct ? "正解" : "要確認"}</h2>
            <p>{data.feedback}</p>
            <MathBlock tex={data.derivative_tex} />
            <MathBlock tex={data.difference_tex} />
          </div>
          <DiagnosticMap diagnostic={data.diagnostics} />
        </div>
      )}
    </div>
  );
}
