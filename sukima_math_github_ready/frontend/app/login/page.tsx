"use client";

import { useEffect, useState } from "react";
import { clearUser, readUser, saveUser, type SukimaUser } from "@/lib/auth";
import { ParticleSphere } from "@/components/ParticleSphere";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("微積の途中式を理解できるようになる");
  const [existingUser, setExistingUser] = useState<SukimaUser | null>(null);

  useEffect(() => {
    const user = readUser();
    setExistingUser(user);
    if (user) {
      setName(user.name);
      setGoal(user.goal);
    }
  }, []);

  function start() {
    saveUser(name, goal);
    window.location.href = "/dashboard";
  }

  function continueLearning() {
    window.location.href = "/dashboard";
  }

  function resetAndStart() {
    clearUser();
    setExistingUser(null);
    setName("");
    setGoal("微積の途中式を理解できるようになる");
  }

  return (
    <main className="neo-login-page">
      <div className="neo-grid-bg" />
      <div className="neo-noise" />

      <section className="neo-login-visual">
        <div className="neo-kicker">Sukima Focus</div>
        <h1>
          数式の
          <span> 隙間 </span>
          を、理解に変える。
        </h1>
        <p>
          答えだけでは終わらない。途中式、ミス診断、復習ルート、学習ミッションまでを
          ひとつの流れに統合した微積ラーニングOS。
        </p>

        <ParticleSphere />

        <div className="neo-flow-card">
          <div>
            <strong>Today Flow</strong>
            <p>Home → Explain → Diagnose → Review</p>
          </div>
          <div className="neo-mini-progress">
            <span style={{ width: "72%" }} />
          </div>
        </div>
      </section>

      <section className="neo-login-panel-wrap">
        <div className="neo-login-panel">
          <div className="neo-panel-top">
            <span className="neo-badge">Private Local Login</span>
            <h2>{existingUser ? "おかえりなさい" : "学習を始める"}</h2>
            <p>
              {existingUser
                ? "前回の学習プロフィールが残っています。そのまま続けるか、新しく始められます。"
                : "入力情報はブラウザ内に保存されます。サーバー認証は使いません。"}
            </p>
          </div>

          {existingUser && (
            <div className="return-card">
              <strong>{existingUser.name} さん</strong>
              <p className="small">{existingUser.goal}</p>
              <button className="neo-login-button" onClick={continueLearning}>
                前回の続きから始める
                <span>→</span>
              </button>
            </div>
          )}

          <label>
            名前
            <input
              className="input neo-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ばし"
            />
          </label>

          <label>
            今日の目標
            <input
              className="input neo-input"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>

          <button className="neo-login-button" onClick={start}>
            {existingUser ? "内容を更新してホームへ" : "ログインしてホームへ"}
            <span>→</span>
          </button>

          {existingUser && (
            <button className="secondary reset-login-button" onClick={resetAndStart}>
              別ユーザーとして始める
            </button>
          )}

          <div className="neo-login-stats">
            <div>
              <strong>3</strong>
              <span>Core Steps</span>
            </div>
            <div>
              <strong>XP</strong>
              <span>Mission</span>
            </div>
            <div>
              <strong>∫</strong>
              <span>Calculus</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
