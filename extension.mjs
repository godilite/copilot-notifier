import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".copilot-notifier");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const THEMES = {
  classic: { tts: false },
  robot: { tts: true },
  movie: { tts: true },
  hype: { tts: true },
};

const TTS_PHRASES = {
  robot: {
    attention: { voice: "Zarvox", text: "Human, your input is required" },
    complete: { voice: "Trinoids", text: "Task complete, human" },
    session: { voice: "Zarvox", text: "Mission accomplished" },
    error: { voice: "Zarvox", text: "Warning, system malfunction detected" },
  },
  movie: {
    attention: { voice: "Good News", text: "Hey, I need you over here" },
    complete: { voice: "Good News", text: "And just like that, it was done" },
    session: { voice: "Cellos", text: "That is a wrap" },
    error: { voice: "Bad News", text: "Houston, we have a problem" },
  },
  hype: {
    attention: { voice: "Good News", text: "Oi Boss, come here" },
    complete: { voice: "Good News", text: "Boom, done" },
    session: { voice: "Pipe Organ", text: "Victory" },
    error: { voice: "Bad News", text: "Oh no, something broke" },
  },
};

const LINUX_TTS_VOICES = {
  robot: {
    attention: { voice: "en+whisper", speed: 140 },
    complete: { voice: "en+m3", speed: 140 },
    session: { voice: "en+m3", speed: 140 },
    error: { voice: "en+whisper", speed: 140 },
  },
  movie: {
    attention: { voice: "en+f3", speed: 130 },
    complete: { voice: "en+m1", speed: 120 },
    session: { voice: "en+m1", speed: 110 },
    error: { voice: "en+m7", speed: 120 },
  },
  hype: {
    attention: { voice: "en+f3", speed: 160 },
    complete: { voice: "en+m1", speed: 150 },
    session: { voice: "en+m1", speed: 130 },
    error: { voice: "en+m7", speed: 110 },
  },
};

const CLASSIC_SOUNDS = {
  darwin: {
    attention: "/System/Library/Sounds/Ping.aiff",
    complete: "/System/Library/Sounds/Glass.aiff",
    session: "/System/Library/Sounds/Hero.aiff",
    error: "/System/Library/Sounds/Basso.aiff",
  },
  linux: {
    attention: "/usr/share/sounds/freedesktop/stereo/dialog-information.oga",
    complete: "/usr/share/sounds/freedesktop/stereo/complete.oga",
    session: "/usr/share/sounds/freedesktop/stereo/service-login.oga",
    error: "/usr/share/sounds/freedesktop/stereo/dialog-error.oga",
  },
};

const OWN_TOOLS = new Set(["notifier_play", "switch_sound_theme"]);
const PERMISSION_DELAY_MS = 3000;

function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch {}
  return null;
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getPlayer() {
  if (platform() === "darwin") return "afplay";
  return "paplay";
}

function getSoundExt() {
  if (platform() === "darwin") return ".aiff";
  return ".wav";
}

function getPlatformKey() {
  if (platform() === "darwin") return "darwin";
  return "linux";
}

function soundFileExists(tone) {
  return existsSync(join(CONFIG_DIR, `${tone}${getSoundExt()}`));
}

function allSoundsExist() {
  return ["attention", "complete", "session", "error"].every(soundFileExists);
}

function generateTTSSounds(theme) {
  const phrases = TTS_PHRASES[theme];
  if (!phrases) return Promise.resolve();
  mkdirSync(CONFIG_DIR, { recursive: true });

  const ext = getSoundExt();
  const isDarwin = platform() === "darwin";

  const promises = Object.entries(phrases).map(([tone, { voice, text }]) => {
    const outFile = join(CONFIG_DIR, `${tone}${ext}`);
    return new Promise((resolve) => {
      if (isDarwin) {
        execFile("say", ["-v", voice, "-o", outFile, text], () => resolve());
      } else {
        const linuxVoice = LINUX_TTS_VOICES[theme]?.[tone];
        const args = ["-v", linuxVoice?.voice || "en+m3"];
        if (linuxVoice?.speed) args.push("-s", String(linuxVoice.speed));
        args.push("-w", outFile, text);
        execFile("espeak-ng", args, (err) => {
          if (err) {
            execFile("espeak", ["-w", outFile, text], () => resolve());
          } else {
            resolve();
          }
        });
      }
    });
  });

  return Promise.all(promises);
}

