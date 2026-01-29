import { spawnSync } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";

const root = process.cwd();
const debounceMs = Number(process.env.AUTO_DEPLOY_DEBOUNCE_MS || 3000);
const vercelToken =
  process.env.VERCEL_TOKEN ||
  process.env.VERCEL_AUTH_TOKEN ||
  process.env.VERCEL_ACCESS_TOKEN;

const ignoredDirs = new Set([
  ".git",
  ".vercel",
  ".vscode",
  ".rules",
  "dist",
  "docs",
  "node_modules",
  "supabase",
]);

const shouldIgnore = (filePath) => {
  if (!filePath) return true;
  const normalized = filePath.replace(/\\/g, "/");
  const firstSegment = normalized.split("/")[0];
  if (ignoredDirs.has(firstSegment)) return true;
  return false;
};

const run = (cmd, args, options = {}) =>
  spawnSync(cmd, args, { cwd: root, stdio: "inherit", ...options });

const hasChanges = () => {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });
  return result.stdout.trim().length > 0;
};

const hasStagedChanges = () => {
  const result = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: root,
    encoding: "utf8",
  });
  return result.stdout.trim().length > 0;
};

const commitAndDeploy = () => {
  if (!hasChanges()) return;

  run("git", ["add", "-A"]);
  if (!hasStagedChanges()) return;

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const message = `chore: auto deploy ${timestamp}`;
  const commit = run("git", ["commit", "-m", message], { stdio: "inherit" });
  if (commit.status !== 0) return;

  run("git", ["push", "origin", "main"]);

  if (vercelToken) {
    run(
      "vercel",
      ["deploy", "--prod", "--confirm", "--token", vercelToken],
      { stdio: "inherit" },
    );
  } else {
    console.log(
      "Auto-deploy: Vercel token not set. Relying on Git integration for production deploy.",
    );
  }
};

let timer = null;
const schedule = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    commitAndDeploy();
  }, debounceMs);
};

console.log(`Auto-deploy watching for changes in ${root}`);
watch(
  root,
  { recursive: true },
  (_eventType, filename) => {
    if (shouldIgnore(filename)) return;
    schedule();
  },
);
