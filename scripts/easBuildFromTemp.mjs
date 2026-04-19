import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const sourceDir = process.cwd();
const stageDir = join(tmpdir(), "neighbourlink-eas-stage");

const excludedNames = new Set([
  ".git",
  ".expo",
  ".vscode",
  "node_modules",
  "android",
  "ios",
  "dist",
  "web-build",
]);

const shouldIncludePath = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");

  if (parts.some((part) => excludedNames.has(part))) {
    return false;
  }

  if (normalized.endsWith(".log")) {
    return false;
  }

  return true;
};

if (existsSync(stageDir)) {
  rmSync(stageDir, { recursive: true, force: true });
}

cpSync(sourceDir, stageDir, {
  recursive: true,
  filter: shouldIncludePath,
});

const normalizePermissions = (rootDir) => {
  const stack = [rootDir];

  while (stack.length) {
    const currentPath = stack.pop();
    let stats;

    try {
      stats = lstatSync(currentPath);
    } catch {
      continue;
    }

    try {
      if (stats.isDirectory()) {
        chmodSync(currentPath, 0o755);
      } else {
        chmodSync(currentPath, 0o644);
      }
    } catch {
      // Best effort on Windows; continue to normalize remaining files.
    }

    if (!stats.isDirectory()) {
      continue;
    }

    let entries = [];
    try {
      entries = readdirSync(currentPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      stack.push(join(currentPath, entry));
    }
  }
};

normalizePermissions(stageDir);

const installResult = spawnSync("npm install --silent", {
  cwd: stageDir,
  shell: true,
  stdio: "inherit",
});

if (installResult.error) {
  console.error(
    installResult.error.message ||
      "Failed to install dependencies in staging directory.",
  );
  process.exit(installResult.status ?? 1);
}

if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}

const extraArgs = process.argv.slice(2);
if (!extraArgs.includes("--non-interactive")) {
  extraArgs.push("--non-interactive");
}
if (!extraArgs.includes("--no-wait")) {
  extraArgs.push("--no-wait");
}

const command = `eas build ${extraArgs.map((arg) => `\"${String(arg).replace(/\"/g, '\\"')}\"`).join(" ")}`;
const env = {
  ...process.env,
  EAS_NO_VCS: "1",
  EAS_PROJECT_ROOT: stageDir,
};

const result = spawnSync(command, {
  cwd: stageDir,
  env,
  shell: true,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message || "Failed to run EAS build.");
}

process.exit(result.status ?? 1);
