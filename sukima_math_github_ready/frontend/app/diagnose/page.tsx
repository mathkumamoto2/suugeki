"use client";

import { useState } from "react";
import { diagnoseWork } from "@/lib/api";
import type { WorkDiagnosisResponse } from "@/lib/types";
import { MathBlock } from "@/components/MathBlock";
import { DiagnosticMap } from "@/components/DiagnosticMap";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { addGameEvent } from "@/lib/gamification";

export default function DiagnosePage() {
  const [problem, setProblem] = useState("x^2e^x");
  const [work, setWork] = useState("(x^2 - 2*x + 2)*e^x\nx^2 - 2*x + 2*e^x");
  const [data, setData] = useState<WorkDiagnosisResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      setData(await diagnoseWork(problem, work));
      addGameEvent("diagnose", `診断: ${problem}`);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="Diagnosis" title="どこで崩れたか、見つける。" description="途中式を複数行で貼り、各行を原始関数候補としてチェックします。" />
      <div className="card">
        <label>元の関数<input className="input" value={problem} onChange={(e) => setProblem(e.target.value)} /></label>
        <br />
        <label>途中式<textarea value={work} onChange={(e) => setWork(e.target.value)} /></label>
        <br />
        <button onClick={run} disabled={loading}>{loading ? "診断中..." : "診断する"}</button>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {data && (
        <div>
          {data.lines?.map((line) => (
            <div className="card" key={line.line_number}>
              <h3>{line.line_number}行目：{line.status}</h3>
              <p>{line.feedback}</p>
              {line.derivative_tex && <MathBlock tex={line.derivative_tex} />}
              {line.difference_tex && <MathBlock tex={line.difference_tex} />}
            </div>
          ))}
          <DiagnosticMap diagnostic={data.diagnostics} />
        </div>
      )}
    </div>
  );
}
