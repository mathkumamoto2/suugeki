"use client";

const particles = Array.from({ length: 96 }, (_, i) => {
  const angle = (360 / 96) * i;
  const ring = i % 4;
  const radius = 105 + ring * 26;
  const size = 3 + (i % 5);
  const delay = -(i * 0.17);
  const hue = i % 3 === 0 ? "cyan" : i % 3 === 1 ? "violet" : "blue";
  const y = ((i % 12) - 6) * 7;
  return { angle, radius, size, delay, hue, y };
});

export function ParticleSphere() {
  return (
    <div className="particle-stage" aria-hidden="true">
      <div className="particle-core">
        <span className="core-ring ring-a" />
        <span className="core-ring ring-b" />
        <span className="core-ring ring-c" />
        <span className="core-symbol">∫</span>
      </div>

      <div className="particle-orbit orbit-a">
        {particles.map((p, i) => (
          <span
            className={`particle-dot particle-${p.hue}`}
            key={i}
            style={{
              "--angle": `${p.angle}deg`,
              "--radius": `${p.radius}px`,
              "--size": `${p.size}px`,
              "--delay": `${p.delay}s`,
              "--y": `${p.y}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="particle-orbit orbit-b">
        {particles.slice(0, 48).map((p, i) => (
          <span
            className={`particle-dot particle-${p.hue}`}
            key={i}
            style={{
              "--angle": `${p.angle + 11}deg`,
              "--radius": `${p.radius * 0.72}px`,
              "--size": `${Math.max(2, p.size - 1)}px`,
              "--delay": `${p.delay * 1.2}s`,
              "--y": `${-p.y * 0.7}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
