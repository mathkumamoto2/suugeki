"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GraphPanel } from "@/components/GraphPanel";
import { MathInputPanel } from "@/components/MathInputPanel";
import { MathPreview } from "@/components/MathPreview";
import { PageHeader } from "@/components/PageHeader";
import type { GraphData, Step, TutorResponse } from "@/lib/types";
import {
  neoLineCheck,
  neoMistakeClassify,
  neoReviewPlan,
  neoSimilarProblems,
  solveIntegral,
  visualize,
} from "@/lib/api";
import { addHistory } from "@/lib/history";
import { addGameEvent } from "@/lib/gamification";
import { readUser, type SukimaUser } from "@/lib/auth";
import { LineCheckPanel, MistakePanel, SimilarPanel, ReviewPlanPanel } from "@/components/ReadablePanels";
import { MathBlock } from "@/components/MathBlock";

function StepSlide({
  step,
  index,
  total,
  answerMode,
  onPrev,
  onNext,
}: {
  step: Step;
  index: number;
  total: number;
  answerMode: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const progress = Math.round(((index + 1) / total) * 100);
  const [hintLevel, setHintLevel] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setHintLevel(0);
    setRevealed(answerMode);
  }, [index, answerMode]);

  function showNextHint() {
    setHintLevel((v) => Math.min(3, v + 1));
    addGameEvent("hint", `Step ${index + 1} hint`);
  }

  function revealAnswer() {
    setRevealed(true);
    addGameEvent("practice", `Step ${index + 1} reveal`);
  }

  function primaryStepAction() {
    if (!revealed) {
      revealAnswer();
      return;
    }
    goNext();
  }

  function goNext() {
    setHintLevel(0);
    setRevealed(false);
    onNext();
  }

  function goPrev() {
    setHintLevel(0);
    setRevealed(false);
    onPrev();
  }

  return (
    <article className="learning-step-card hint-first-card">
      <div className="learning-step-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="learning-step-header">
        <span className="badge">Step {index + 1} / {total}</span>
        <h2>{step.title}</h2>
        <p className="small">
          {answerMode ? "解答連続モード：解答をすぐ確認して、次のStepへ進めます。" : "まず答えを隠して、次の一手を自分で予想します。"}
        </p>
      </header>

      <div className={answerMode ? "hint-challenge-box quick-mode-box" : "hint-challenge-box"}>
        <span className="badge">{answerMode ? "Answer Quick" : "Active Recall"}</span>
        <h3>{answerMode ? "解答を確認する" : "次に何をする？"}</h3>
        <p>
          {answerMode
            ? "このモードでは解答をすぐ表示します。流れをテンポよく確認したいときに使います。"
            : "このStepでやるべき変形や判断を、先に頭の中で考えてください。"}
        </p>

        <div className="hint-action-row">
          {!answerMode && (
            <button className="secondary" onClick={showNextHint} disabled={hintLevel >= 3}>
              {hintLevel === 0 ? "ヒントを見る" : hintLevel < 3 ? "さらにヒント" : "ヒント表示済み"}
            </button>
          )}
          <button onClick={primaryStepAction}>
            {revealed ? (index + 1 >= total ? "解説を完了" : "次の解答へ") : "解答Stepを開く"}
          </button>
        </div>
      </div>

      {hintLevel >= 1 && (
        <div className="hint-card">
          <span className="badge">Hint 1</span>
          <p>{step.hint || "式の形を見て、使う公式を予想しましょう。"}</p>
        </div>
      )}

      {hintLevel >= 2 && (
        <div className="hint-card">
          <span className="badge">Hint 2</span>
          <p>関連単元：{step.related_topics?.length ? step.related_topics.join(" / ") : "基本公式"}</p>
        </div>
      )}

      {hintLevel >= 3 && (
        <div className="hint-card">
          <span className="badge">Hint 3</span>
          <p>この後に表示される数式が「なぜ成り立つか」を説明できるか確認してください。</p>
        </div>
      )}

      {!revealed ? (
        <div className="answer-locked-box">
          <strong>解答はまだ隠れています</strong>
          <p className="small">ヒントだけで考えてから「解答Stepを開く」を押してください。</p>
        </div>
      ) : (
        <>
          <div className="learning-formula-box answer-reveal">
            <MathBlock tex={step.tex} />
          </div>

          <div className="learning-explanation">
            <h3>なぜこの変形をするのか</h3>
            <p>{step.explanation}</p>
          </div>

          {step.related_topics?.length > 0 && (
            <div className="learning-topic-row">
              <strong>関連単元</strong>
              <div className="badge-row">
                {step.related_topics.map((topic) => <span className="badge" key={topic}>{topic}</span>)}
              </div>
            </div>
          )}

          {step.common_mistakes?.length > 0 && (
            <div className="learning-mistake-box">
              <strong>よくあるミス</strong>
              {step.common_mistakes.map((m) => <p className="small" key={m}>{m}</p>)}
            </div>
          )}
        </>
      )}

      <div className="learning-step-actions">
        <button className="secondary" onClick={goPrev} disabled={index === 0}>前へ</button>
        <button onClick={goNext} disabled={!revealed}>
          {index + 1 >= total ? "解説を完了" : "次へ進む"}
        </button>
      </div>
    </article>
  );
}

