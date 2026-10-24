export type SukimaUser = {
  name: string;
  goal: string;
  createdAt: string;
};

const KEY = "sukima.focus.user.v1";

export function readUser(): SukimaUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SukimaUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(name: string, goal: string) {
  if (typeof window === "undefined") return;
  const user: SukimaUser = {
    name: name.trim() || "Learner",
    goal: goal.trim() || "微積を理解する",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
