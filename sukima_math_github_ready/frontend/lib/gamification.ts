export type GameEventType =
  | "solve"
  | "hint"
  | "diagnose"
  | "check-correct"
  | "practice"
  | "review"
  | "battle-win";

export type GameEvent = {
  type: GameEventType;
  title: string;
  xp: number;
  createdAt: string;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

const KEY = "sukima.neo.game.v1";

const XP_TABLE: Record<GameEventType, number> = {
  solve: 20,
  hint: 6,
  diagnose: 18,
  "check-correct": 30,
  practice: 15,
  review: 12,
  "battle-win": 50,
};

export function xpFor(type: GameEventType) {
  return XP_TABLE[type] ?? 0;
}

export function readEvents(): GameEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as GameEvent[];
  } catch {
    return [];
  }
}

export function addGameEvent(type: GameEventType, title?: string) {
  if (typeof window === "undefined") return;
  const event: GameEvent = {
    type,
    title: title || type,
    xp: xpFor(type),
    createdAt: new Date().toISOString(),
  };
  const next = [event, ...readEvents()].slice(0, 300);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearGameEvents() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function totalXp(events = readEvents()) {
  return events.reduce((sum, event) => sum + event.xp, 0);
}

export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function nextLevelXp(level: number) {
  return level * level * 50;
}

export function streakDays(events = readEvents()) {
  const days = new Set(events.map((e) => e.createdAt.slice(0, 10)));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) streak += 1;
    else break;
  }

  return streak;
}

export function badgeList(events = readEvents()): Badge[] {
  const xp = totalXp(events);
  const count = events.length;
  const solves = events.filter((e) => e.type === "solve").length;
  const hints = events.filter((e) => e.type === "hint").length;
  const diagnoses = events.filter((e) => e.type === "diagnose").length;
  const battles = events.filter((e) => e.type === "battle-win").length;
  const streak = streakDays(events);

  return [
    { id: "first-step", title: "はじめの一歩", description: "最初の学習イベントを達成", unlocked: count >= 1 },
    { id: "solver-10", title: "積分見習い", description: "10問解析", unlocked: solves >= 10 },
    { id: "hint-master", title: "ヒント職人", description: "ヒントを10回使う", unlocked: hints >= 10 },
    { id: "diagnostic", title: "ミス探偵", description: "途中式診断を5回使う", unlocked: diagnoses >= 5 },
    { id: "level-5", title: "Lv.5到達", description: "レベル5に到達", unlocked: levelFromXp(xp) >= 5 },
    { id: "streak-3", title: "3日継続", description: "3日連続で学習", unlocked: streak >= 3 },
    { id: "battle", title: "クイズ勝者", description: "バトルで1勝", unlocked: battles >= 1 },
  ];
}
