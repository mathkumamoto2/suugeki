"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ultimateFeatureMatrix } from "@/lib/api";

type Feature = { id: number; name: string; status: string; path: string };
type Group = { group: string; features: Feature[] };

export default function UltimatePage() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    ultimateFeatureMatrix().then((data) => {
      const d = data as unknown as { groups: Group[] };
      setGroups(d.groups ?? []);
    });
  }, []);

  return (
    <div>
      <PageHeader
        badge="Sukima Ultimate"
        title="全機能マトリクス"
        description="OCRを除外し、診断・復習・可視化・入力UX・ゲーム化を統合した機能一覧です。"
      />

      {groups.map((group) => (
        <div className="card" key={group.group}>
          <h2>{group.group}</h2>
          <div className="grid">
            {group.features.map((f) => (
              <a className="card feature-card" key={f.id} href={f.path.startsWith("/") ? f.path : "#"}>
                <span className="badge">#{f.id} {f.status}</span>
                <h3>{f.name}</h3>
                <p className="small">{f.path}</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
