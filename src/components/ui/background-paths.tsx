"use client";

import { motion } from "framer-motion";

function MathEquation({
  equation,
  delay,
  x,
  y,
}: { equation: string; delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute text-muted-foreground/40 font-mono text-lg select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.6, 0.5, 0],
        y: [0, -300],
      }}
      transition={{
        duration: 20 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        delay,
        ease: "linear",
      }}
    >
      {equation}
    </motion.div>
  );
}

export function BackgroundPaths() {
  const mathEquations = [
    "a² + b² = c²",
    "∫ f(x)dx",
    "∑ᵢ₌₁ⁿ i = n(n+1)/2",
    "e^(iπ) + 1 = 0",
    "∂f/∂x",
    "lim(x→∞)",
    "√(x² + y²)",
    "sin²θ + cos²θ = 1",
    "dy/dx",
    "∇·F = 0",
    "f(x) = mx + b",
    "x = (-b ± √(b²-4ac))/2a",
    "∞",
    "π ≈ 3.14159",
    "∫₀^∞ e^(-x²)dx = √π/2",
    "Σ",
    "∏",
    "∆x → 0",
    "log₂(x)",
    "n!",
    "∈ ℝ",
    "∀x ∃y",
    "f'(x) = lim(h→0) [f(x+h)-f(x)]/h",
    "∫∫∫",
    "cos(x)",
    "tan(θ)",
    "e^x",
    "ln(x)",
  ];

  // Create multiple layers of equations for better coverage
  const createEquations = (startDelay: number) => {
    return mathEquations.map((eq, i) => (
      <MathEquation
        key={`${startDelay}-${i}`}
        equation={eq}
        delay={i * 0.5 + startDelay}
        x={Math.random() * 90 + 5}
        y={Math.random() * 120 + 10}
      />
    ));
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {createEquations(0)}
        {createEquations(10)}
        {createEquations(20)}
      </div>
    </div>
  );
}
