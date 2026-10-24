"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { clearHistory, readHistory, type LearningHistoryItem } from "@/lib/history";
import { badgeList, readEvents, streakDays, totalXp } from "@/lib/gamification";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<LearningHistoryItem[]>([]);
  const [events, setEvents] = useState(readEvents());

  useEffect(() => {
    setItems(readHistory());
    setEvents(readEvents());
  }, []);

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = item.topic || "未分類";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const recent = items.slice(0, 8);
  const xp = totalXp(events);
  const badges = badgeList(events).filter((b) => b.unlocked);

  function clear() {
    clearHistory();
    setItems([]);
  }

  return (
    <div>
      <PageHeader
        badge="History"
        title="学習履歴"
        description="どの単元に取り組んだか、最近どんな問題を解いたかを整理します。"
      />

      <div className="history-stats">
        <div className="stat-card">
          <span className="badge">Solved</span>
          <strong>{items.length}</strong>
          <p>解いた問題</p>
        </div>
        <div className="stat-card">
          <span className="badge">XP</span>
          <strong>{xp}</strong>
          <p>累計XP</p>
        </div>
        <div className="stat-card">
          <span className="badge">Streak</span>
          <strong>{streakDays(events)}</strong>
          <p>連続学習日</p>
        </div>
        <div className="stat-card">
          <span className="badge">Badges</span>
          <strong>{badges.length}</strong>
          <p>獲得バッジ</p>
        </div>
      </div>

      <section className="card compact-section">
        <div className="section-head">
          <div>
            <span className="badge">Topics</span>
            <h2>単元別カウント</h2>
          </div>
          <a className="secondary" href="/learn">学習へ戻る</a>
        </div>

        {topicCounts.length === 0 ? (
          <p className="small">まだ履歴がありません。まずは1問解いてみましょう。</p>
        ) : (
          <div className="topic-bars">
            {topicCounts.map(([topic, count]) => {
              const max = Math.max(...topicCounts.map(([, c]) => c), 1);
              const width = Math.max(12, Math.round((count / max) * 100));
              return (
                <div className="topic-row" key={topic}>
                  <div className="topic-row-top">
                    <strong>{topic}</strong>
                    <span>{count}問</span>
                  </div>
                  <div className="topic-track">
                    <div className="topic-fill" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card compact-section">
        <div className="section-head">
          <div>
            <span className="badge">Recent</span>
            <h2>最近の問題</h2>
          </div>
          {items.length > 0 && <button className="secondary" onClick={clear}>履歴を消す</button>}
        </div>

        {recent.length === 0 ? (
          <p className="small">最近の問題はまだありません。</p>
        ) : (
          <div className="recent-list">
            {recent.map((item, index) => (
              <a className="recent-item" href={`/learn?problem=${encodeURIComponent(item.input)}`} key={`${item.createdAt}-${index}`}>
                <div>
                  <strong>{item.input}</strong>
                  <p className="small">{item.topic ?? "未分類"} / {item.kind}</p>
                </div>
                <span>{formatDate(item.createdAt)}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
