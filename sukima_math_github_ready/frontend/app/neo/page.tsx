import { PageHeader } from "@/components/PageHeader";
import { NeoStatusCard } from "@/components/NeoStatusCard";

export default function NeoPage() {
  return (
    <div>
      <PageHeader
        badge="Sukima Neo"
        title="数学をゲームのように進める。"
        description="XP、レベル、バッジ、クエスト、バトルで、積分学習を継続できる形にします。"
      />

      <NeoStatusCard />

      <div className="grid">
        <a className="card feature-card" href="/quests">
          <span className="badge">Quest</span>
          <h2>今日のクエスト</h2>
          <p className="small">毎日の学習タスクでXPを稼ぐ。</p>
        </a>
        <a className="card feature-card" href="/battle">
          <span className="badge">Battle</span>
          <h2>積分バトル</h2>
          <p className="small">制限時間つきの演習で集中して解く。</p>
        </a>
        <a className="card feature-card" href="/roadmap">
          <span className="badge">Roadmap</span>
          <h2>スキルロードマップ</h2>
          <p className="small">どの単元を攻略すべきか見る。</p>
        </a>
        <a className="card feature-card" href="/history">
          <span className="badge">Dashboard</span>
          <h2>履歴ダッシュボード</h2>
          <p className="small">自分の弱点傾向を見る。</p>
        </a>
      </div>
    </div>
  );
}
