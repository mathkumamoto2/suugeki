"use client";

import { useState } from "react";
import { getSlides } from "@/lib/api";
import type { TutorResponse } from "@/lib/types";
import { SlideDeck } from "@/components/SlideDeck";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

export default function SlidesPage() {
  const [input, setInput] = useState("x^2e^x");
  const [data, setData] = useState<TutorResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setError("");
    setLoading(true);
    try {
      setData(await getSlides(input));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader badge="Slide Mode" title="1ステップずつ、スライドで理解する。" description="長い解説を読むのではなく、1 Step = 1 Messageで進みます。" />
      <div className="card">
        <label>式<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
        <br />
        <button onClick={run} disabled={loading}>{loading ? "作成中..." : "スライドを作る"}</button>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {data && <SlideDeck slides={data.slides ?? []} />}
    </div>
  );
}
