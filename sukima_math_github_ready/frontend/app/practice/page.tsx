
import { PageHeader } from "@/components/PageHeader";

const bank = {
  "基本公式": ["x^3", "1/x", "e^x", "sin(x)", "cos(2*x)"],
  "置換積分": ["2*x*cos(x^2)", "2*x*e^(x^2)", "1/(x+1)"],
  "部分積分": ["x e^x", "x^2 e^x", "log(x)"],
  "有理関数": ["1/(x^2+3*x+2)", "x/(x^2+1)"],
  "難問・特殊関数": ["e^(-x^2)", "sin(x)^2", "tan(x)", "1/(1+x^2)"],
};

export default function PracticePage() {
  return (
    <div>
      <PageHeader badge="Practice" title="ヒントを使って、再現する。" description="まず自力で方針を考え、分からなければヒントモードへ進みます。" />
      {Object.entries(bank).map(([topic, problems]) => (
        <div className="card" key={topic}>
          <h2>{topic}</h2>
          <div className="grid">
            {problems.map((p, i) => (
              <div className="card feature-card" key={p}>
                <span className="badge">問題 {i + 1}</span>
                <h3>∫ {p} dx</h3>
                <p className="small">方針を考えてから、解説・ヒント・診断を使ってください。</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
