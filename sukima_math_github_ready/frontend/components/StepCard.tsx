"use client";

import { useState } from "react";
import type { Step } from "@/lib/types";
import { MathBlock } from "./MathBlock";

export function StepCard({ step, index, showHint = false }: { step: Step; index: number; showHint?: boolean }) {
  const [hintOpen, setHintOpen] = useState(showHint);

  return (
    <div className="step">
      <div>
        <span className="badge">Step {index + 1}</span>
        <strong>{step.title}</strong>
      </div>

      <MathBlock tex={step.tex} />
      <p>{hintOpen ? step.hint : step.explanation}</p>

      <button className="secondary" onClick={() => setHintOpen((v) => !v)}>
        {hintOpen ? "解説に戻す" : "ヒントだけ見る"}
      </button>

      {step.related_topics.length > 0 && (
        <div className="card">
          <strong>関連単元</strong>
          <div>
            {step.related_topics.map((topic) => (
              <span className="badge" key={topic}>{topic}</span>
            ))}
          </div>
        </div>
      )}

      {!hintOpen && step.common_mistakes.length > 0 && (
        <div className="card">
          <strong>よくあるミス</strong>
          <ul>
            {step.common_mistakes.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
