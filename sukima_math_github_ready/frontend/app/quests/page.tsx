"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getNeoMissions } from "@/lib/api";
import { addGameEvent } from "@/lib/gamification";

type Mission = { id: string; title: string; description: string; xp: number };

export default function QuestsPage() {
  const [daily, setDaily] = useState<Mission[]>([]);
  const [weekly, setWeekly] = useState<Mission[]>([]);

  useEffect(() => {
    getNeoMissions().then((data) => {
      const d = data as unknown as { daily: Mission[]; weekly: Mission[] };
      setDaily(d.daily ?? []);
      setWeekly(d.weekly ?? []);
    });
  }, []);

  function complete(mission: Mission) {
    addGameEvent("practice", mission.title);
    alert(`${mission.title} 達成！ ${mission.xp} XP相当の学習イベントを記録しました。`);
  }

  return (
    <div>
      <PageHeader badge="Quest Board" title="今日の学習クエスト" description="小さいタスクを積み上げて、継続する理由を作ります。" />

      <div className="card">
        <h2>Daily</h2>
        <div className="grid">
          {daily.map((m) => (
            <div className="card feature-card" key={m.id}>
              <span className="badge">{m.xp} XP</span>
              <h3>{m.title}</h3>
              <p className="small">{m.description}</p>
              <button onClick={() => complete(m)}>達成にする</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Weekly</h2>
        <div className="grid">
          {weekly.map((m) => (
            <div className="card feature-card" key={m.id}>
              <span className="badge">{m.xp} XP</span>
              <h3>{m.title}</h3>
              <p className="small">{m.description}</p>
              <button onClick={() => complete(m)}>達成にする</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
