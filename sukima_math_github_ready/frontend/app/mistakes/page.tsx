"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { neoMistakeClassify, neoPartialScore } from "@/lib/api";

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <pre className="jsonbox">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function MistakesPage() {
  const [problem, setProblem] = useState("x^2e^x");
  const [answer, setAnswer] = useState("x^2 - 2*x + 2*e^x");
  const [work, setWork] = useState("x^2*e^x - 2*x*e^x + 2*e^x\nx^2 - 2*x + 2*e^x");
  const [mistake, setMistake] = useState<unknown>(null);
  const [score, setScore] = useState<unknown>(null);

  async function run() {
    const [m, s] = await Promise.all([
      neoMistakeClassify(problem, answer),
      neoPartialScore(problem, work),
    ]);
    setMistake(m);
    setScore(s);
  }

  const hasResult = useMemo(() => Boolean(mistake || score), [mistake, score]);

  return (
    <div>
      <PageHeader badge="Mistake Lab" title="ミスを分類して、次の復習へつなげる。" description="符号・括弧・C抜け・整理ミスを見つけ、部分点も出します。" />

      <div className="card">
        <label>問題<input className="input" value={problem} onChange={(e) => setProblem(e.target.value)} /></label>
        <label>最終解答<input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
        <label>途中式<textarea value={work} onChange={(e) => setWork(e.target.value)} /></label>
        <button onClick={run}>ミス診断</button>
      </div>

      {!hasResult && <p className="small">診断結果がここに表示されます。</p>}
      <div className="grid">
        {mistake && <JsonCard title="ミス分類" data={mistake} />}
        {score && <JsonCard title="部分点スコア" data={score} />}
      </div>
    </div>
  );
}
