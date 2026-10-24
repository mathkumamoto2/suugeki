"use client";

import { useState } from "react";
import { visualize } from "@/lib/api";
import type { GraphData } from "@/lib/types";
import { GraphPanel } from "@/components/GraphPanel";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";

const samples = ["x^2", "x^3", "sin(x)", "cos(x)", "e^x", "1/x"];

export default function VisualizePage() {
  const [input, setInput] = useState("sin(x)");
  const [lower, setLower] = useState("-3");
  const [upper, setUpper] = useState("3");
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(nextInput = input) {
    setError("");
    setLoading(true);
    try {
      setGraph(await visualize(nextInput, lower, upper));
    } catch (e) {
      setGraph(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function chooseSample(value: string) {
    setInput(value);
    void run(value);
  }

  return (
    <div>
      <PageHeader badge="Visual Mode" title="積分を、面積として見る。" description="関数の形が式に応じて変わるように、点列・軸・塗りつぶしを再設計しました。" />
      <div className="card">
        <div className="grid">
          <label>関数<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
          <label>下端<input className="input" value={lower} onChange={(e) => setLower(e.target.value)} /></label>
          <label>上端<input className="input" value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
        </div>
        <br />
        <button onClick={() => run()} disabled={loading}>{loading ? "描画中..." : "グラフを見る"}</button>
        <div style={{ marginTop: 12 }}>
          {samples.map((s) => (
            <button className="secondary" key={s} onClick={() => chooseSample(s)} style={{ marginRight: 8, marginBottom: 8 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <ErrorState message={error} />
      <LoadingState active={loading} />
      {graph && <GraphPanel graph={graph} />}
    </div>
  );
}
