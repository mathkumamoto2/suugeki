"use client";

import { useEffect, useState } from "react";
import { previewExpression } from "@/lib/api";
import type { PreviewResponse } from "@/lib/types";
import { MathBlock } from "./MathBlock";

export function MathPreview({
  input,
  kind,
  lower,
  upper,
}: {
  input: string;
  kind: string;
  lower: string;
  upper: string;
}) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!input.trim()) {
        setPreview(null);
        return;
      }

      previewExpression(input, kind, lower, upper)
        .then((res) => {
          setPreview(res);
          setError("");
        })
        .catch((e) => {
          setPreview(null);
          setError(e instanceof Error ? e.message : String(e));
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [input, kind, lower, upper]);

  async function copyLatex() {
    if (!preview?.display_tex) return;
    await navigator.clipboard.writeText(preview.display_tex);
  }

  return (
    <div className="card">
      <span className="badge">LaTeX Preview</span>
      <h3>入力式プレビュー</h3>
      {preview ? <MathBlock tex={preview.display_tex} /> : <p className="small">式を入力するとLaTeX表示で確認できます。</p>}
      {preview && <button className="secondary" onClick={copyLatex}>LaTeXをコピー</button>}
      {error && <p className="small status-warn">{error}</p>}
    </div>
  );
}
