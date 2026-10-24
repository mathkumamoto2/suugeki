import type { TutorResponse, CheckResponse, GraphData, WorkDiagnosisResponse, PreviewResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ApiErrorPayload = {
  detail?: string;
  type?: string;
  path?: string;
};

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const payload = data as ApiErrorPayload | null;
      throw new Error(payload?.detail || payload?.type || `API error: ${res.status}`);
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("APIの応答がタイムアウトしました。qwen3:8b のAI応答が遅い可能性があります。backend/.env の SUKIMA_LLM_AUTO_ENHANCE=false を確認してください。");
    }
    if (error instanceof SyntaxError) {
      throw new Error("APIレスポンスをJSONとして読み取れませんでした。Backendログを確認してください。");
    }
    if (error instanceof TypeError) {
      throw new Error("Backendに接続できません。http://localhost:8000 が起動しているか確認してください。");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function healthCheck() {
  return getJson<{ ok: boolean; service: string; version: string }>("/api/health");
}

export function llmHealth() {
  return getJson<Record<string, unknown>>("/api/llm/health");
}

export function solveIntegral(input: string, kind = "indefinite", lower = "0", upper = "1", level = "lecture") {
  return postJson<TutorResponse>("/api/solve", { input, kind, lower, upper, level });
}

export function getHint(input: string, currentStep = 0) {
  return postJson<TutorResponse>("/api/hint", { input, current_step: currentStep });
}

export function checkAnswer(problem: string, studentAnswer: string) {
  return postJson<CheckResponse>("/api/check", { problem, student_answer: studentAnswer });
}

export function diagnose(input: string, failedStepId?: string, studentWork?: string) {
  return postJson<TutorResponse>("/api/diagnose", { input, failed_step_id: failedStepId, student_work: studentWork });
}

export function diagnoseWork(input: string, studentWork: string) {
  return postJson<WorkDiagnosisResponse>("/api/work-diagnose", { input, student_work: studentWork });
}

export function visualize(input: string, lower = "0", upper = "1") {
  return postJson<GraphData>("/api/visualize", { input, lower, upper });
}

export function getSlides(input: string, kind = "indefinite", lower = "0", upper = "1") {
  return postJson<TutorResponse>("/api/slides", { input, kind, lower, upper });
}


export function previewExpression(input: string, kind = "indefinite", lower = "0", upper = "1") {
  return postJson<PreviewResponse>("/api/preview", { input, kind, lower, upper });
}


export function getNeoSkillMap() {
  return getJson<Record<string, unknown>>("/api/neo/skill-map");
}

export function getNeoMissions() {
  return getJson<Record<string, unknown>>("/api/neo/missions");
}

export function getNeoPracticeBank() {
  return getJson<Record<string, unknown>>("/api/neo/practice-bank");
}


export function neoLineCheck(problem: string, studentWork: string) {
  return postJson<Record<string, unknown>>("/api/neo/line-check", { problem, student_work: studentWork });
}

export function neoMistakeClassify(problem: string, answer: string) {
  return postJson<Record<string, unknown>>("/api/neo/mistake-classify", { problem, answer });
}

export function neoSimilarProblems(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/similar-problems", { input });
}

export function neoReviewPlan(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/review-plan", { input });
}

export function neoSpacedReview(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/spaced-review", { input });
}


export function ultimateFeatureMatrix() {
  return getJson<Record<string, unknown>>("/api/ultimate/feature-matrix");
}

export function neoStagedHints(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/staged-hints", { input });
}

export function neoPartialScore(problem: string, studentWork: string) {
  return postJson<Record<string, unknown>>("/api/neo/partial-score", { problem, student_work: studentWork });
}

export function neoWeaknessScore(topics: string[] = [], mistakes: string[] = []) {
  return postJson<Record<string, unknown>>("/api/neo/weakness-score", { topics, mistakes });
}

export function neoInputSuggestions(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/input-suggestions", { input });
}

export function neoReportExport(input: string, kind = "indefinite") {
  return postJson<Record<string, unknown>>("/api/neo/report-export", { input, kind });
}

export function neoVisualExplain(input: string) {
  return postJson<Record<string, unknown>>("/api/neo/visual-explain", { input });
}


export function systemSelfTest() {
  return getJson<Record<string, unknown>>("/api/system/self-test");
}


export function focusDashboard() {
  return getJson<Record<string, unknown>>("/api/focus/dashboard");
}


export function focusToday() {
  return getJson<Record<string, unknown>>("/api/focus/today");
}


export function focusHintFirstPrinciple() {
  return getJson<Record<string, unknown>>("/api/focus/hint-first-principle");
}
