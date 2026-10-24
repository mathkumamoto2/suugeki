"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { neoVisualExplain, visualize } from "@/lib/api";
import { GraphPanel } from "@/components/GraphPanel";
import type { GraphData } from "@/lib/types";

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <pre className="jsonbox">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function VisualLabPage() {
  const [input, setInput] = useState("x^2e^x");
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [explain, setExplain] = useState<unknown>(null);

  async function run() {
    const [g, e] = await Promise.all([
      visualize(input, "-3", "3"),
      neoVisualExplain(input),
    ]);
    setGraph(g);
    setExplain(e);
  }

  return (
    <div>
      <PageHeader badge="Visual Lab" title="積分を構造として見る。" description="原始関数、+C、置換積分、部分積分の構造を可視化する実験室です。" />

      <div className="card">
        <label>式<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
        <button onClick={run}>可視化する</button>
      </div>

      {graph && <GraphPanel graph={graph} />}
      {explain && <JsonCard title="構造説明" data={explain} />}
    </div>
  );
}
