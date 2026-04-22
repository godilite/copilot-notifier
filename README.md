# Copilot Notifier

Audio notifications for [GitHub Copilot CLI](https://docs.github.com/en/copilot). Plays distinct sounds when Copilot finishes work, needs your input, or encounters an error. Step away from the screen and let the sound tell you when to come back.

https://github.com/user-attachments/assets/placeholder

## Features

- **4 built-in themes**: Classic (system chimes), Robot, Movie, Hype (TTS voices)
- **Automatic sounds**: Plays when Copilot asks a question, finishes a task, completes a session, or hits an error
- **Permission prompt detection**: Alerts you when Copilot is waiting for native tool permission (bash, edit, etc.)
- **Persistent config**: Theme choice survives across sessions. No re-setup needed.
- **Cross-platform**: macOS (`afplay`/`say`) and Linux (`paplay`/`espeak-ng`)
- **Zero dependencies**: Uses only system audio tools. Nothing to install.

## Install

### Option A: Global (all repos)

```bash
mkdir -p ~/.copilot/extensions/copilot-notifier
curl -fsSL https://raw.githubusercontent.com/godilite/copilot-notifier/main/extension.mjs \
  -o ~/.copilot/extensions/copilot-notifier/extension.mjs
```

Or clone:

```bash
git clone https://github.com/godilite/copilot-notifier.git \
  ~/.copilot/extensions/copilot-notifier
```

### Option B: Per-project

```bash
mkdir -p .github/extensions/copilot-notifier
curl -fsSL https://raw.githubusercontent.com/godilite/copilot-notifier/main/extension.mjs \
  -o .github/extensions/copilot-notifier/extension.mjs
```

### Verify

Restart Copilot CLI (or run `/clear`). You should see:

```
Notifier available. Say 'switch theme' to pick a sound theme.
```

## Usage

### Pick a theme

Say `switch theme` or `change sounds` in any Copilot CLI session.

| Theme | Style | Requires |
|-------|-------|----------|
| **classic** | System chimes (Glass, Ping, Hero, Basso) | Nothing extra |
| **robot** | Sci-fi robot voice ("Task complete, human") | `say` (macOS) or `espeak-ng` (Linux) |
| **movie** | Dramatic callouts ("Houston, we have a problem") | `say` (macOS) or `espeak-ng` (Linux) |
| **hype** | Over-the-top energy ("Boom, done") | `say` (macOS) or `espeak-ng` (Linux) |

### When sounds play

| Sound | When |
|-------|------|
| **Attention** | Copilot asks you a question or waits for permission |
| **Complete** | A task finishes |
| **Session** | All work for your request is done |
| **Error** | Something failed |

### Commands

- `switch theme` / `change sounds` - pick a different theme
- The extension remembers your choice across sessions

## How it works

The extension registers two tools and three hooks with Copilot CLI:

**Tools:**
- `notifier_play` - Copilot calls this alongside `ask_user` or at task boundaries
- `switch_sound_theme` - Switches between themes and regenerates TTS audio

**Hooks:**
- `onSessionStart` - Auto-resumes from saved config (`~/.copilot-notifier/config.json`)
- `onPreToolUse` - Starts a 3-second timer before each tool execution
- `onPostToolUse` - Cancels the timer if the tool completes (no permission prompt). If the timer fires, Copilot was blocked on a permission dialog, and the attention sound plays.

TTS themes pre-generate `.aiff` (macOS) or `.wav` (Linux) files to `~/.copilot-notifier/` on first use, then play the cached files for instant playback.

## Platform support

| Platform | Audio player | TTS engine | Status |
|----------|-------------|------------|--------|
| macOS | `afplay` | `say` | Full support |
| Linux | `paplay` / `aplay` | `espeak-ng` / `espeak` | Full support |
| Windows (WSL) | Via Linux tools | Via Linux tools | Should work |
| CI / headless | - | - | Silently skipped |

## Configuration

Config is stored at `~/.copilot-notifier/config.json`:

```json
{
  "theme": "movie",
  "platform": "darwin",
  "player": "afplay"
}
```

Generated sound files are cached at `~/.copilot-notifier/`:

```
~/.copilot-notifier/
  config.json
  attention.aiff
  complete.aiff
  session.aiff
  error.aiff
```

## Uninstall

```bash
rm -rf ~/.copilot/extensions/copilot-notifier
rm -rf ~/.copilot-notifier
```

Or for per-project:

```bash
rm -rf .github/extensions/copilot-notifier
```

## License

MIT
