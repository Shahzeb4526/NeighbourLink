import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

// Expo creates local machine state in .expo; clear it before doctor in non-git setups.
if (existsSync(".expo")) {
  rmSync(".expo", { recursive: true, force: true });
}

const forwardedArgs = process.argv.slice(2);
const quotedArgs = forwardedArgs
  .map((arg) => `"${String(arg).replace(/"/g, '\\"')}"`)
  .join(" ");
const command = `npx expo-doctor${quotedArgs ? ` ${quotedArgs}` : ""}`;

const result = spawnSync(command, {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error(result.error.message || "Failed to run expo-doctor.");
}

process.exit(result.status ?? 1);
