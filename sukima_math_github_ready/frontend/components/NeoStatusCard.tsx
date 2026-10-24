"use client";

import { useEffect, useMemo, useState } from "react";
import { badgeList, levelFromXp, nextLevelXp, readEvents, streakDays, totalXp, type GameEvent } from "@/lib/gamification";

export function NeoStatusCard() {
  const [events, setEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    setEvents(readEvents());
  }, []);

  const xp = useMemo(() => totalXp(events), [events]);
  const level = levelFromXp(xp);
  const next = nextLevelXp(level);
  const previous = nextLevelXp(level - 1);
  const progress = Math.min(100, Math.round(((xp - previous) / Math.max(1, next - previous)) * 100));
  const badges = badgeList(events);

  return (
    <div className="card">
      <span className="badge">Neo Status</span>
      <h2>Lv.{level} / {xp} XP</h2>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="small">次のレベルまで {Math.max(0, next - xp)} XP / 連続学習 {streakDays(events)} 日</p>

      <div className="grid">
        {badges.map((badge) => (
          <div className={`card ${badge.unlocked ? "badge-unlocked" : "badge-locked"}`} key={badge.id}>
            <strong>{badge.unlocked ? "🏆 " : "🔒 "}{badge.title}</strong>
            <p className="small">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
