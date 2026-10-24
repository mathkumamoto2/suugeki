"use client";

import { useState } from "react";
import { getHint } from "@/lib/api";
import type { TutorResponse } from "@/lib/types";
import { StepCard } from "@/components/StepCard";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

export default function HintPage() {
  const [input, setInput] = useState("x^2e^x");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TutorResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      setData(await getHint(input, step));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="Hint Mode" title="答えを見ずに、自力で進む。" description="ヒントだけを段階的に出します。" />
      <div className="card">
        <div className="grid">
          <label>式<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
          <label>ヒント番号<input className="input" type="number" min={0} value={step} onChange={(e) => setStep(Number(e.target.value))} /></label>
        </div>
        <br />
        <button onClick={run} disabled={loading}>{loading ? "取得中..." : "ヒントを見る"}</button>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {data?.steps?.map((s, i) => <StepCard key={`${s.id}-${i}`} step={s} index={i} showHint />)}
    </div>
  );
}
