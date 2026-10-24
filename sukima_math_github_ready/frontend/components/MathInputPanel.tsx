"use client";

const snippets = [
  { label: "x²", value: "x^2" },
  { label: "eˣ", value: "e^x" },
  { label: "sin", value: "sin(x)" },
  { label: "cos", value: "cos(x)" },
  { label: "1/x", value: "1/x" },
  { label: "置換", value: "2*x*cos(x^2)" },
  { label: "部分積分", value: "x^2e^x" },
  { label: "有理関数", value: "1/(x^2+3*x+2)" },
];

export function MathInputPanel({
  input,
  onInput,
}: {
  input: string;
  onInput: (value: string) => void;
}) {
  return (
    <div className="card">
      <span className="badge">Math Input</span>
      <label>
        式
        <input className="input math-input" value={input} onChange={(e) => onInput(e.target.value)} />
      </label>
      <div className="snippet-row">
        {snippets.map((s) => (
          <button className="secondary" key={s.label} onClick={() => onInput(s.value)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="small">入力は x^2, e^x, sin(x), 1/(x^2+1) のように書けます。表示はLaTeXで整えます。</p>
    </div>
  );
}
