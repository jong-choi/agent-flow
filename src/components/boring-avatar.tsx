import Avatar from "boring-avatars";

const generateColorsFromSeed = (param: string): string[] => {
  const baseColors = [
    "#ea580c",
    "#0284c7",
    "#65a30d",
    "#d97706",
    "#db2777",
    "#16a34a",
    "#9333ea",
    "#0891b2",
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
export function BoringUserAvatar({
  seed = "default",
  size = 80,
  className = "",
  square = true,
}: {
  seed?: string;
  size?: number;
  className?: string;
  square?: boolean;
}) {
  return (
    <Avatar
      name={seed}
      variant="beam"
      square={square}
      size={size}
      className={className}
      colors={generateColorsFromSeed(seed)}
    />
  );
}

export function BoringCardAvatar({
  seed = "default",
  size = 80,
  className = "",
  square = true,
  variant = "marble",
}: {
  seed?: string;
  size?: number;
  className?: string;
  square?: boolean;
  variant?: "bauhaus" | "marble";
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
