import Avatar from "boring-avatars";

export function BoringUserAvatar({
  seed,
  size = 80,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <Avatar
      name={seed}
      variant="beam"
      square
      size={size}
      className={className}
    />
  );
}
