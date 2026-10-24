"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getNeoSkillMap } from "@/lib/api";

type Skill = {
  id: string;
  title: string;
  level: number;
  depends_on: string[];
  examples: string[];
};

export default function RoadmapPage() {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    getNeoSkillMap().then((data) => {
      const d = data as unknown as { skills: Skill[] };
      setSkills(d.skills ?? []);
    });
  }, []);

  return (
    <div>
      <PageHeader badge="Skill Roadmap" title="積分の攻略マップ" description="どの単元がどの単元につながっているかを見える化します。" />

      <div className="grid">
        {skills.map((skill) => (
          <div className="card feature-card" key={skill.id}>
            <span className="badge">Level {skill.level}</span>
            <h2>{skill.title}</h2>
            <p className="small">前提：{skill.depends_on.length ? skill.depends_on.join(" / ") : "なし"}</p>
            <div>
              {skill.examples.map((ex) => <span className="badge" key={ex}>{ex}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
