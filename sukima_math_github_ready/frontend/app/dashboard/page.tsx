"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { addGameEvent, badgeList, levelFromXp, nextLevelXp, readEvents, streakDays, totalXp, type GameEvent } from "@/lib/gamification";
import { clearUser, readUser, type SukimaUser } from "@/lib/auth";
import { focusToday } from "@/lib/api";

type Mission = {
  id: string;
  title: string;
  xp: number;
};

type Today = {
  problem: string;
  problem_label: string;
  goal: string;
  flow: { id: string; label: string; description: string }[];
  missions: Mission[];
};

const fallbackToday: Today = {
  problem: "x^2e^x",
  problem_label: "∫ x²eˣ dx",
  goal: "部分積分の流れを自力で再現する",
  flow: [
    { id: "explain", label: "解説を見る", description: "まず答えを隠し、ヒントだけで次の一手を考える。" },
    { id: "reproduce", label: "自分で書く", description: "解説後に、自分の途中式を書いてみる。" },
    { id: "diagnose", label: "診断する", description: "行間変形とミス分類で、どこが崩れたか見る。" },
    { id: "review", label: "類題で復習", description: "次に解くべき類題へ進む。" },
  ],
  missions: [
    { id: "m1", title: "解説を最後まで見る", xp: 20 },
    { id: "m2", title: "途中式を自分で書く", xp: 30 },
    { id: "m3", title: "類題を1問確認する", xp: 15 },
  ],
};

export default function DashboardPage() {
  const [user, setUser] = useState<SukimaUser | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [today, setToday] = useState<Today>(fallbackToday);

  useEffect(() => {
    const u = readUser();
    if (!u) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    setEvents(readEvents());

    focusToday().then((data) => {
      setToday({ ...fallbackToday, ...(data as unknown as Today) });
    }).catch(() => {
      setToday(fallbackToday);
    });
  }, []);

  const xp = useMemo(() => totalXp(events), [events]);
  const level = levelFromXp(xp);
  const next = nextLevelXp(level);
  const previous = nextLevelXp(level - 1);
  const progress = Math.min(100, Math.round(((xp - previous) / Math.max(1, next - previous)) * 100));
  const badges = badgeList(events).filter((b) => b.unlocked).slice(0, 3);

  function completeMission(mission: Mission) {
    addGameEvent("practice", mission.title);
    setEvents(readEvents());
  }

  function logout() {
    clearUser();
    window.location.href = "/login";
  }

  return (
    <div>
      <PageHeader
        badge="Learning Lobby"
        title={`${user?.name ?? "Learner"}さんの今日の1問：ヒントで解く`}
        description={user?.goal ?? "今日やることを1つに絞って、迷わず進めます。"}
      />

      <section className="flow-hero card">
        <div>
          <span className="badge">Today's Problem</span>
          <h1>{today.problem_label}</h1>
          <p>{today.goal}</p>
          <a className="primary-link" href={`/learn?problem=${encodeURIComponent(today.problem)}`}>ヒントモードで始める</a>
        </div>

        <div className="level-card">
          <span className="badge">Status</span>
          <h2>Lv.{level}</h2>
          <p className="small">{xp} XP / 連続学習 {streakDays(events)} 日</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="small">次のレベルまで {Math.max(0, next - xp)} XP</p>
        </div>
      </section>

      <div className="grid">
        <section className="card">
          <span className="badge">Flow</span>
          <h2>今日の流れ</h2>
          <div className="flow-steps">
            {today.flow.map((step, index) => (
              <div className="flow-step-card" key={step.id}>
                <span className="badge">{index + 1}</span>
                <strong>{step.label}</strong>
                <p className="small">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <span className="badge">Daily Missions</span>
          <h2>今日のミッション</h2>
          <div className="mission-list">
            {today.missions.map((mission) => (
              <div className="mission-card" key={mission.id}>
                <div>
                  <strong>{mission.title}</strong>
                  <p className="small">+{mission.xp} XP</p>
                </div>
                <button className="secondary" onClick={() => completeMission(mission)}>達成</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <span className="badge">Badges</span>
        <h2>獲得バッジ</h2>
        {badges.length === 0 ? (
          <p className="small">学習を進めると、ここにバッジが表示されます。</p>
        ) : (
          <div className="grid">
            {badges.map((badge) => (
              <div className="card badge-unlocked" key={badge.id}>
                <strong>🏆 {badge.title}</strong>
                <p className="small">{badge.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="card subtle-card">
        <button className="secondary" onClick={logout}>ログイン画面に戻る</button>
      </div>
    </div>
  );
}
