"use client";

import * as katex from "katex";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMath(tex: string, displayMode: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
      output: "html",
    });
  } catch {
    return `<span>${escapeHtml(tex)}</span>`;
  }
}

export function MathBlock({ tex }: { tex?: string | null }) {
  if (!tex || typeof tex !== "string") return null;

  return (
    <div
      className="mathbox"
      dangerouslySetInnerHTML={{ __html: renderMath(tex, true) }}
    />
  );
}

export function InlineMath({ tex }: { tex?: string | null }) {
  if (!tex || typeof tex !== "string") return null;

  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderMath(tex, false) }}
    />
  );
}
