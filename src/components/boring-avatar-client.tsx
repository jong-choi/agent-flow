"use client";

import dynamic from "next/dynamic";

const Avatar = dynamic(() => import("boring-avatars"), { ssr: false });

const generateColorsFromSeed = (param: string): string[] => {
  const baseColors = [
    "#667EEA",
    "#764BA2",
    "#F093FB",
    "#4FACFE",
    "#00F2FE",
    "#43E97B",
    "#FA709A",
    "#FEE140",
    "#30CFD0",
    "#A8EDEA",
  ];
  const seed = param.padEnd(5, "0");
  const chunkSize = Math.floor(seed.length / 5);
  const chunks = [];

  for (let i = 0; i < 5; i++) {
    const start = i * chunkSize;
    const end = i === 4 ? seed.length : (i + 1) * chunkSize;
    chunks.push(seed.slice(start, end));
  }

  return chunks.map((chunk) => {
    let sum = 0;
    for (let i = 0; i < chunk.length; i++) {
      sum += chunk.charCodeAt(i);
    }

    const index = sum % baseColors.length;
    return baseColors[index];
  });
};

export function BoringAvatarClient({
  seed = "default",
  size = 80,
  className = "",
  square = true,
  variant,
}: {
  seed?: string;
  size?: number;
  className?: string;
  square?: boolean;
  variant?: "bauhaus" | "marble" | "beam";
}) {
  return (
    <Avatar
      name={seed}
      variant={variant}
      square={square}
      size={size}
      className={className}
      colors={generateColorsFromSeed(seed)}
    />
  );
}
