# After Hours — Personal Coding & Research Music Studio

> A cinematic, self-hostable personal focus studio and vintage cassette player. Atmospheric scenery, customizable digital clock, pomodoro timers, and flexible playlist management.

![After Hours Preview](/cover.png)

---

## Highlights & Capabilities

### 1. Cinematic Workspace & Retro Cassette Deck
- **Full-Viewport Canvas**: Zero vertical scroll, crafted to feel like an authentic late-night coding retreat.
- **Physical Cassette Player**: Rotating tape hubs, drive teeth, dynamic tape spool winding (supply spool shrinks as take-up spool fills), marquee text scroll for long titles, and mechanical click sound effects synthesized in pure Web Audio.
- **Full Playback Transport**: Play, pause, skip forward/backward, drag seek bar, volume slider with mute toggle, shuffle, and cycle repeat modes (off / all / one).
- **Compliant YouTube Embed Window**: Includes an expandable picture-in-picture video viewer conforming to YouTube API Terms of Service with full visibility.

### 2. Premium Digital Clock
- **High-Precision Seconds**: Synchronized to exact second boundaries with zero interval drift.
- **Smooth Blinking Colon**: Smoothly fades without causing layout shifts via monospace tabular numerals.
- **Customizable**:
  - 12-hour (03:14:25 AM) vs 24-hour (15:14:25) format
  - Show / hide seconds
  - Blinking colon toggle & interval
  - Timezone selector supporting IANA identifiers (Local, UTC, Tokyo, London, New York, etc.)
  - AM/PM indicator, date display, timezone abbreviation
  - Font size slider & opacity slider
  - Alignment (Left, Center, Right)
  - Full-Screen Digital Clock mode

### 3. Integrated Focus & Pomodoro Studio
- **Timer Modes**: Pomodoro (25m), Short Break (5m), Long Break (15m), Custom Countdown, and Stopwatch count-up.
- **Anti-Throttling Engine**: Uses `performance.now()` delta math so browser background tab suspension does not cause timer drift.
- **Sensory Feedback**: Synthesized 528 Hz Solfeggio meditative completion bell and optional browser Web Notifications.
- **Session Tracker**: Tracks completed focus blocks locally.
- **Tab Title Integration**: Displays remaining time in the browser tab title.

### 4. Unlimited Playlist Management
- **Preset Libraries**:
  - Late Night Coding
  - Deep Focus
  - Research Sessions
  - Lofi & Chill
  - Ambient Instrumental
- **Import Sources**:
  - YouTube Playlist URL or ID
  - Single YouTube Video URL or ID
  - User-owned local audio files (`.mp3`, `.wav`, `.m4a`, `.ogg`) using HTMLAudioElement
- **Full Management**: Rename, delete with confirmation, reorder with up/down controls, set startup default, and toggle favorites with persistent local storage.

### 5. Studio Personalization
- **11 Curated Atmospheric Sceneries**: Warm amber lamp, rainy window glow, vintage studio, midnight terminal, etc., or user-supplied image URL.
- **Lighting Controls**: Real-time background brightness and soft Gaussian blur sliders.
- **Custom Headings**: Editable editorial title and secondary line.
- **Accent Tints**: Amber, Warm Bronze, Emerald, Indigo, Rose, Cyan.
- **Accessibility**: First-class Reduced Motion mode, semantic ARIA buttons, and keyboard shortcuts.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` | Play / Pause playback |
| `←` / `→` | Seek backward / forward 5 seconds |
| `M` | Mute / Unmute audio |
| `F` | Enter / Exit Fullscreen Mode |
| `T` | Open Focus Timer |

*(Shortcuts automatically yield when typing in inputs or textareas)*

---

## Getting Started

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open http://localhost:3000 in your browser
```

### Running Tests & Quality Checks

```bash
# Typecheck TypeScript (Strict mode)
npm run typecheck

# Run ESLint
npm run lint

# Run Vitest unit & integration test suites
npm run test

# Run Playwright End-to-End browser tests
npm run test:e2e

# Run all checks at once
npm run check
```

---

## Deployment & Production

### 1. Node.js Production Server

```bash
npm run build
npm run start
```

### 2. Docker Self-Hosting

```bash
# Build the production Docker image
docker build -t after-hours:latest .

# Run container on port 3000
docker run -p 3000:3000 -d --name after-hours-app after-hours:latest
```

### 3. Vercel Deployment

Push this repository to GitHub/GitLab and import directly into Vercel. Next.js App Router and standalone optimization will configure zero-config deployments automatically.

### 4. Health Check

The server responds on `http://localhost:3000/` with status `200 OK`.

---

## License

MIT License.
