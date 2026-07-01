# Math Crossword Challenge

A mobile-style math puzzle game built with HTML5 Canvas. Players fill blank cells in crossword-style equation grids by picking the correct numbers from a tray.

**Version:** 1.0.1

## Quick Start

1. Open `index.html` in a modern web browser (Chrome, Edge, Firefox, Safari).
2. No build step or server is required for local play.
3. For best results, use a phone-sized viewport or resize the browser window.

```bash
# Optional: serve locally
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080` (or the port shown).

## How to Play

1. Tap **PLAY** on the home screen.
2. Read the short tutorial on first launch (optional).
3. Select a number from the bottom tray, then tap a blank cell in the grid.
4. Complete all equations before the timer runs out.
5. Earn coins for correct placements and clear the level to unlock the next one.

## Features

- **30 levels** with increasing difficulty
- **Handcrafted puzzles** for Levels 3–20
- **Procedural levels** for Levels 1–2 (tutorial) and Levels 21–30
- **Timer, coins, and score** tracking
- **Hint system** — 3 hints per level (auto-fills one blank)
- **Settings** — sound on/off, how-to-play guide
- **Progress saved** in `localStorage` (level, high score, sound preference)
- **Image-based UI** — buttons and panels use PNG assets (no canvas-drawn icons for dock buttons)

## Screens

| Screen | Description |
|--------|-------------|
| Title | Home with logo, stats, PLAY and LEVELS |
| Level select | Grid of 30 levels (locked until cleared) |
| Play | Equation grid, number tray, top bar, bottom dock |
| Settings | Sound toggle, link to help |
| Help | Tutorial and example puzzle |
| Result | Win/lose summary with next level or retry |

## Project Structure

```
Math Crossword Game/
├── index.html          # Entry page
├── game.js             # Game logic and rendering
├── styles.css          # Phone shell layout
├── README.md           # This file
├── report.txt          # Development report
├── math-crossword-game.md  # Game design overview
├── assets/
│   ├── home/           # Home screen images
│   └── ui/             # Play, dock, result images
├── rules/              # UI/design rules (Khmer)
└── sakurai/            # Planning reference docs
```

## Assets in Use

**Home:** `logo_math_adventure.png`, `mascot_calc.png`, `btn_play_home.png`, `btn_levels.png`

**Play UI:** `btn_back.png`, `btn_undo.png`, `dock_settings_notext.png`, `dock_hint_notext.png`, `dock_help_notext.png`

**Result:** `result_confetti.png`, `result_badge.png`, `result_clear_title.png`, `result_try_title.png`, `result_next.png`, `result_again.png`, `result_share.png`

## Technical Notes

- Canvas resolution: **1080 × 1920** (portrait)
- Rendering: single `game.js` loop with screen state machine
- Input: mouse and touch (tap buttons and cells)
- Sound: Web Audio API tap feedback (toggle in settings)

## Browser Support

Works in any browser with Canvas 2D and `localStorage` support.

## License

Project assets and code are for the Math Crossword Game product. See project owner for distribution terms.
