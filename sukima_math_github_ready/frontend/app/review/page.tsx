"use client";

import { useState } from "react";
import { diagnose } from "@/lib/api";
import type { TutorResponse } from "@/lib/types";
import { DiagnosticMap } from "@/components/DiagnosticMap";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

export default function ReviewPage() {
  const [input, setInput] = useState("x^2e^x");
  const [data, setData] = useState<TutorResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      setData(await diagnose(input));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="Review Navigator" title="戻るべき単元を、地図にする。" description="問題から必要な前提単元を逆算し、復習順とおすすめ問題を提示します。" />
      <div className="card">
        <label>式<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
        <br />
        <button onClick={run} disabled={loading}>{loading ? "作成中..." : "復習ルートを見る"}</button>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {data && <DiagnosticMap diagnostic={data.diagnostics} />}
    </div>
  );
}
