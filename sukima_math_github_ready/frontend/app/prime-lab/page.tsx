"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { neoLineCheck, neoMistakeClassify, neoReviewPlan, neoSimilarProblems, neoSpacedReview } from "@/lib/api";

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <pre className="jsonbox">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function PrimeLabPage() {
  const [problem, setProblem] = useState("x^2e^x");
  const [answer, setAnswer] = useState("(x^2-2*x+2)*e^x + C");
  const [work, setWork] = useState("x^2*e^x - 2*x*e^x + 2*e^x\n(x^2-2*x+2)*e^x");
  const [lineCheck, setLineCheck] = useState<unknown>(null);
  const [mistake, setMistake] = useState<unknown>(null);
  const [similar, setSimilar] = useState<unknown>(null);
  const [review, setReview] = useState<unknown>(null);
  const [spaced, setSpaced] = useState<unknown>(null);

  async function runAll() {
    const [a, b, c, d, e] = await Promise.all([
      neoLineCheck(problem, work),
      neoMistakeClassify(problem, answer),
      neoSimilarProblems(problem),
      neoReviewPlan(problem),
      neoSpacedReview(problem),
    ]);
    setLineCheck(a);
    setMistake(b);
    setSimilar(c);
    setReview(d);
    setSpaced(e);
  }

  return (
    <div>
      <PageHeader
        badge="Neo Prime Lab"
        title="診断・復習・類題・忘却対策を統合する。"
        description="行間変形チェック、ミス分類、類題生成、復習計画、忘却曲線復習を1つの実験室に集約しました。OCRは除外しています。"
      />

      <div className="card">
        <div className="grid">
          <label>問題<input className="input" value={problem} onChange={(e) => setProblem(e.target.value)} /></label>
          <label>最終解答<input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
        </div>
        <label>途中式<textarea value={work} onChange={(e) => setWork(e.target.value)} /></label>
        <button onClick={runAll}>Prime診断を実行</button>
      </div>

      <div className="grid">
        {lineCheck && <JsonCard title="行間変形チェック" data={lineCheck} />}
        {mistake && <JsonCard title="ミス分類" data={mistake} />}
        {similar && <JsonCard title="類題生成" data={similar} />}
        {review && <JsonCard title="復習プラン" data={review} />}
        {spaced && <JsonCard title="忘却曲線復習" data={spaced} />}
      </div>
    </div>
  );
}