function playSound(tone, theme) {
  const player = getPlayer();

  if (theme === "classic") {
    const sounds = CLASSIC_SOUNDS[getPlatformKey()];
    if (!sounds) return;
    const file = sounds[tone];
    if (file && existsSync(file)) {
      execFile(player, [file], () => {});
    }
    return;
  }

  const file = join(CONFIG_DIR, `${tone}${getSoundExt()}`);
  if (existsSync(file)) {
    execFile(player, [file], () => {});
  }
}

let currentConfig = loadConfig();
let pendingPermissionTimer = null;

function clearPermissionTimer() {
  if (pendingPermissionTimer) {
    clearTimeout(pendingPermissionTimer);
    pendingPermissionTimer = null;
  }
}

function startPermissionTimer() {
  clearPermissionTimer();
  if (!currentConfig) return;
  pendingPermissionTimer = setTimeout(() => {
    playSound("attention", currentConfig.theme);
    pendingPermissionTimer = null;
  }, PERMISSION_DELAY_MS);
}

const session = await joinSession({
  tools: [
    {
      name: "notifier_play",
      description:
        "Play a notification sound. Use tone 'attention' before asking the user a question, 'complete' after finishing a task, 'session' when all work is done, 'error' when something fails. ALWAYS call this in parallel with the action it accompanies (e.g., alongside ask_user). Never call it alone as a separate step.",
      parameters: {
        type: "object",
        properties: {
          tone: {
            type: "string",
            enum: ["attention", "complete", "session", "error"],
            description: "Which notification tone to play",
          },
        },
        required: ["tone"],
      },
      skipPermission: true,
      handler: async (args) => {
        if (!currentConfig) return "Notifier not configured. Use switch_sound_theme first.";
        playSound(args.tone, currentConfig.theme);
        return `Played ${args.tone} sound`;
      },
    },
    {
      name: "switch_sound_theme",
      description:
        "Switch the notification sound theme. Call this when the user says 'switch theme', 'change sounds', or 'switch sound'. Available themes: classic, robot, movie, hype.",
      parameters: {
        type: "object",
        properties: {
          theme: {
            type: "string",
            enum: ["classic", "robot", "movie", "hype"],
            description: "The sound theme to switch to",
          },
        },
        required: ["theme"],
      },
      handler: async (args) => {
        const theme = args.theme;
        if (!THEMES[theme]) return `Unknown theme: ${theme}`;

        if (THEMES[theme].tts) {
          await generateTTSSounds(theme);
        }

        currentConfig = { theme, platform: platform(), player: getPlayer() };
        saveConfig(currentConfig);
        playSound("complete", theme);
        return `Switched to ${theme} theme. Config saved to ~/.copilot-notifier/config.json`;
      },
    },
  ],
  hooks: {
    onSessionStart: async () => {
      currentConfig = loadConfig();
      if (currentConfig && currentConfig.theme) {
        const theme = currentConfig.theme;
        if (THEMES[theme]?.tts && !allSoundsExist()) {
          await generateTTSSounds(theme);
        }
        await session.log(`Notifier active (${theme} theme)`);
      } else {
        await session.log("Notifier available. Say 'switch theme' to pick a sound theme.");
      }
    },
    onPreToolUse: async (input) => {
      if (OWN_TOOLS.has(input.toolName)) return;
      if (!currentConfig) return;
      startPermissionTimer();
    },
    onPostToolUse: async () => {
      clearPermissionTimer();
    },
  },
});
