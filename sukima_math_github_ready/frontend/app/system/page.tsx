"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { healthCheck, systemSelfTest } from "@/lib/api";

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

type SelfTest = {
  ok?: boolean;
  version?: string;
  checks?: Check[];
};

type Health = {
  ok?: boolean;
  service?: string;
  version?: string;
};

export default function SystemPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [self, setSelf] = useState<SelfTest | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    try {
      const [h, s] = await Promise.all([healthCheck(), systemSelfTest()]);
      setHealth(h as Health);
      setSelf(s as SelfTest);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void run();
  }, []);

  const checks = useMemo(() => self?.checks ?? [], [self]);

  return (
    <div>
      <PageHeader
        badge="System Check"
        title="開発者向け自己診断"
        description="Backend接続、主要API、数式エンジン、グラフ生成をまとめて確認します。"
      />

      <div className="card system-summary">
        <div>
          <span className={health?.ok && self?.ok ? "badge success-badge" : "badge warn-badge"}>
            {health?.ok && self?.ok ? "All Green" : "Needs Check"}
          </span>
          <h2>接続状態</h2>
          <p className="small">
            Backend: {health?.service ?? "未確認"} / Version: {health?.version ?? self?.version ?? "unknown"}
          </p>
        </div>
        <button onClick={run}>再チェック</button>
      </div>

      {error && <div className="card status-warn">{error}</div>}

      <div className="grid">
        {checks.map((check) => (
          <div className={`card system-check ${check.ok ? "ok-row" : "bad-row"}`} key={check.name}>
            <span className={check.ok ? "badge success-badge" : "badge warn-badge"}>
              {check.ok ? "OK" : "NG"}
            </span>
            <h3>{check.name}</h3>
            <p className="small">{check.detail}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>見る順番</h2>
        <div className="focus-flow">
          <a href="/dashboard">1. ホーム</a>
          <span>→</span>
          <a href="/learn">2. 解説</a>
          <span>→</span>
          <a href="/learn">3. 診断・復習</a>
        </div>
      </div>
    </div>
  );
}
