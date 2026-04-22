# Copilot Notifier

> Stop staring at the terminal. Let it yell at you instead.

Audio notifications for [GitHub Copilot CLI](https://docs.github.com/en/copilot). Plays sounds when Copilot finishes work, needs your input, or breaks something. Go grab coffee. The robot will call you back.

## Features

- **4 themes**: Classic (system chimes), Robot ("Task complete, human"), Movie ("Houston, we have a problem"), Hype ("Boom, done")
- **Automatic**: Sounds play when Copilot asks questions, finishes tasks, wraps up sessions, or hits errors
- **Permission alerts**: Hear a sound when Copilot is stuck waiting for you to click "Allow"
- **Remembers you**: Theme choice persists across sessions. Set it once, forget about it.
- **Cross-platform**: macOS and Linux. Zero dependencies. Uses your system's built-in audio.

## Install

```bash
npx copilot-notifier
```

That's it. The extension is copied to `~/.copilot/extensions/copilot-notifier/` and works across all your repos.

Restart Copilot CLI (or run `/clear`). You should see:

```
Notifier available. Say 'switch theme' to pick a sound theme.
```

### Other install methods

<details>
<summary>npm global install</summary>

```bash
npm install -g copilot-notifier
copilot-notifier
```
</details>

<details>
<summary>curl (no npm needed)</summary>

```bash
mkdir -p ~/.copilot/extensions/copilot-notifier
curl -fsSL https://raw.githubusercontent.com/godilite/copilot-notifier/main/extension.mjs \
  -o ~/.copilot/extensions/copilot-notifier/extension.mjs
```
</details>

<details>
<summary>git clone</summary>

```bash
git clone https://github.com/godilite/copilot-notifier.git \
  ~/.copilot/extensions/copilot-notifier
```
</details>

<details>
<summary>Per-project (team setup)</summary>

```bash
mkdir -p .github/extensions/copilot-notifier
curl -fsSL https://raw.githubusercontent.com/godilite/copilot-notifier/main/extension.mjs \
  -o .github/extensions/copilot-notifier/extension.mjs
git add .github/extensions/copilot-notifier
```

Everyone who clones the repo gets the extension automatically.
</details>

## Usage

### Pick your vibe

Say `switch theme` or `change sounds` in any Copilot CLI session.

| Theme | Personality | What you'll hear |
|-------|------------|------------------|
| **classic** | Clean, professional | System chimes (Glass, Ping, Hero, Basso) |
| **robot** | Sci-fi overlord | "Human, your input is required" |
| **movie** | Dramatic narrator | "Houston, we have a problem" |
| **hype** | Your biggest fan | "Boom, done" |

TTS themes need `say` (macOS, built-in) or `espeak-ng` (Linux, `apt install espeak-ng`).

### What triggers sounds

| Sound | Trigger |
|-------|---------|
| 🔔 **Attention** | Copilot asks you something or waits for permission |
| ✅ **Complete** | A task finishes |
| 🎬 **Session** | All work is done |
| 💥 **Error** | Something went wrong |

## Under the hood

Two tools, three hooks. That's the whole extension.

**Tools** the agent calls:
- `notifier_play` - fires alongside `ask_user` or at task boundaries (runs silently, no permission prompt)
- `switch_sound_theme` - switches theme, regenerates TTS audio, saves config

**Hooks** that run automatically:
- `onSessionStart` - loads your saved theme from `~/.copilot-notifier/config.json`
- `onPreToolUse` - starts a 3s timer before every tool
- `onPostToolUse` - cancels the timer. If the timer fires first, Copilot was stuck on a permission dialog, so it plays the attention sound. Sneaky.

TTS themes generate `.aiff`/`.wav` files once and cache them at `~/.copilot-notifier/`.

## Platform support

| Platform | Player | TTS | Works? |
|----------|--------|-----|--------|
| macOS | `afplay` | `say` | ✅ Yes |
| Linux | `paplay` / `aplay` | `espeak-ng` | ✅ Yes |
| WSL | Linux tools | Linux tools | ✅ Probably |
| CI / headless | - | - | 🤷 Silently skipped |

## Files on disk

Config lives at `~/.copilot-notifier/`:

```
~/.copilot-notifier/
  config.json        ← your theme choice
  attention.aiff     ← cached TTS audio (generated once)
  complete.aiff
  session.aiff
  error.aiff
```

## Uninstall

```bash
npx copilot-notifier uninstall
rm -rf ~/.copilot-notifier
```

## License

MIT
