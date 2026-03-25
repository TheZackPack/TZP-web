"use client";

const PARTICLE_COUNT = 25;

function generateParticles() {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 2;
    const duration = 15 + Math.random() * 20;
    const delay = Math.random() * duration;
    const opacity = 0.1 + Math.random() * 0.2;
    const hue = Math.random() > 0.5 ? "bg-accent" : "bg-primary";

    particles.push(
      <div
        key={i}
        className={`absolute rounded-full ${hue}`}
        style={{
          left: `${left}%`,
          bottom: "-10px",
          width: `${size}px`,
          height: `${size}px`,
          opacity,
          animation: `float ${duration}s linear ${delay}s infinite`,
        }}
      />
    );
  }
  return particles;
}

const particles = generateParticles();

export default function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles}
    </div>
  );
}
