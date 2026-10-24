export type LearningHistoryItem = {
  input: string;
  kind: string;
  topic?: string;
  createdAt: string;
};

const KEY = "sukima.learning.history.v1";

export function readHistory(): LearningHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LearningHistoryItem[];
  } catch {
    return [];
  }
}

export function addHistory(item: LearningHistoryItem) {
  if (typeof window === "undefined") return;
  const current = readHistory();
  const next = [item, ...current].slice(0, 80);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
