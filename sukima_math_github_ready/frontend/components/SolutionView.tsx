import type { TutorResponse } from "@/lib/types";
import { MathBlock } from "./MathBlock";
import { StepCard } from "./StepCard";
import { DiagnosticMap } from "./DiagnosticMap";
import { GraphPanel } from "./GraphPanel";
import { SlideDeck } from "./SlideDeck";

export function SolutionView({ data }: { data: TutorResponse }) {
  const displayTex = String(data.problem?.display_tex ?? data.problem?.tex ?? "");
  const ai = data.problem?.ai as
    | { provider?: string; model?: string; used?: boolean; available?: boolean; server_reachable?: boolean; auto_enhance?: boolean; summary?: string }
    | undefined;

  return (
    <div>
      <div className="card">
        <h2>問題</h2>
        <MathBlock tex={displayTex} />
        {ai && (
          <div className="card">
            <span className="badge">AI Tutor</span>
            <p className="small">
              provider: {ai.provider ?? "unknown"} / model: {ai.model ?? "unknown"} / used: {String(Boolean(ai.used))} / auto: {String(Boolean(ai.auto_enhance))}
            </p>
            {ai.summary && <p>{ai.summary}</p>}
          </div>
        )}
      </div>

      {data.steps?.map((step, i) => <StepCard key={`${step.id}-${i}`} step={step} index={i} />)}

      {data.final_answer && (
        <div className="card">
          <h2>最終解答</h2>
          <MathBlock tex={data.final_answer.tex} />
          <p>{data.final_answer.explanation}</p>
        </div>
      )}

      {data.graph && <GraphPanel graph={data.graph} />}
      {data.slides?.length > 0 && <SlideDeck slides={data.slides} />}
      {data.diagnostics && <DiagnosticMap diagnostic={data.diagnostics} />}
    </div>
  );
}
