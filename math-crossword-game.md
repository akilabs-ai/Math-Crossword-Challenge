# Math Crossword Game — Design Document

## 1. Concept

**Title:** Math Crossword Challenge  
**Genre:** Educational puzzle / casual math  
**Platform:** Mobile web (portrait)  
**Audience:** Kids and casual players learning arithmetic  

Players complete a grid of linked math equations. Some cells are fixed (numbers and operators); blank cells must be filled with values from a limited number tray. Equations read across and down, like a crossword.

---

## 2. Core Loop

```
Home → Select Level → Play → (Win | Lose) → Next Level | Retry
         ↓
      Help / Settings (any time from play dock)
```

| Step | Player action | System response |
|------|---------------|-----------------|
| 1 | Tap PLAY or pick a level | Load puzzle, start timer |
| 2 | Select number from tray | Highlight selection |
| 3 | Tap blank cell | Place if correct (+coins) or shake if wrong |
| 4 | Fill all blanks | Level clear, save progress, show result |
| 5 | Timer hits zero | Time up, show retry screen |

---

## 3. Level Design

### 3.1 Level count

- **30 levels** total (`TOTAL_LEVELS = 30`)
- Each level has: name, time limit, starting coins, cell layout

### 3.2 Level sources

| Levels | Source | Notes |
|--------|--------|-------|
| 1–2 | `buildEasyLevelOne()` / `buildEasyLevelTwo()` | Simple addition, tutorial-friendly |
| 3–20 | `HANDCRAFTED_LEVELS` | Fixed layouts from puzzle design |
| 21–30 | `buildGeneratedLevel()` | Procedural grid generation |

### 3.3 Difficulty curve

- More cells and operators in later handcrafted levels
- Shorter time limits and more answer choices on higher levels
- Grid auto-scales cell size (`PLAY_CELL_MIN` 74 – `PLAY_CELL_MAX` 104) to fit the play panel

---

## 4. UI Specification

### 4.1 Canvas

- Size: **1080 × 1920**
- Wrapped in `.phone-shell` for responsive scaling (max ~540×960 CSS px)

### 4.2 Screens

#### Home (title)
- Logo, mascot, high score / level stats
- **PLAY** and **LEVELS** image buttons
- Decorative math marks background

#### Play
- **Top bar:** Back | Refresh | Level name | Timer pill | Coins pill
- **Board panel:** Equation grid with numbered blank cells
- **Number tray:** 2–6 option tiles
- **Bottom dock:** Settings | Hint | Help (PNG buttons, no text on dock images)

#### Settings
- Sound ON/OFF
- Link to How to Play

#### Help
- 3-step guide cards + live mini example

#### Result
- Win: confetti, badge, LEVEL CLEAR, score, NEXT
- Lose: TRY AGAIN, retry button

### 4.3 UI asset rules

Per project rules (`rules/rule-UI-Assets_km`):

- Use **PNG image assets** for buttons and panels
- Do **not** draw icon substitutes on canvas when an image asset exists
- Dock buttons use `*_notext.png` variants (icon only, no labels)

---

## 5. Power-ups & Assist

### Hint (middle dock button)

- **3 uses per level** (`HINTS_PER_LEVEL = 3`)
- Resets when level starts (`beginLevel()`)
- Action: auto-fills one random unsolved blank with the correct number
- Badge on button shows remaining count (3 → 0)
- Disabled overlay when count is 0

### Refresh (top bar)

- Restarts current level (resets grid, timer, hints, level coins)

### Help (right dock button)

- Opens How to Play screen (timer pauses)

### Settings (left dock button)

- Opens settings screen (timer pauses)

---

## 6. Scoring & Progress

### Coins
- Start with level-defined `coins` value
- +5 per correct placement
- Displayed in top bar during play

### Score (result)
- Based on time remaining, coins, and level index (`runScore()`)
- High score saved to `localStorage`

### Unlock
- Levels unlock sequentially (`highestCleared + 1`)
- Level select shows lock icon on unavailable levels

---

## 7. Audio

- Tap sound via Web Audio API (`playTapSound()`)
- Toggle in Settings → persisted as `mathCrosswordSound`
- No background music in v1.0.1

---

## 8. File Map (runtime)

| File | Role |
|------|------|
| `index.html` | Loads canvas + game.js |
| `game.js` | State, levels, draw, input, loop |
| `styles.css` | Full-viewport phone frame |
| `assets/home/*.png` | Home screen graphics |
| `assets/ui/*.png` | In-game and result graphics |

---

## 9. Version History

| Version | Changes |
|---------|---------|
| 1.0.1 | Image-based dock, hint system, top bar layout, handcrafted L3–20, asset cleanup, dynamic grid sizing |

---

## 10. Glossary

| Term | Meaning |
|------|---------|
| Blank cell | Cell with `answer` property — player must fill |
| Option tray | Shuffled number choices at bottom of play screen |
| Dock | Bottom button bar (Settings / Hint / Help) |
| Handcrafted level | Puzzle defined in `HANDCRAFTED_LEVELS` object |
