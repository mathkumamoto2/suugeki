"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { addGameEvent } from "@/lib/gamification";

const problems = [
  { q: "∫ x² dx", a: "x^3/3" },
  { q: "∫ eˣ dx", a: "e^x" },
  { q: "∫ sin(x) dx", a: "-cos(x)" },
  { q: "∫ cos(x) dx", a: "sin(x)" },
  { q: "∫ 1/x dx", a: "log|x|" },
];

function normalize(v: string) {
  return v.replace(/\s/g, "").toLowerCase();
}

export default function BattlePage() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = problems[index];

  const progress = useMemo(() => Math.round((index / problems.length) * 100), [index]);

  function submit() {
    const ok = normalize(answer).includes(normalize(current.a).replace("|", ""));
    if (ok) setScore((s) => s + 1);
    setAnswer("");

    if (index + 1 >= problems.length) {
      setFinished(true);
      if (score + (ok ? 1 : 0) >= 3) addGameEvent("battle-win", "積分バトル勝利");
    } else {
      setIndex((i) => i + 1);
    }
  }

  function reset() {
    setIndex(0);
    setAnswer("");
    setScore(0);
    setFinished(false);
  }

  return (
    <div>
      <PageHeader badge="Integral Battle" title="積分バトル" description="基本積分をテンポよく解いて、知識を反射レベルにします。" />

      <div className="card">
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        {!finished ? (
          <>
            <span className="badge">問 {index + 1} / {problems.length}</span>
            <h1>{current.q}</h1>
            <label>答え<input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="例：x^3/3" /></label>
            <button onClick={submit}>回答する</button>
          </>
        ) : (
          <>
            <h1>結果：{score} / {problems.length}</h1>
            <p>{score >= 3 ? "勝利！XPを記録しました。" : "もう一度挑戦しましょう。"}</p>
            <button onClick={reset}>再挑戦</button>
          </>
        )}
      </div>
    </div>
  );
}
