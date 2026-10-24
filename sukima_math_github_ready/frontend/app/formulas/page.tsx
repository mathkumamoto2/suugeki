
import { MathBlock } from "@/components/MathBlock";
import { PageHeader } from "@/components/PageHeader";

const formulas = [
  ["べき関数", "\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C\\quad(n\\ne -1)"],
  ["1/x", "\\int \\frac{1}{x}\\,dx=\\log|x|+C"],
  ["指数関数", "\\int e^x\\,dx=e^x+C"],
  ["sin", "\\int \\sin x\\,dx=-\\cos x+C"],
  ["cos", "\\int \\cos x\\,dx=\\sin x+C"],
  ["部分積分", "\\int u\\,dv=uv-\\int v\\,du"],
  ["置換積分", "u=g(x),\\quad du=g'(x)dx"],
  ["定積分", "\\int_a^b f(x)\\,dx=F(b)-F(a)"],
  ["arctan", "\\int \\frac{1}{1+x^2}\\,dx=\\arctan x+C"],
  ["ガウス関数", "\\int e^{-x^2}\\,dx=\\frac{\\sqrt{\\pi}}{2}\\operatorname{erf}(x)+C"],
];

export default function FormulasPage() {
  return (
    <div>
      <PageHeader badge="Formula Library" title="公式を、使える形で確認。" description="積分で使う基本公式をTeXで整理しています。" />
      <div className="grid">
        {formulas.map(([title, tex]) => (
          <div className="card feature-card" key={title}>
            <h2>{title}</h2>
            <MathBlock tex={tex} />
          </div>
        ))}
      </div>
    </div>
  );
}
