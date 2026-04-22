#!/usr/bin/env node

import { mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_SOURCE = join(__dirname, "..", "extension.mjs");
const TARGET_DIR = join(homedir(), ".copilot", "extensions", "copilot-notifier");
const TARGET_FILE = join(TARGET_DIR, "extension.mjs");

const args = process.argv.slice(2);
const command = args[0] || "install";

function install() {
  mkdirSync(TARGET_DIR, { recursive: true });
  copyFileSync(EXTENSION_SOURCE, TARGET_FILE);
  console.log("");
  console.log("  \x1b[32m✔\x1b[0m Copilot Notifier installed");
  console.log("");
  console.log("  Location: ~/.copilot/extensions/copilot-notifier/extension.mjs");
  console.log("");
  console.log("  Next steps:");
  console.log("    1. Restart Copilot CLI (or run /clear)");
  console.log('    2. Say "switch theme" to pick a sound theme');
  console.log("");
}

function uninstall() {
  if (existsSync(TARGET_DIR)) {
    rmSync(TARGET_DIR, { recursive: true });
    console.log("");
    console.log("  \x1b[32m✔\x1b[0m Copilot Notifier uninstalled");
    console.log("");
    console.log("  To also remove cached sounds:");
    console.log("    rm -rf ~/.copilot-notifier");
    console.log("");
  } else {
    console.log("");
    console.log("  Nothing to uninstall. Extension not found at:");
    console.log("  ~/.copilot/extensions/copilot-notifier/");
    console.log("");
  }
}

function help() {
  console.log("");
  console.log("  \x1b[1mCopilot Notifier\x1b[0m - Audio notifications for GitHub Copilot CLI");
  console.log("");
  console.log("  Usage:");
  console.log("    npx copilot-notifier            Install the extension");
  console.log("    npx copilot-notifier uninstall   Remove the extension");
  console.log("    npx copilot-notifier help        Show this help");
  console.log("");
}

switch (command) {
  case "install":
    install();
    break;
  case "uninstall":
  case "remove":
    uninstall();
    break;
  case "help":
  case "--help":
  case "-h":
    help();
    break;
  default:
    console.error(`  Unknown command: ${command}`);
    help();
    process.exit(1);
}
