"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { neoInputSuggestions, neoReportExport, neoStagedHints, neoSimilarProblems, neoWeaknessScore } from "@/lib/api";

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <pre className="jsonbox">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function TrainingPage() {
  const [input, setInput] = useState("x^2e^x");
  const [hints, setHints] = useState<unknown>(null);
  const [similar, setSimilar] = useState<unknown>(null);
  const [weak, setWeak] = useState<unknown>(null);
  const [suggest, setSuggest] = useState<unknown>(null);
  const [report, setReport] = useState<unknown>(null);

  async function run() {
    const [a, b, c, d, e] = await Promise.all([
      neoStagedHints(input),
      neoSimilarProblems(input),
      neoWeaknessScore([], []),
      neoInputSuggestions(input),
      neoReportExport(input),
    ]);
    setHints(a);
    setSimilar(b);
    setWeak(c);
    setSuggest(d);
    setReport(e);
  }

  return (
    <div>
      <PageHeader badge="Training OS" title="ヒント・類題・弱点・レポートをまとめて作る。" description="解説を読んだ後に自力再現へ進むための訓練ページです。" />

      <div className="card">
        <label>式<input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></label>
        <button onClick={run}>Training生成</button>
      </div>

      <div className="grid">
        {suggest && <JsonCard title="入力補正候補" data={suggest} />}
        {hints && <JsonCard title="段階的ヒント" data={hints} />}
        {similar && <JsonCard title="類題" data={similar} />}
        {weak && <JsonCard title="弱点スコア" data={weak} />}
        {report && <JsonCard title="レポート出力" data={report} />}
      </div>
    </div>
  );
}
