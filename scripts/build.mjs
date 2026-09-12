import { spawnSync } from "node:child_process";

// Type checking in Next's retained webpack process can exceed bounded builders.
// Run it to completion first; only this verified child skips Next's duplicate check.
for (const args of [
  ["node_modules/next/dist/bin/next", "typegen"],
  ["node_modules/typescript/bin/tsc", "--noEmit"],
]) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
  {
    stdio: "inherit",
    env: { ...process.env, NEXT_BUILD_TYPECHECKED: "1" },
  },
);
process.exit(result.status ?? 1);