export default function LearnPage() {
  const params = useSearchParams();
  const initialProblem = params.get("problem") || "x^2e^x";

  const [user, setUser] = useState<SukimaUser | null>(null);
  const [input, setInput] = useState(initialProblem);
  const [kind, setKind] = useState("indefinite");
  const [lower, setLower] = useState("-3");
  const [upper, setUpper] = useState("3");

  const [solution, setSolution] = useState<TutorResponse | null>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [explanationDone, setExplanationDone] = useState(false);
  const [answerMode, setAnswerMode] = useState(false);

  const [answer, setAnswer] = useState("(x^2-2*x+2)*e^x + C");
  const [work, setWork] = useState("x^2*e^x - 2*x*e^x + 2*e^x\n(x^2-2*x+2)*e^x + C");
  const [lineCheck, setLineCheck] = useState<unknown>(null);
  const [mistake, setMistake] = useState<unknown>(null);
  const [similar, setSimilar] = useState<unknown>(null);
  const [review, setReview] = useState<unknown>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = readUser();
    if (!u) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
  }, []);

  const steps = solution?.steps ?? [];
  const activeStep = steps[currentStep];

  const progress = useMemo(() => {
    let done = 0;
    if (solution) done += 1;
    if (explanationDone) done += 1;
    if (lineCheck || mistake) done += 1;
    if (similar || review) done += 1;
    return Math.min(100, Math.round((done / 4) * 100));
  }, [solution, explanationDone, lineCheck, mistake, similar, review]);

  async function runSolve() {
    setError("");
    setLoading(true);
    setLineCheck(null);
    setMistake(null);
    setSimilar(null);
    setReview(null);
    setExplanationDone(false);
    setCurrentStep(0);

    try {
      const solved = await solveIntegral(input, kind, lower, upper, "lecture");
      const graphed = await visualize(input, lower, upper);
      setSolution(solved);
      setGraph(graphed);
      addHistory({
        input,
        kind,
        topic: solved.diagnostics?.main_topic,
        createdAt: new Date().toISOString(),
      });
      addGameEvent("solve", `解析: ${input}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    if (!solution) return;
    if (currentStep + 1 >= steps.length) {
      setExplanationDone(true);
      addGameEvent("practice", "解説完了");
      return;
    }
    setCurrentStep((v) => v + 1);
  }

  async function runDiagnose() {
    setError("");
    setLoading(true);
    try {
      const [line, mis] = await Promise.all([
        neoLineCheck(input, work),
        neoMistakeClassify(input, answer),
      ]);
      setLineCheck(line);
      setMistake(mis);
      addGameEvent("diagnose", `診断: ${input}`);
      await runReview(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function runReview(countXp = true) {
    try {
      const [sim, rev] = await Promise.all([
        neoSimilarProblems(input),
        neoReviewPlan(input),
      ]);
      setSimilar(sim);
      setReview(rev);
      if (countXp) addGameEvent("review", `復習: ${input}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <PageHeader
        badge="Learning Flow"
        title="学習"
        description={`${user?.name ?? "Learner"}さん、上から順番に進めればOKです。`}
      />

      <section className="card flow-progress-card">
        <div>
          <span className="badge">Progress</span>
          <h2>問題入力 → ヒント/解答 → 自力再現 → 診断 → 復習</h2>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="flow-section card">
        <span className="badge">1. 問題入力</span>
        <div className="grid">
          <MathInputPanel input={input} onInput={setInput} />
          <div className="card">
            <span className="badge">Setting</span>
            <label>種類<select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="indefinite">不定積分</option>
              <option value="definite">定積分</option>
            </select></label>
            <div className="grid">
              <label>下端<input className="input" value={lower} onChange={(e) => setLower(e.target.value)} /></label>
              <label>上端<input className="input" value={upper} onChange={(e) => setUpper(e.target.value)} /></label>
            </div>
          </div>
        </div>

        <MathPreview input={input} kind={kind} lower={lower} upper={upper} />

        <button disabled={loading} onClick={runSolve}>{loading ? "解析中..." : "解説を始める"}</button>
        {error && <div className="card status-warn">{error}</div>}
      </section>

      {solution && (
        <section className="flow-section">
          <div className="card">
            <span className="badge">2. 解説</span>
            <h2>ヒントで考えてから解説を見る</h2>
            <p className="small">答えを見る前に、ヒントだけで次の一手を予想します。</p>
          </div>

          <div className="card">
            <h3>問題</h3>
            <MathBlock tex={solution.problem_tex} />
          </div>

          {activeStep && (
            <>
              <div className="answer-mode-switch card">
                <div>
                  <span className="badge">Learning Mode</span>
                  <h3>{answerMode ? "解答連続モード" : "ヒントモード"}</h3>
                  <p className="small">
                    {answerMode
                      ? "答えをテンポよく確認します。復習や全体像の確認に向いています。"
                      : "答えを見る前にヒントで考えます。自力で解けるようになりたいときに向いています。"}
                  </p>
                </div>
                <div className="mode-buttons">
                  <button className={!answerMode ? "active-mode-button" : "secondary"} onClick={() => setAnswerMode(false)}>
                    ヒントで考える
                  </button>
                  <button className={answerMode ? "active-mode-button" : "secondary"} onClick={() => setAnswerMode(true)}>
                    解答をポンポン見る
                  </button>
                </div>
              </div>

              <StepSlide
                step={activeStep}
                index={currentStep}
                total={steps.length}
                answerMode={answerMode}
                onPrev={() => setCurrentStep((v) => Math.max(0, v - 1))}
                onNext={nextStep}
              />
            </>
          )}

          {explanationDone && (
            <div className="card ok-row">
              <span className="badge success-badge">Done</span>
              <h2>解説完了</h2>
              <p>次は、自分の手で途中式を再現してみましょう。</p>
            </div>
          )}
        </section>
      )}

      {graph && solution && (
        <section className="flow-section">
          <div className="card">
            <span className="badge">Visual</span>
            <h2>グラフで確認</h2>
            <p className="small">グラフはここに1回だけ表示します。</p>
          </div>
          <GraphPanel graph={graph} />
        </section>
      )}

      {solution && (
        <section className="flow-section card">
          <span className="badge">3. 自力再現</span>
          <h2>自分で途中式を書く</h2>
          <p className="small">完璧でなくて大丈夫です。書いたものを診断して、どこが崩れたか見ます。</p>

          <label>最終解答<input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
          <label>途中式<textarea value={work} onChange={(e) => setWork(e.target.value)} /></label>

          <button disabled={loading} onClick={runDiagnose}>{loading ? "診断中..." : "診断する"}</button>
        </section>
      )}

      {(lineCheck || mistake) && (
        <section className="flow-section">
          <div className="card">
            <span className="badge">4. 診断</span>
            <h2>どこで崩れたか見る</h2>
          </div>
          <div className="grid">
            <LineCheckPanel data={lineCheck} />
            <MistakePanel data={mistake} />
          </div>
        </section>
      )}

      {(similar || review) && (
        <section className="flow-section">
          <div className="card">
            <span className="badge">5. 復習</span>
            <h2>次に何を解くか決める</h2>
          </div>
          <div className="grid">
            <SimilarPanel data={similar} />
            <ReviewPlanPanel data={review} />
          </div>
          <div className="card">
            <a className="primary-link" href="/dashboard">ホームに戻る</a>
          </div>
        </section>
      )}
    </div>
  );
}
