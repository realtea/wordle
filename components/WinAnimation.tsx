"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

const COLORS = [
  "#538d4e", // green
  "#b59f3b", // yellow
  "#ff6b6b", // red
  "#4ecdc4", // teal
  "#ffe66d", // gold
  "#a8e6cf", // mint
  "#ff8a5c", // orange
  "#f8a5c2", // pink
  "#7bed9f", // lime
  "#70a1ff", // blue
];

export default function WinAnimation() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 10,
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
        drift: -30 + Math.random() * 60,
      });
    }
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
