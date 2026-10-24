"use client";

import { MathBlock } from "./MathBlock";

type AnyRecord = Record<string, any>;

function BadgeList({ items }: { items?: unknown }) {
  if (!Array.isArray(items)) return null;
  return (
    <div className="badge-row">
      {items.map((item, index) => (
        <span className="badge" key={`${String(item)}-${index}`}>{String(item)}</span>
      ))}
    </div>
  );
}

export function LineCheckPanel({ data }: { data: unknown }) {
  const d = data as AnyRecord | null;
  if (!d) return null;

  const lines = Array.isArray(d.line_results) ? d.line_results : [];
  const transitions = Array.isArray(d.transitions) ? d.transitions : [];

  return (
    <div className="card result-panel">
      <span className="badge">Line Check</span>
      <h2>行間変形チェック</h2>
      {d.problem_tex && <MathBlock tex={String(d.problem_tex)} />}

      {lines.length === 0 ? (
        <p className="small">途中式がまだありません。</p>
      ) : (
        <div className="result-list">
          {lines.map((line: AnyRecord) => (
            <div className={`result-row ${line.status === "primitive_ok" ? "ok-row" : line.status === "parse_error" ? "bad-row" : "warn-row"}`} key={line.line_number}>
              <div className="result-row-head">
                <strong>{line.line_number}行目</strong>
                <span className="badge">{line.status}</span>
              </div>
              {line.parsed_tex ? <MathBlock tex={String(line.parsed_tex)} /> : <code>{String(line.raw ?? "")}</code>}
              <p className="small">{String(line.feedback ?? "")}</p>
              {line.derivative_tex && (
                <details>
                  <summary>微分チェックを見る</summary>
                  <MathBlock tex={String(line.derivative_tex)} />
                  {line.difference_tex && <p className="small">差分: {String(line.difference_tex)}</p>}
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {transitions.length > 0 && (
        <div className="card">
          <h3>行間の同値チェック</h3>
          {transitions.map((t: AnyRecord, i: number) => (
            <p className="small" key={i}>
              {t.from_line}行目 → {t.to_line}行目：{t.feedback}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function MistakePanel({ data }: { data: unknown }) {
  const d = data as AnyRecord | null;
  if (!d) return null;

  return (
    <div className="card result-panel">
      <span className={d.correct ? "badge success-badge" : "badge warn-badge"}>
        {d.correct ? "Correct" : "Needs Fix"}
      </span>
      <h2>ミス分類</h2>
      <BadgeList items={d.categories} />
      {Array.isArray(d.advice) && d.advice.map((a: string, i: number) => <p key={i}>{a}</p>)}
      {d.derivative_tex && (
        <div className="card">
          <h3>微分検算</h3>
          <MathBlock tex={String(d.derivative_tex)} />
          {d.difference_tex && <p className="small">差分: {String(d.difference_tex)}</p>}
        </div>
      )}
    </div>
  );
}

export function SimilarPanel({ data }: { data: unknown }) {
  const d = data as AnyRecord | null;
  if (!d) return null;

  const items = Array.isArray(d.problem_items)
    ? d.problem_items
    : Array.isArray(d.problems)
      ? d.problems.map((p: string) => ({ input: p, tex: p }))
      : [];

  return (
    <div className="card result-panel compact-panel">
      <span className="badge">Next Problems</span>
      <h2>次に解く類題</h2>
      {d.topic && <p><strong>テーマ：</strong>{String(d.topic)}</p>}

      <div className="formula-list">
        {items.map((item: AnyRecord) => (
          <a
            className="formula-card"
            key={String(item.input)}
            href={`/learn?problem=${encodeURIComponent(String(item.input))}`}
          >
            <div className="formula-card-math">
              <MathBlock tex={String(item.tex)} />
            </div>
            <span>この類題を解く →</span>
          </a>
        ))}
      </div>

      <div className="next-route">
        <strong>おすすめの進め方</strong>
        <BadgeList items={d.route} />
      </div>
    </div>
  );
}

export function ReviewPlanPanel({ data }: { data: unknown }) {
  const d = data as AnyRecord | null;
  if (!d) return null;

  const today = Array.isArray(d.today) ? d.today : [];
  const actions = Array.isArray(d.next_actions) ? d.next_actions : [];

  return (
    <div className="card result-panel">
      <span className="badge">Review Route</span>
      <h2>復習プラン</h2>
      {d.main_topic && <p><strong>主単元：</strong>{String(d.main_topic)}</p>}

      <div className="card">
        <h3>戻る順番</h3>
        <BadgeList items={d.review_order} />
      </div>

      {today.length > 0 && (
        <div className="card">
          <h3>今日やること</h3>
          {today.map((item: AnyRecord, i: number) => (
            <p key={i}>・{String(item.task)}（{String(item.minutes)}分）</p>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="card">
          <h3>次のアクション</h3>
          {actions.map((a: string, i: number) => <p key={i}>・{a}</p>)}
        </div>
      )}
    </div>
  );
}
