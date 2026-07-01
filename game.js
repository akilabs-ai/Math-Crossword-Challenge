const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const CELL = 88;
const TOTAL_LEVELS = 30;
const HINTS_PER_LEVEL = 3;
const uiAssets = {
  back: loadImage("assets/ui/btn_back.png"),
  undo: loadImage("assets/ui/btn_undo.png"),
  dockSettings: loadImage("assets/ui/dock_settings_notext.png"),
  dockHint: loadImage("assets/ui/dock_hint_notext.png"),
  dockHelp: loadImage("assets/ui/dock_help_notext.png"),
  resultConfetti: loadImage("assets/ui/result_confetti.png"),
  resultBadge: loadImage("assets/ui/result_badge.png"),
  resultClearTitle: loadImage("assets/ui/result_clear_title.png"),
  resultTryTitle: loadImage("assets/ui/result_try_title.png"),
  resultNext: loadImage("assets/ui/result_next.png"),
  resultAgain: loadImage("assets/ui/result_again.png"),
  resultShare: loadImage("assets/ui/result_share.png"),
  homeLogo: loadImage("assets/home/logo_math_adventure.png"),
  homeMascot: loadImage("assets/home/mascot_calc.png"),
  homePlay: loadImage("assets/home/btn_play_home.png"),
  homeLevels: loadImage("assets/home/btn_levels.png"),
};

const LEVEL_TITLES = [
  "Number Starter",
  "Plus Pro",
  "Cross Finder",
  "Algebra Master",
  "Multiply Ace",
  "Division Star",
  "Equation Builder",
  "Pattern Hunter",
  "Logic Sprinter",
  "Brain Booster",
  "Math Explorer",
  "Puzzle Wizard",
  "Calc Champion",
  "Number Ninja",
  "Formula Fighter",
  "Quick Thinker",
  "Grid Master",
  "Sum Legend",
  "Prime Hunter",
  "Fraction Hero",
  "Epic Solver",
  "Mega Mind",
  "Ultra Counter",
  "Grand Master",
  "Crossword King",
  "Math Titan",
  "Genius Mode",
  "Legendary Solver",
  "Ultimate Brain",
  "Math Legend",
];

function loadStoredNumber(key, fallback) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
}

function levelTitleFor(index) {
  return LEVEL_TITLES[Math.max(0, Math.min(TOTAL_LEVELS - 1, index))];
}

function levelRankFor(index) {
  if (index < 2) return "Easy";
  if (index < 5) return "Normal";
  if (index < 12) return "Hard";
  return "Epic";
}

function saveProgress() {
  localStorage.setItem("mathCrosswordHighScore", String(state.highScore));
  localStorage.setItem("mathCrosswordHighestCleared", String(state.highestCleared));
  localStorage.setItem("mathCrosswordLevelIndex", String(state.levelIndex));
  localStorage.setItem("mathCrosswordSound", state.soundEnabled ? "1" : "0");
}

let audioCtx;

function ensureAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume?.();
  return audioCtx;
}

function playTone(frequency, start, duration, type = "sine", volume = 0.08) {
  const ctxAudio = ensureAudioContext();
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctxAudio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playTapSound() {
  if (!state.soundEnabled) return;
  try {
    const now = ensureAudioContext().currentTime;
    playTone(660, now, 0.12, "sine", 0.08);
  } catch {
    // Ignore if audio is unavailable.
  }
}

function playWinSound() {
  if (!state.soundEnabled) return;
  try {
    const now = ensureAudioContext().currentTime;
    [523, 659, 784, 1046].forEach((note, index) => {
      playTone(note, now + index * 0.09, 0.18, "triangle", 0.09);
    });
    [1318, 1568, 1760].forEach((note, index) => {
      playTone(note, now + 0.42 + index * 0.06, 0.16, "sine", 0.045);
    });
  } catch {
    // Ignore if audio is unavailable.
  }
}

function playLoseSound() {
  if (!state.soundEnabled) return;
  try {
    const now = ensureAudioContext().currentTime;
    [330, 262, 196].forEach((note, index) => {
      playTone(note, now + index * 0.14, 0.22, "sawtooth", 0.055);
    });
  } catch {
    // Ignore if audio is unavailable.
  }
}

function runScore() {
  return 800 + Object.keys(state.placed).length * 85 + state.coins;
}

const levels = [
  {
    name: "Level 1",
    rank: "Easy",
    coins: 20,
    time: 60,
    cell: 124,
    boardX: 230,
    boardY: 525,
    options: [
      { id: "l1_o1", value: "8" },
      { id: "l1_o2", value: "10" },
    ],
    cells: [
      { c: 0, r: 0, text: "5" },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: "8" },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: "13" },
      { c: 2, r: 0, answer: "8" },
      { c: 2, r: 1, text: "+" },
      { c: 2, r: 2, text: "2" },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, answer: "10" },
    ],
  },
  {
    name: "Level 2",
    rank: "Easy",
    coins: 45,
    time: 60,
    cell: 106,
    boardX: 176,
    boardY: 475,
    options: [
      { id: "l2_o1", value: "6" },
      { id: "l2_o2", value: "12" },
      { id: "l2_o3", value: "6" },
    ],
    cells: [
      { c: 0, r: 0, text: "7" },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: "6" },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: "13" },
      { c: 2, r: 0, answer: "6" },
      { c: 2, r: 1, text: "x" },
      { c: 2, r: 2, text: "2" },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, answer: "12" },
      { c: 2, r: 4, answer: "12" },
      { c: 3, r: 4, text: "+" },
      { c: 4, r: 4, answer: "6" },
      { c: 5, r: 4, text: "=" },
      { c: 6, r: 4, text: "18" },
    ],
  },
  {
    name: "Level 3",
    rank: "Normal",
    coins: 90,
    time: 60,
    cell: 78,
    boardX: 138,
    boardY: 395,
    options: [
      { id: "l3_o1", value: "2" },
      { id: "l3_o2", value: "8" },
      { id: "l3_o3", value: "38" },
      { id: "l3_o4", value: "38" },
    ],
    cells: [
      { c: 0, r: 0, answer: "8" },
      { c: 0, r: 1, text: "+" },
      { c: 0, r: 2, text: "36" },
      { c: 0, r: 3, text: "=" },
      { c: 0, r: 4, text: "44" },
      { c: 1, r: 4, text: "/" },
      { c: 2, r: 4, text: "44" },
      { c: 3, r: 4, text: "=" },
      { c: 4, r: 4, text: "1" },
      { c: 2, r: 0, text: "4" },
      { c: 2, r: 1, text: "x" },
      { c: 2, r: 2, text: "11" },
      { c: 2, r: 3, text: "=" },
      { c: 4, r: 0, text: "16" },
      { c: 5, r: 0, text: "+" },
      { c: 6, r: 0, text: "29" },
      { c: 7, r: 0, text: "=" },
      { c: 8, r: 0, text: "45" },
      { c: 8, r: 1, text: "/" },
      { c: 8, r: 2, text: "15" },
      { c: 8, r: 3, text: "=" },
      { c: 8, r: 4, text: "3" },
      { c: 2, r: 2, text: "11" },
      { c: 3, r: 2, text: "+" },
      { c: 4, r: 2, answer: "2" },
      { c: 5, r: 2, text: "=" },
      { c: 6, r: 2, text: "13" },
      { c: 6, r: 3, text: "+" },
      { c: 6, r: 4, text: "2" },
      { c: 6, r: 5, text: "=" },
      { c: 6, r: 6, text: "15" },
      { c: 4, r: 2, answer: "2" },
      { c: 4, r: 3, text: "/" },
      { c: 4, r: 5, text: "=" },
      { c: 4, r: 6, text: "2" },
      { c: 5, r: 6, text: "x" },
      { c: 6, r: 6, text: "15" },
      { c: 7, r: 6, text: "=" },
      { c: 8, r: 6, text: "30" },
      { c: 6, r: 8, text: "35" },
      { c: 7, r: 8, text: "+" },
      { c: 8, r: 8, text: "8" },
      { c: 9, r: 8, text: "=" },
      { c: 10, r: 8, text: "43" },
      { c: 8, r: 6, text: "30" },
      { c: 8, r: 7, text: "+" },
      { c: 8, r: 8, text: "8" },
      { c: 8, r: 9, text: "=" },
      { c: 8, r: 10, answer: "38" },
      { c: 10, r: 4, text: "5" },
      { c: 10, r: 5, text: "+" },
      { c: 10, r: 6, answer: "38" },
      { c: 10, r: 7, text: "=" },
      { c: 10, r: 8, text: "43" },
      { c: 6, r: 10, text: "46" },
      { c: 7, r: 10, text: "-" },
      { c: 8, r: 10, answer: "38" },
      { c: 9, r: 10, text: "=" },
      { c: 10, r: 10, text: "8" },
    ],
  },
  {
    name: "Level 4",
    rank: "Normal",
    coins: 130,
    time: 60,
    cell: 98,
    boardX: 112,
    boardY: 420,
    options: [
      { id: "l4_o1", value: "9" },
      { id: "l4_o2", value: "7" },
      { id: "l4_o3", value: "5" },
      { id: "l4_o4", value: "20" },
    ],
    cells: [
      { c: 0, r: 0, text: "3" },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: "9" },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: "12" },
      { c: 2, r: 0, answer: "9" },
      { c: 2, r: 1, text: "-" },
      { c: 2, r: 2, answer: "7" },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, text: "2" },
      { c: 2, r: 2, answer: "7" },
      { c: 3, r: 2, text: "+" },
      { c: 4, r: 2, answer: "5" },
      { c: 5, r: 2, text: "=" },
      { c: 6, r: 2, text: "12" },
      { c: 4, r: 2, answer: "5" },
      { c: 4, r: 3, text: "x" },
      { c: 4, r: 4, text: "4" },
      { c: 4, r: 5, text: "=" },
      { c: 4, r: 6, answer: "20" },
    ],
  },
  {
    name: "Level 5",
    rank: "Hard",
    coins: 180,
    time: 60,
    cell: 88,
    boardX: 104,
    boardY: 410,
    options: [
      { id: "l5_o1", value: "14" },
      { id: "l5_o2", value: "7" },
      { id: "l5_o3", value: "21" },
      { id: "l5_o4", value: "4" },
      { id: "l5_o5", value: "25" },
    ],
    cells: [
      { c: 0, r: 0, text: "6" },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: "14" },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: "20" },
      { c: 2, r: 0, answer: "14" },
      { c: 2, r: 1, text: "/" },
      { c: 2, r: 2, text: "2" },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, answer: "7" },
      { c: 2, r: 4, answer: "7" },
      { c: 3, r: 4, text: "x" },
      { c: 4, r: 4, text: "3" },
      { c: 5, r: 4, text: "=" },
      { c: 6, r: 4, answer: "21" },
      { c: 6, r: 4, answer: "21" },
      { c: 6, r: 5, text: "+" },
      { c: 6, r: 6, answer: "4" },
      { c: 6, r: 7, text: "=" },
      { c: 6, r: 8, answer: "25" },
      { c: 4, r: 8, text: "10" },
      { c: 5, r: 8, text: "+" },
      { c: 6, r: 8, answer: "25" },
      { c: 7, r: 8, text: "=" },
      { c: 8, r: 8, text: "35" },
    ],
  },
];

const state = {
  screen: "title",
  levelIndex: Math.min(TOTAL_LEVELS - 1, Math.max(0, loadStoredNumber("mathCrosswordLevelIndex", 0))),
  highestCleared: Math.min(TOTAL_LEVELS - 1, Math.max(-1, loadStoredNumber("mathCrosswordHighestCleared", -1))),
  highScore: loadStoredNumber("mathCrosswordHighScore", 0),
  currentLevel: null,
  lastEasySignature: localStorage.getItem("mathCrosswordLastEasy") || "",
  selectedOption: null,
  placed: {},
  placedOption: {},
  used: new Set(),
  message: "",
  shakeId: null,
  shake: 0,
  coins: 0,
  startedAt: 0,
  finishedIn: 0,
  resultStartedAt: 0,
  pulse: 0,
  showHelpFirst: true,
  returnAfterHelp: "title",
  helpOpenedAt: 0,
  returnAfterSettings: "title",
  settingsOpenedAt: 0,
  soundEnabled: localStorage.getItem("mathCrosswordSound") !== "0",
  hintsLeft: HINTS_PER_LEVEL,
};

const buttons = {};
const optionRects = {};
const blankRects = {};

state.levelIndex = Math.min(state.levelIndex, unlockedLevelLimit());

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function level() {
  return state.currentLevel || levels[state.levelIndex];
}

function answerCount() {
  return uniqueCells(level().cells).filter((cell) => cell.answer).length;
}

function uniqueCells(cells) {
  const byPosition = new Map();
  cells.forEach((cell) => {
    const key = `${cell.c},${cell.r}`;
    const existing = byPosition.get(key);
    if (!existing || cell.answer) byPosition.set(key, cell);
  });
  return [...byPosition.values()];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleAwayFromOriginal(items) {
  if (items.length < 2) return [...items];
  let shuffled = shuffle(items);
  for (let attempt = 0; attempt < 8; attempt++) {
    const sameOrder = shuffled.every((item, index) => item.value === items[index].value);
    if (!sameOrder) return shuffled;
    shuffled = shuffle(items);
  }
  return [items[items.length - 1], ...items.slice(0, -1)];
}

function withShuffledOptions(baseLevel) {
  return {
    ...baseLevel,
    options: shuffleAwayFromOriginal(baseLevel.options).map((item, index) => ({
      ...item,
      id: `${item.id}_r${Date.now()}_${index}`,
    })),
  };
}

function t(c, r, text) {
  return { c, r, text: String(text) };
}
function a(c, r, answer) {
  return { c, r, answer: String(answer) };
}
function opts(prefix, values) {
  return values.map((v, i) => ({ id: `${prefix}_o${i}`, value: String(v) }));
}

const HANDCRAFTED_LEVELS = {
  2: {
    name: "Level 3",
    rank: "Normal",
    coins: 90,
    time: 90,
    cell: 82,
    boardX: 250,
    boardY: 320,
    options: opts("l3", [2, 3, 4, 5, 6]),
    cells: [
      t(0, 0, "8"), t(1, 0, "+"), t(2, 0, "5"), t(3, 0, "="), t(4, 0, "13"),
      t(0, 1, "÷"),
      t(0, 2, "-"), t(4, 2, "="),
      t(0, 3, "7"), t(1, 3, "+"), a(2, 3, "3"), t(3, 3, "="), t(4, 3, "10"),
      t(0, 4, "×"), t(2, 4, "-"),
      t(0, 5, "+"), t(2, 5, "="),
      t(0, 6, "18"), t(1, 6, "-"), t(2, 6, "6"), t(3, 6, "="), t(4, 6, "12"),
    ],
  },
  3: {
    name: "Level 4",
    rank: "Normal",
    coins: 130,
    time: 100,
    cell: 62,
    boardX: 150,
    boardY: 300,
    options: opts("l4", [2, 8, 38, 38]),
    cells: [
      t(1, 0, "4"), t(3, 0, "16"), t(4, 0, "+"), t(5, 0, "29"), t(6, 0, "="), t(7, 0, "45"),
      t(0, 1, "+"), t(1, 1, "×"), t(7, 1, "/"),
      t(0, 2, "36"), t(1, 2, "11"), t(2, 2, "+"), a(3, 2, "8"), t(4, 2, "="), t(5, 2, "13"), t(7, 2, "15"),
      t(0, 3, "="), t(1, 3, "="), t(3, 3, "/"), t(5, 3, "+"), t(7, 3, "="),
      t(0, 4, "44"), t(1, 4, "/"), t(2, 4, "44"), t(3, 4, "1"), t(5, 4, "2"), t(6, 4, "+"), t(7, 4, "3"), t(8, 4, "="), t(9, 4, "5"),
      t(3, 5, "="), t(7, 5, "="),
      t(3, 6, "2"), t(4, 6, "×"), t(5, 6, "15"), t(6, 6, "="), t(7, 6, "30"),
      t(7, 7, "+"),
      t(5, 8, "35"), t(6, 8, "+"), t(7, 8, "8"), t(8, 8, "="), t(9, 8, "43"),
      t(7, 9, "="),
      t(5, 10, "46"), t(6, 10, "-"), a(7, 10, "38"), t(8, 10, "="), t(9, 10, "8"),
    ],
  },
  4: {
    name: "Level 5",
    rank: "Normal",
    coins: 170,
    time: 100,
    cell: 66,
    boardX: 150,
    boardY: 300,
    options: opts("l5", [3, 4, 6, 7, 9]),
    cells: [
      t(1, 0, "9"), t(2, 0, "+"), t(3, 0, "16"), t(4, 0, "="), t(5, 0, "25"),
      t(1, 1, "×"), t(5, 1, "-"),
      a(0, 2, "9"), t(1, 2, "7"), t(2, 2, "+"), a(3, 2, "8"), t(4, 2, "15"), t(5, 2, "6"),
      t(1, 3, "+"), t(3, 3, "/"),
      t(1, 4, "18"),
      t(0, 5, "27"), t(1, 5, "/"), t(2, 5, "3"), t(3, 5, "="), t(4, 5, "9"), t(5, 5, "12"),
      t(3, 6, "="), t(5, 6, "+"),
      t(3, 7, "×"), t(4, 7, "×"), a(5, 7, "4"), t(6, 7, "="),
      t(3, 8, "="),
      t(1, 9, "40"), t(2, 9, "-"), t(3, 9, "17"), t(4, 9, "="), t(5, 9, "23"),
    ],
  },
  5: {
    name: "Level 6",
    rank: "Hard",
    coins: 210,
    time: 110,
    cell: 70,
    boardX: 150,
    boardY: 320,
    options: opts("l6", [2, 3, 4, 6, 7]),
    cells: [
      t(1, 0, "12"), t(2, 0, "+"), t(3, 0, "17"), t(4, 0, "="), t(5, 0, "29"),
      t(1, 1, "÷"), t(5, 1, "/"),
      t(1, 2, "×"), t(5, 2, "7"),
      t(0, 3, "8"), t(1, 3, "×"), a(2, 3, "3"), t(3, 3, "="), t(4, 3, "24"),
      t(1, 4, "="),
      t(0, 5, "2"), t(1, 5, "5"), t(2, 5, "="), t(3, 5, "7"),
      t(1, 6, "-"), t(3, 6, "+"),
      t(1, 7, "6"), t(2, 7, "×"), t(3, 7, "6"), t(4, 7, "="), t(5, 7, "36"),
      t(3, 8, "="),
      t(0, 9, "52"), t(1, 9, "-"), a(2, 9, "6"), t(3, 9, "="), t(4, 9, "20"),
    ],
  },
  6: {
    name: "Level 7",
    rank: "Hard",
    coins: 250,
    time: 110,
    cell: 74,
    boardX: 170,
    boardY: 340,
    options: opts("l7", [3, 3, 6, 8, 65]),
    cells: [
      t(0, 0, "14"), t(1, 0, "+"), t(2, 0, "26"), t(3, 0, "="), t(4, 0, "40"),
      t(0, 1, "/"),
      t(0, 2, "5"), t(1, 2, "×"), a(2, 2, "6"), t(3, 2, "="), t(4, 2, "30"),
      t(0, 3, "-"), t(4, 3, "="),
      t(0, 4, "9"), t(1, 4, "+"), t(2, 4, "8"), t(3, 4, "="), t(4, 4, "17"),
      t(2, 5, "="),
      t(2, 6, "3"), t(3, 6, "×"), t(4, 6, "3"), t(5, 6, "="), t(6, 6, "9"),
      t(2, 7, "="),
      t(0, 8, "65"), t(1, 8, "-"), a(2, 8, "36"), t(3, 8, "="), t(4, 8, "29"),
    ],
  },
  7: {
    name: "Level 8",
    rank: "Hard",
    coins: 290,
    time: 120,
    cell: 66,
    boardX: 150,
    boardY: 320,
    options: opts("l8", [2, 4, 7, 14, 25]),
    cells: [
      t(1, 0, "21"), t(2, 0, "+"), t(3, 0, "34"), t(4, 0, "="), t(5, 0, "55"),
      t(1, 1, "×"),
      t(1, 2, "12"), t(2, 2, "+"), a(3, 2, "7"), t(4, 2, "="), t(5, 2, "19"),
      t(1, 3, "+"), t(5, 3, "-"),
      t(1, 4, "="),
      t(0, 5, "28"), t(1, 5, "/"), a(2, 5, "2"), t(3, 5, "="), t(4, 5, "14"),
      t(1, 6, "="),
      t(2, 7, "4"), t(3, 7, "×"), t(4, 7, "7"), t(5, 7, "="), t(6, 7, "28"),
      t(4, 8, "="),
      t(1, 9, "60"), t(2, 9, "-"), t(3, 9, "25"), t(4, 9, "="), t(5, 9, "35"),
    ],
  },
  8: {
    name: "Level 9",
    rank: "Hard",
    coins: 330,
    time: 120,
    cell: 70,
    boardX: 160,
    boardY: 320,
    options: opts("l9", [3, 8, 9, 24, 49]),
    cells: [
      t(0, 0, "23"), t(1, 0, "+"), t(2, 0, "19"), t(3, 0, "="), t(4, 0, "42"),
      t(0, 1, "×"),
      t(0, 2, "7"), t(1, 2, "×"), a(2, 2, "7"), t(3, 2, "="), t(4, 2, "49"),
      t(0, 3, "-"), t(4, 3, "="),
      t(0, 4, "16"), t(1, 4, "+"), t(2, 4, "9"), t(3, 4, "="), t(4, 4, "25"),
      t(0, 5, "="),
      t(2, 6, "3"), t(3, 6, "×"), t(4, 6, "8"), t(5, 6, "="), t(6, 6, "24"),
      t(2, 7, "="),
      t(0, 8, "81"), t(1, 8, "-"), a(2, 8, "34"), t(3, 8, "="), t(4, 8, "47"),
    ],
  },
  9: {
    name: "Level 10",
    rank: "Epic",
    coins: 380,
    time: 130,
    cell: 66,
    boardX: 150,
    boardY: 320,
    options: opts("l10", [4, 7, 9, 15, 27]),
    cells: [
      t(1, 0, "15"), t(2, 0, "+"), t(3, 0, "25"), t(4, 0, "="), t(5, 0, "40"),
      t(1, 1, "/"),
      t(1, 2, "9"), t(2, 2, "×"), a(3, 2, "3"), t(4, 2, "="), t(5, 2, "27"),
      t(1, 3, "+"), t(5, 3, "="),
      t(0, 4, "36"), t(1, 4, "/"), a(2, 4, "9"), t(3, 4, "4"), t(4, 4, "="), t(5, 4, "9"),
      t(1, 5, "="), t(5, 5, "="),
      t(1, 6, "8"), t(2, 6, "+"), t(3, 6, "7"), t(4, 6, "="), t(5, 6, "15"),
      t(5, 7, "="),
      t(1, 8, "90"), t(2, 8, "-"), t(3, 8, "33"), t(4, 8, "="), t(5, 8, "57"),
    ],
  },
  10: {
    name: "Level 11",
    rank: "Hard",
    coins: 420,
    time: 130,
    cell: 70,
    boardX: 200,
    boardY: 320,
    options: opts("l11", [6, 4, 12, 14, 19]),
    cells: [
      t(0, 0, "18"), t(1, 0, "+"), t(2, 0, "25"), t(3, 0, "="), t(4, 0, "43"),
      t(0, 1, "×"),
      t(0, 2, "÷"), t(4, 2, "="),
      t(0, 3, "7"), t(1, 3, "+"), a(2, 3, "12"), t(3, 3, "="), t(4, 3, "19"),
      t(0, 4, "×"),
      t(0, 5, "+"), t(4, 5, "="),
      t(0, 6, "32"), t(1, 6, "/"), t(2, 6, "4"), t(3, 6, "="), t(4, 6, "8"),
      t(1, 8, "6"), t(2, 8, "×"), t(3, 8, "6"), t(4, 8, "="), t(5, 8, "36"),
    ],
  },
  11: {
    name: "Level 12",
    rank: "Hard",
    coins: 460,
    time: 130,
    cell: 66,
    boardX: 160,
    boardY: 310,
    options: opts("l12", [3, 5, 6, 7, 8, 9]),
    cells: [
      t(1, 0, "24"), t(2, 0, "+"), t(3, 0, "17"), t(4, 0, "="), t(5, 0, "41"),
      t(1, 1, "-"), t(5, 1, "÷"),
      t(1, 2, "9"), t(2, 2, "×"), a(3, 2, "3"), t(4, 2, "="), t(5, 2, "27"),
      t(1, 3, "+"), t(5, 3, "÷"),
      t(1, 4, "14"), t(2, 4, "-"), a(3, 4, "8"), t(4, 4, "="), t(5, 4, "6"),
      t(5, 5, "="),
      t(1, 7, "8"), t(2, 7, "+"), t(3, 7, "5"), t(4, 7, "="), t(5, 7, "13"),
    ],
  },
  12: {
    name: "Level 13",
    rank: "Epic",
    coins: 500,
    time: 135,
    cell: 70,
    boardX: 200,
    boardY: 320,
    options: opts("l13", [3, 5, 7, 10, 15]),
    cells: [
      t(0, 0, "30"), t(1, 0, "-"), t(2, 0, "12"), t(3, 0, "="), t(4, 0, "18"),
      t(0, 1, "×"), t(4, 1, "÷"),
      t(0, 2, "8"), t(1, 2, "+"), a(2, 2, "7"), t(3, 2, "="), t(4, 2, "15"),
      t(0, 3, "+"), t(4, 3, "-"),
      t(0, 4, "3"), t(1, 4, "×"), a(2, 4, "7"), t(3, 4, "="), t(4, 4, "21"),
      t(0, 5, "="), t(4, 5, "="),
      t(0, 6, "72"), t(1, 6, "/"), t(2, 6, "8"), t(3, 6, "="), t(4, 6, "9"),
    ],
  },
  13: {
    name: "Level 14",
    rank: "Epic",
    coins: 540,
    time: 135,
    cell: 70,
    boardX: 200,
    boardY: 330,
    options: opts("l14", [3, 4, 9, 11, 12, 20]),
    cells: [
      t(0, 0, "15"), t(1, 0, "+"), t(2, 0, "28"), t(3, 0, "="), t(4, 0, "43"),
      t(0, 1, "÷"),
      t(0, 2, "6"), t(1, 2, "×"), a(2, 2, "4"), t(3, 2, "="), t(4, 2, "24"),
      t(0, 3, "-"), t(4, 3, "="),
      t(0, 4, "20"), t(1, 4, "-"), a(2, 4, "9"), t(3, 4, "="), t(4, 4, "11"),
      t(0, 6, "9"), t(1, 6, "+"), t(2, 6, "3"), t(3, 6, "="), t(4, 6, "12"),
    ],
  },
  14: {
    name: "Level 15",
    rank: "Epic",
    coins: 580,
    time: 140,
    cell: 66,
    boardX: 160,
    boardY: 320,
    options: opts("l15", [4, 8, 9, 12, 16, 18]),
    cells: [
      t(0, 0, "27"), t(1, 0, "+"), t(2, 0, "16"), t(3, 0, "="), t(4, 0, "43"),
      t(0, 1, "×"), t(4, 1, "÷"),
      t(0, 2, "9"), t(1, 2, "+"), a(2, 2, "9"), t(3, 2, "="), t(4, 2, "18"),
      t(0, 3, "-"), t(4, 3, "-"),
      t(0, 4, "12"), t(1, 4, "×"), a(2, 4, "4"), t(3, 4, "="), t(4, 4, "48"),
      t(4, 5, "="),
      t(0, 6, "64"), t(1, 6, "/"), t(2, 6, "8"), t(3, 6, "="), t(4, 6, "8"),
    ],
  },
  15: {
    name: "Level 16",
    rank: "Epic",
    coins: 620,
    time: 140,
    cell: 70,
    boardX: 200,
    boardY: 320,
    options: opts("l16", [5, 7, 9, 18, 35]),
    cells: [
      t(0, 0, "42"), t(1, 0, "-"), t(2, 0, "15"), t(3, 0, "="), t(4, 0, "27"),
      t(0, 1, "÷"), t(4, 1, "÷"),
      t(0, 2, "7"), t(1, 2, "×"), a(2, 2, "5"), t(3, 2, "="), t(4, 2, "35"),
      t(0, 3, "+"), t(4, 3, "-"),
      t(0, 4, "18"), t(1, 4, "+"), a(2, 4, "7"), t(3, 4, "="), t(4, 4, "25"),
      t(4, 5, "="),
      t(0, 6, "5"), t(1, 6, "×"), t(2, 6, "9"), t(3, 6, "="), t(4, 6, "45"),
    ],
  },
  16: {
    name: "Level 17",
    rank: "Epic",
    coins: 660,
    time: 145,
    cell: 70,
    boardX: 200,
    boardY: 330,
    options: opts("l17", [5, 6, 7, 8, 9, 17]),
    cells: [
      t(0, 0, "36"), t(1, 0, "+"), t(2, 0, "27"), t(3, 0, "="), t(4, 0, "63"),
      t(0, 1, "×"), t(4, 1, "÷"),
      t(0, 2, "8"), t(1, 2, "+"), a(2, 2, "9"), t(3, 2, "="), t(4, 2, "17"),
      t(0, 3, "-"), t(4, 3, "="),
      t(0, 4, "45"), t(1, 4, "/"), a(2, 4, "5"), t(3, 4, "="), t(4, 4, "9"),
      t(4, 5, "="),
      t(0, 6, "7"), t(1, 6, "+"), t(2, 6, "6"), t(3, 6, "="), t(4, 6, "13"),
    ],
  },
  17: {
    name: "Level 18",
    rank: "Epic",
    coins: 700,
    time: 145,
    cell: 70,
    boardX: 200,
    boardY: 320,
    options: opts("l18", [6, 7, 8, 9, 30, 72]),
    cells: [
      t(0, 0, "50"), t(1, 0, "-"), t(2, 0, "18"), t(3, 0, "="), t(4, 0, "32"),
      t(0, 1, "÷"), t(4, 1, "÷"),
      t(0, 2, "9"), t(1, 2, "×"), a(2, 2, "8"), t(3, 2, "="), t(4, 2, "72"),
      t(0, 3, "+"), t(4, 3, "-"),
      t(0, 4, "24"), t(1, 4, "+"), a(2, 4, "6"), t(3, 4, "="), t(4, 4, "30"),
      t(4, 5, "="),
      t(0, 6, "6"), t(1, 6, "×"), t(2, 6, "7"), t(3, 6, "="), t(4, 6, "42"),
    ],
  },
  18: {
    name: "Level 19",
    rank: "Epic",
    coins: 740,
    time: 150,
    cell: 66,
    boardX: 160,
    boardY: 320,
    options: opts("l19", [5, 7, 8, 9, 40]),
    cells: [
      t(0, 0, "21"), t(1, 0, "+"), t(2, 0, "34"), t(3, 0, "="), t(4, 0, "55"),
      t(0, 1, "×"), t(4, 1, "÷"),
      t(0, 2, "5"), t(1, 2, "×"), a(2, 2, "8"), t(3, 2, "="), t(4, 2, "40"),
      t(0, 3, "-"), t(4, 3, "="),
      t(0, 4, "56"), t(1, 4, "/"), a(2, 4, "8"), t(3, 4, "="), t(4, 4, "7"),
      t(0, 6, "8"), t(1, 6, "+"), t(2, 6, "9"), t(3, 6, "="), t(4, 6, "17"),
    ],
  },
  19: {
    name: "Level 20",
    rank: "Epic",
    coins: 800,
    time: 150,
    cell: 70,
    boardX: 200,
    boardY: 320,
    options: opts("l20", [4, 7, 8, 9, 11, 20]),
    cells: [
      t(0, 0, "63"), t(1, 0, "-"), t(2, 0, "28"), t(3, 0, "="), t(4, 0, "35"),
      t(0, 1, "÷"), t(4, 1, "-"),
      t(0, 2, "12"), t(1, 2, "+"), a(2, 2, "8"), t(3, 2, "="), t(4, 2, "20"),
      t(0, 3, "+"), t(4, 3, "×"),
      t(0, 4, "9"), t(1, 4, "×"), a(2, 4, "9"), t(3, 4, "="), t(4, 4, "81"),
      t(4, 5, "="),
      t(0, 6, "11"), t(1, 6, "-"), t(2, 6, "4"), t(3, 6, "="), t(4, 6, "7"),
    ],
  },
};

function buildHandcraftedLevel(index) {
  const base = HANDCRAFTED_LEVELS[index];
  return {
    ...base,
    options: shuffleAwayFromOriginal(
      base.options.map((item) => ({ ...item, id: `${item.id}_${Date.now()}` }))
    ),
  };
}

function buildPlayableLevel(index) {
  if (index === 0) return buildEasyLevelOne();
  if (index === 1) return buildEasyLevelTwo();
  if (HANDCRAFTED_LEVELS[index]) return buildHandcraftedLevel(index);
  return buildGeneratedLevel(index);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildEasyLevelOne() {
  let a;
  let b;
  let extra;
  let sum;
  let vertical;
  let signature;
  do {
    a = randomInt(3, 9);
    b = randomInt(4, 12);
    extra = randomInt(2, 8);
    sum = a + b;
    vertical = b + extra;
    signature = `${a}_${b}_${extra}`;
  } while (signature === state.lastEasySignature || b === vertical || sum > 20 || vertical > 20);
  state.lastEasySignature = signature;
  localStorage.setItem("mathCrosswordLastEasy", signature);

  return {
    name: "Level 1",
    rank: "Easy",
    coins: 20,
    time: 60,
    cell: 112,
    boardX: 260,
    boardY: 525,
    options: shuffleAwayFromOriginal([
      { id: `l1_a_${signature}`, value: String(b) },
      { id: `l1_b_${signature}`, value: String(vertical) },
    ]),
    cells: [
      { c: 0, r: 0, text: String(a) },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: String(b) },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: String(sum) },
      { c: 2, r: 0, answer: String(b) },
      { c: 2, r: 1, text: "+" },
      { c: 2, r: 2, text: String(extra) },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, answer: String(vertical) },
    ],
  };
}

function buildEasyLevelTwo() {
  const a = randomInt(4, 9);
  const b = randomInt(3, 8);
  const double = b * 2;
  let c = randomInt(4, 9);
  if (c === b || c === double) c += 2;
  const total = double + c;
  const signature = `${a}_${b}_${c}_${Date.now()}`;
  return {
    name: "Level 2",
    rank: "Easy",
    coins: 45,
    time: 60,
    cell: 96,
    boardX: 212,
    boardY: 475,
    options: shuffleAwayFromOriginal([
      { id: `l2_a_${signature}`, value: String(b) },
      { id: `l2_b_${signature}`, value: String(double) },
      { id: `l2_c_${signature}`, value: String(c) },
    ]),
    cells: [
      { c: 0, r: 0, text: String(a) },
      { c: 1, r: 0, text: "+" },
      { c: 2, r: 0, answer: String(b) },
      { c: 3, r: 0, text: "=" },
      { c: 4, r: 0, text: String(a + b) },
      { c: 2, r: 0, answer: String(b) },
      { c: 2, r: 1, text: "x" },
      { c: 2, r: 2, text: "2" },
      { c: 2, r: 3, text: "=" },
      { c: 2, r: 4, answer: String(double) },
      { c: 2, r: 4, answer: String(double) },
      { c: 3, r: 4, text: "+" },
      { c: 4, r: 4, answer: String(c) },
      { c: 5, r: 4, text: "=" },
      { c: 6, r: 4, text: String(total) },
    ],
  };
}

function buildGeneratedLevel(index) {
  if (index >= 20) return buildEpicGeneratedLevel(index);

  const displayLevel = index + 1;
  const hard = Math.min(9, Math.floor(index / 3) + 2);
  const a = randomInt(6, 9 + hard);
  const b = randomInt(4, 8 + hard);
  const sum = a + b;
  const mult = randomInt(2, Math.min(5, hard + 1));
  const product = b * mult;
  let c = randomInt(3, Math.min(product - 2, 9 + hard));
  if ([b, product].includes(c)) c += 1;
  const diff = product - c;
  let d = randomInt(2, 8 + Math.floor(hard / 2));
  if ([b, product, c].includes(d)) d += 1;
  const cTotal = c + d;
  const includeFourthBlank = index >= 4;
  const signature = `l${displayLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const options = [
    { id: `${signature}_b`, value: String(b) },
    { id: `${signature}_product`, value: String(product) },
    { id: `${signature}_c`, value: String(c) },
  ];

  const cells = [
    { c: 0, r: 0, text: String(a) },
    { c: 1, r: 0, text: "+" },
    { c: 2, r: 0, answer: String(b) },
    { c: 3, r: 0, text: "=" },
    { c: 4, r: 0, text: String(sum) },
    { c: 2, r: 0, answer: String(b) },
    { c: 2, r: 1, text: "x" },
    { c: 2, r: 2, text: String(mult) },
    { c: 2, r: 3, text: "=" },
    { c: 2, r: 4, answer: String(product) },
    { c: 2, r: 4, answer: String(product) },
    { c: 3, r: 4, text: "-" },
    { c: 4, r: 4, answer: String(c) },
    { c: 5, r: 4, text: "=" },
    { c: 6, r: 4, text: String(diff) },
  ];

  if (includeFourthBlank) {
    options.push({ id: `${signature}_d`, value: String(d) });
    cells.push(
      { c: 4, r: 4, answer: String(c) },
      { c: 4, r: 5, text: "+" },
      { c: 4, r: 6, answer: String(d) },
      { c: 4, r: 7, text: "=" },
      { c: 4, r: 8, text: String(cTotal) }
    );
  }

  return {
    name: `Level ${displayLevel}`,
    rank: index < 5 ? "Normal" : index < 12 ? "Hard" : "Epic",
    coins: 80 + index * 20,
    time: 60,
    cell: includeFourthBlank ? 96 : 110,
    boardX: includeFourthBlank ? 120 : 146,
    boardY: includeFourthBlank ? 395 : 455,
    options: shuffleAwayFromOriginal(options),
    cells,
  };
}

function answerOptionList(signature, values) {
  return shuffleAwayFromOriginal(values.map((value, index) => ({
    id: `${signature}_a${index}`,
    value: String(value),
  })));
}

function buildEpicGeneratedLevel(index) {
  const displayLevel = index + 1;
  const variant = index % 4;
  if (variant === 0) return buildEpicWideCross(index, displayLevel);
  if (variant === 1) return buildEpicZigZag(index, displayLevel);
  if (variant === 2) return buildEpicTower(index, displayLevel);
  return buildEpicCluster(index, displayLevel);
}

function epicBase(displayLevel, signature, cells, answers, cell = 78) {
  return {
    name: `Level ${displayLevel}`,
    rank: "Epic",
    coins: 80 + (displayLevel - 1) * 20,
    time: 60,
    cell,
    boardX: 150,
    boardY: 300,
    options: answerOptionList(signature, answers),
    cells,
  };
}

function buildEpicWideCross(index, displayLevel) {
  const signature = `epic_cross_${displayLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const a1 = randomInt(8, 18);
  const a2 = randomInt(6, 16);
  const sum = a1 + a2;
  const m = randomInt(2, 5);
  const product = a2 * m;
  const sub = randomInt(3, Math.min(18, product - 2));
  const diff = product - sub;
  let add = randomInt(4, 14);
  if ((diff + add) % 2 !== 0) add += 1;
  const total = diff + add;
  const half = total / 2;
  const div = half * 2;
  const bonus = randomInt(2, 9);
  const final = div + bonus;

  return epicBase(displayLevel, signature, [
    t(1, 0, a1), t(2, 0, "+"), a(3, 0, a2), t(4, 0, "="), t(5, 0, sum),
    a(3, 0, a2), t(3, 1, "x"), t(3, 2, m), t(3, 3, "="), a(3, 4, product),
    t(0, 4, product), t(1, 4, "-"), a(2, 4, sub), t(3, 4, "="), a(4, 4, diff),
    a(4, 4, diff), t(4, 5, "+"), a(4, 6, add), t(4, 7, "="), t(4, 8, total),
    t(4, 8, total), t(5, 8, "/"), t(6, 8, "2"), t(7, 8, "="), a(8, 8, half),
    a(8, 8, half), t(8, 7, "x"), t(8, 6, "2"), t(8, 5, "="), a(8, 4, div),
    a(8, 4, div), t(9, 4, "+"), a(10, 4, bonus), t(11, 4, "="), t(12, 4, final),
  ], [a2, product, sub, diff, add, half, div, bonus], 70);
}

function buildEpicZigZag(index, displayLevel) {
  const signature = `epic_zig_${displayLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const b = randomInt(7, 16);
  const c = randomInt(5, 14);
  const sum = b + c;
  const mult = randomInt(2, 4);
  const product = sum * mult;
  const cut = randomInt(6, 20);
  const diff = product - cut;
  const plus = randomInt(4, 13);
  const total = diff + plus;
  const divisor = randomInt(2, 4);
  const quotient = randomInt(6, 18);
  const dividend = quotient * divisor;
  const last = quotient + b;

  return epicBase(displayLevel, signature, [
    t(0, 0, b), t(1, 0, "+"), a(2, 0, c), t(3, 0, "="), a(4, 0, sum),
    a(4, 0, sum), t(4, 1, "x"), a(4, 2, mult), t(4, 3, "="), a(4, 4, product),
    a(4, 4, product), t(3, 4, "-"), a(2, 4, cut), t(1, 4, "="), a(0, 4, diff),
    a(0, 4, diff), t(0, 5, "+"), a(0, 6, plus), t(0, 7, "="), t(0, 8, total),
    t(2, 8, dividend), t(3, 8, "/"), a(4, 8, divisor), t(5, 8, "="), a(6, 8, quotient),
    a(6, 8, quotient), t(6, 7, "+"), t(6, 6, b), t(6, 5, "="), a(6, 4, last),
  ], [c, sum, mult, product, cut, diff, plus, divisor, quotient, last], 78);
}

function buildEpicTower(index, displayLevel) {
  const signature = `epic_tower_${displayLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const a0 = randomInt(10, 22);
  const b0 = randomInt(5, 16);
  const sum = a0 + b0;
  const minus = randomInt(4, 14);
  const diff = sum - minus;
  const mult = randomInt(2, 5);
  const product = diff * mult;
  const div = randomInt(2, 4);
  const quotient = product % div === 0 ? product / div : product + div - (product % div);
  const dividend = quotient * div;
  const plus = randomInt(3, 12);
  const total = quotient + plus;

  return epicBase(displayLevel, signature, [
    t(2, 0, a0), t(3, 0, "+"), a(4, 0, b0), t(5, 0, "="), a(6, 0, sum),
    a(6, 0, sum), t(6, 1, "-"), a(6, 2, minus), t(6, 3, "="), a(6, 4, diff),
    t(0, 4, diff), t(1, 4, "x"), a(2, 4, mult), t(3, 4, "="), a(4, 4, product),
    a(4, 4, product), t(4, 5, "+"), a(4, 6, plus), t(4, 7, "="), t(4, 8, product + plus),
    t(8, 4, dividend), t(9, 4, "/"), a(10, 4, div), t(11, 4, "="), a(12, 4, quotient),
    a(12, 4, quotient), t(12, 5, "+"), a(12, 6, plus), t(12, 7, "="), t(12, 8, total),
    t(6, 8, total), t(7, 8, "-"), a(8, 8, plus), t(9, 8, "="), t(10, 8, quotient),
  ], [b0, sum, minus, diff, mult, product, plus, div, quotient, plus], 70);
}

function buildEpicCluster(index, displayLevel) {
  const signature = `epic_cluster_${displayLevel}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const a0 = randomInt(6, 18);
  const b0 = randomInt(6, 18);
  const sum = a0 + b0;
  const c0 = randomInt(3, 9);
  const product = b0 * c0;
  const d0 = randomInt(4, 16);
  const diff = product - d0;
  const e0 = randomInt(2, 5);
  const quotient = randomInt(5, 15);
  const dividend = quotient * e0;
  const final = diff + quotient;

  return epicBase(displayLevel, signature, [
    t(1, 0, a0), t(2, 0, "+"), a(3, 0, b0), t(4, 0, "="), t(5, 0, sum),
    a(3, 0, b0), t(3, 1, "x"), a(3, 2, c0), t(3, 3, "="), a(3, 4, product),
    t(0, 4, product), t(1, 4, "-"), a(2, 4, d0), t(3, 4, "="), a(4, 4, diff),
    t(6, 2, dividend), t(7, 2, "/"), a(8, 2, e0), t(9, 2, "="), a(10, 2, quotient),
    a(10, 2, quotient), t(10, 3, "+"), a(10, 4, diff), t(10, 5, "="), t(10, 6, final),
    a(4, 4, diff), t(5, 4, "+"), a(6, 4, quotient), t(7, 4, "="), t(8, 4, final),
    t(1, 8, final), t(2, 8, "-"), a(3, 8, quotient), t(4, 8, "="), t(5, 8, diff),
  ], [b0, c0, product, d0, diff, e0, quotient, diff, quotient], 76);
}

function roundRect(x, y, w, h, r, fill, stroke, line = 0) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke && line) {
    ctx.lineWidth = line;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function text(value, x, y, size, color = "#0f315b", align = "center", weight = "900") {
  ctx.font = `${weight} ${size}px Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function clearRects() {
  Object.keys(buttons).forEach((key) => delete buttons[key]);
  Object.keys(optionRects).forEach((key) => delete optionRects[key]);
  Object.keys(blankRects).forEach((key) => delete blankRects[key]);
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#b8c9d4");
  bg.addColorStop(0.48, "#d8e4e9");
  bg.addColorStop(1, "#b5c7d2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 18; i++) {
    const x = ((i * 197 + state.pulse * 18) % (W + 180)) - 90;
    const y = 170 + ((i * 263) % 1420);
    roundRect(x, y, 128, 128, 34, i % 2 ? "#ffffff" : "#92aebc");
  }
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(870, 250, 210, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(185, 1780, 250, 0, Math.PI * 2);
  ctx.fillStyle = "#6f98aa";
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawButton(id, x, y, w, h, label, fill = "#ffffff", color = "#0f315b", size = 44) {
  buttons[id] = { x, y, w, h };
  roundRect(x + 5, y + 10, w, h, 20, "rgba(74, 87, 99, .34)");
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, shade(fill, -18));
  roundRect(x, y, w, h, 20, grad, shade(fill, -34), 3);
  text(label, x + w / 2, y + h / 2 + 2, size, color);
}

function drawTopAssetButton(id, x, y, w, h, asset) {
  buttons[id] = { x, y, w, h };
  drawAsset(asset, x, y, w, h);
}

function shade(hex, amount) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const next = [1, 3, 5].map((i) => {
    const value = Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + amount));
    return value.toString(16).padStart(2, "0");
  });
  return `#${next.join("")}`;
}

function drawTitle() {
  const bob = Math.sin(state.pulse * 2.1) * 10;
  const playPulse = 1 + Math.sin(state.pulse * 3.4) * 0.025;

  drawBackground();
  drawHomeMathMarks();

  const logoY = 108 + bob * 0.35;
  if (uiAssets.homeLogo.complete) {
    drawAsset(uiAssets.homeLogo, 118, logoY, 844, 210);
  } else {
    text("MATH ADVENTURE", W / 2, logoY + 105, 72, "#1e73d8");
  }

  drawHomeStatsPanel(bob);
  drawHomePlayButton(playPulse);
  drawHomeLevelsButton();
  drawHomeStartHint();
}

function drawHomeStatsPanel(bob) {
  const panelX = 132;
  const panelY = 368;
  const panelW = 720;
  const panelH = 286;

  roundRect(panelX + 8, panelY + 14, panelW, panelH, 36, "rgba(52, 72, 88, .22)");
  const glass = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  glass.addColorStop(0, "rgba(255,255,255,.94)");
  glass.addColorStop(1, "rgba(232, 242, 247,.88)");
  roundRect(panelX, panelY, panelW, panelH, 36, glass, "rgba(209, 224, 232, .9)", 4);

  const rank = levelRankFor(state.levelIndex);
  const rankColors = {
    Easy: ["#d8ffd4", "#4cb85a"],
    Normal: ["#d4ebff", "#2f8fd4"],
    Hard: ["#ffe8c4", "#e09020"],
    Epic: ["#f0d4ff", "#9b4fd4"],
  };
  const [rankFill, rankStroke] = rankColors[rank];
  roundRect(panelX + 28, panelY + 30, 118, 42, 14, rankFill, rankStroke, 3);
  text(rank.toUpperCase(), panelX + 87, panelY + 52, 22, "#0f315b", "center", "900");

  text(`HIGH SCORE: ${state.highScore}`, panelX + 168, panelY + 52, 36, "#0f315b", "left", "900");

  const levelNum = state.levelIndex + 1;
  const title = levelTitleFor(state.levelIndex);
  text(`Level ${levelNum}`, panelX + 42, panelY + 138, 46, "#0f315b", "left", "900");
  text(title, panelX + 42, panelY + 188, 30, "#1e4a74", "left", "800");
  text(`${levelNum} / ${TOTAL_LEVELS}`, panelX + 42, panelY + 226, 26, "#5a7a92", "left", "800");

  const progress = Math.min(1, (state.highestCleared + 1) / TOTAL_LEVELS);
  const barX = panelX + 42;
  const barY = panelY + panelH - 34;
  const barW = panelW - 84;
  roundRect(barX, barY, barW, 16, 8, "rgba(30, 115, 216, .14)");
  if (progress > 0) {
    const fill = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
    fill.addColorStop(0, "#5fd0ff");
    fill.addColorStop(1, "#2f9b4f");
    roundRect(barX, barY, Math.max(18, barW * progress), 16, 8, fill);
  }

  if (uiAssets.homeMascot.complete) {
    const mascotSize = 270;
    drawAsset(uiAssets.homeMascot, 730, panelY - 34 + bob * 0.55, mascotSize, mascotSize);
  }
}

function drawHomePlayButton(scale) {
  const w = 720;
  const h = 186;
  const x = (W - w * scale) / 2;
  const y = 900 - (h * (scale - 1)) / 2;
  const drawW = w * scale;
  const drawH = h * scale;

  buttons.play = { x: 180, y: 900, w: 720, h: 186 };
  roundRect(x + 10, y + 16, drawW, drawH, 42, "rgba(52, 72, 88, .28)");
  if (uiAssets.homePlay.complete) {
    ctx.drawImage(uiAssets.homePlay, x, y, drawW, drawH);
  } else {
    drawButton("play", 180, 900, 720, 186, "PLAY", "#fff5b6", "#113862", 68);
  }
}

function drawHomeLevelsButton() {
  const x = 250;
  const y = 1170;
  const w = 580;
  const h = 140;
  buttons.levels = { x, y, w, h };
  roundRect(x + 8, y + 12, w, h, 34, "rgba(52, 72, 88, .22)");
  if (uiAssets.homeLevels.complete) {
    ctx.drawImage(uiAssets.homeLevels, x, y, w, h);
  } else {
    drawButton("levels", x, y, w, h, "LEVELS", "#d8ffd4", "#113862", 52);
  }
}

function drawHomeStartHint() {
  text(`${TOTAL_LEVELS} quick puzzles`, W / 2, 1440, 28, "#5d7588", "center", "800");
}

function drawAsset(asset, x, y, w, h) {
  if (!asset.complete) return;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(asset, x, y, w, h);
  ctx.restore();
}

function drawHomeAssetButton(id, asset, x, y, w, h) {
  buttons[id] = { x, y, w, h };
  drawAsset(asset, x, y, w, h);
}

function drawHomeMathMarks() {
  const marks = [
    ["+", 120, 760, 92, 0.0],
    ["-", 135, 1165, 90, 1.2],
    ["x", 145, 1600, 86, 2.4],
    ["/", 870, 1085, 96, 0.8],
    ["+", 860, 1568, 86, 1.6],
    ["$", 88, 515, 78, 2.0],
    ["x", 896, 735, 80, 1.0],
    ["÷", 940, 1420, 74, 2.8],
    ["+", 72, 1320, 70, 1.4],
  ];
  ctx.save();
  marks.forEach(([mark, x, y, size, phase]) => {
    const drift = Math.sin(state.pulse * 1.6 + phase) * 14;
    ctx.globalAlpha = 0.22 + Math.sin(state.pulse + phase) * 0.08;
    text(mark, x + drift * 0.3, y + drift, size, "#ffffff");
  });
  ctx.restore();
}

function drawMiniBoard(x, y) {
  roundRect(x - 22, y - 22, 748, 375, 24, "rgba(238, 242, 244, .82)");
  const s = 76;
  const sample = [
    ["5", "+", "?", "=", "13"],
    ["", "", "+", "", ""],
    ["", "", "2", "", ""],
    ["", "", "=", "", ""],
    ["", "", "10", "", ""],
  ];
  sample.forEach((row, r) => {
    row.forEach((v, c) => {
      if (!v) return;
      const fill = v === "?" ? "#fff9e8" : isOperator(v) ? "#ffe9a9" : "#cfffcc";
      drawCell(x + c * s + 150, y + r * s, s, v, fill, v === "?");
    });
  });
}

function drawHelp() {
  drawBackground();
  drawButton("closeHelp", 86, 84, 110, 110, "<");
  text("How to Play", W / 2, 145, 62, "#1e73d8");
  drawHelpCard(112, 295, "1", "Pick a number", "Tap a green tile below.");
  drawHelpCard(112, 570, "2", "Fill a blank", "Tap an empty cream box.");
  drawHelpCard(112, 845, "3", "Make it true", "Every line must be correct.");
  drawTutorialExample();
  const action =
    state.returnAfterHelp === "play" || state.returnAfterHelp === "settings" ? "BACK" : "START";
  drawButton("startFromHelp", 150, 1560, 780, 160, action, "#fff5b6", "#113862", 62);
}

function drawSettings() {
  drawBackground();
  drawButton("closeSettings", 86, 84, 110, 110, "<");
  text("SETTINGS", W / 2, 145, 62, "#1e73d8");

  roundRect(112, 320, 856, 180, 28, "rgba(238, 242, 244, .9)");
  text("Sound", 160, 410, 44, "#0f315b", "left", "900");
  text(state.soundEnabled ? "Sound is on" : "Sound is off", 160, 458, 30, "#516577", "left", "700");
  const soundLabel = state.soundEnabled ? "ON" : "OFF";
  const soundFill = state.soundEnabled ? "#d6ffd2" : "#ffd6d6";
  drawButton("toggleSound", 650, 360, 260, 110, soundLabel, soundFill, "#0f315b", 48);

  roundRect(112, 560, 856, 180, 28, "rgba(238, 242, 244, .9)");
  text("How to Play", 160, 650, 44, "#0f315b", "left", "900");
  text("See the game guide", 160, 698, 30, "#516577", "left", "700");
  drawButton("settingsHelp", 650, 600, 260, 110, "VIEW", "#fff5b6", "#113862", 48);

  text("v.1.0.1", W / 2, 1840, 26, "#85909b");
}

function drawLevelSelect() {
  drawBackground();
  drawTopAssetButton("levelsBack", 48, 96, 132, 108, uiAssets.back);
  text("LEVELS", W / 2, 156, 62, "#1e73d8");
  roundRect(86, 285, 908, 1195, 34, "rgba(242, 247, 249, .9)");
  text("Choose a level", W / 2, 348, 34, "#516577");

  const cols = 5;
  const size = 128;
  const gapX = 42;
  const gapY = 46;
  const startX = 142;
  const startY = 430;
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (size + gapX);
    const y = startY + row * (size + gapY);
    const id = `levelPick_${i}`;
    const unlocked = i <= unlockedLevelLimit();
    if (unlocked) buttons[id] = { x, y, w: size, h: size };
    const isCurrent = i === state.levelIndex;
    const fill = !unlocked ? "#d7e0e5" : isCurrent ? "#fff3a5" : "#d6ffd2";
    const stroke = !unlocked ? "#9aa8b3" : isCurrent ? "#f2ad1c" : "#159d5a";
    roundRect(x + 5, y + 9, size, size, 24, "rgba(74, 87, 99, .22)");
    roundRect(x, y, size, size, 24, fill, stroke, isCurrent && unlocked ? 7 : 4);
    if (unlocked) {
      text(String(i + 1), x + size / 2, y + size / 2 + 5, 54, "#0f315b");
    } else {
      text(String(i + 1), x + size / 2, y + 35, 24, "#6d7d89", "center", "900");
      drawLockMark(x + size / 2, y + size / 2 + 12, 50);
    }
  }
}

function unlockedLevelLimit() {
  return Math.max(0, Math.min(TOTAL_LEVELS - 1, state.highestCleared + 1));
}

function drawLockMark(x, y, size) {
  ctx.save();
  ctx.strokeStyle = "#5f7180";
  ctx.fillStyle = "#5f7180";
  ctx.lineWidth = Math.max(4, size * 0.12);
  ctx.beginPath();
  ctx.arc(x, y - size * 0.12, size * 0.28, Math.PI, 0);
  ctx.stroke();
  roundRect(x - size * 0.36, y - size * 0.08, size * 0.72, size * 0.52, 6, "#5f7180");
  ctx.restore();
}

function drawHelpCard(x, y, n, title, body) {
  roundRect(x, y, 856, 210, 26, "rgba(238, 242, 244, .86)");
  roundRect(x + 30, y + 48, 86, 86, 24, "#d6ffd2", "#159d5a", 4);
  text(n, x + 73, y + 92, 48, "#0aa24d");
  text(title, x + 155, y + 70, 42, "#0f315b", "left");
  text(body, x + 155, y + 130, 31, "#516577", "left", "800");
}

function drawTutorialExample() {
  roundRect(170, 1150, 740, 285, 24, "rgba(238, 242, 244, .86)");
  drawCell(260, 1228, 90, "5", "#cfffcc");
  drawCell(350, 1228, 90, "+", "#ffe9a9");
  drawCell(440, 1228, 90, "8", "#fff9e8", true);
  drawCell(530, 1228, 90, "=", "#ffe9a9");
  drawCell(620, 1228, 90, "13", "#cfffcc");
  drawCell(735, 1228, 90, "8", "#d6ffd2");
  text("8 fits here", W / 2, 1375, 35, "#516577");
}

function startLevel() {
  if (state.showHelpFirst) {
    state.returnAfterHelp = "title";
    state.screen = "help";
    return;
  }
  beginLevel();
}

function beginLevel() {
  state.currentLevel = buildPlayableLevel(state.levelIndex);
  state.screen = "play";
  state.selectedOption = null;
  state.placed = {};
  state.placedOption = {};
  state.used = new Set();
  state.message = "Pick a number";
  state.coins = level().coins;
  state.startedAt = performance.now();
  state.finishedIn = 0;
}

function timeLeft() {
  if (state.screen === "result") return state.finishedIn;
  return Math.max(0, level().time - Math.floor((performance.now() - state.startedAt) / 1000));
}

function timeText(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PLAY_GRID_TOP = 380;
const PLAY_PANEL_X = 78;
const PLAY_PANEL_W = 924;
const PLAY_PANEL_H = 880;
const PLAY_CELL_MIN = 74;
const PLAY_CELL_MAX = 104;
const TOP_BAR_Y = 100;
const TOP_BAR_H = 88;
const TOP_BAR_BTN_GAP = 20;

function playGridLayout() {
  const cells = uniqueCells(level().cells);
  let maxC = 0;
  let maxR = 0;
  cells.forEach((item) => {
    maxC = Math.max(maxC, item.c);
    maxR = Math.max(maxR, item.r);
  });

  const colCount = maxC + 1;
  const rowCount = maxR + 1;
  const pad = 16;
  const fitW = (PLAY_PANEL_W - pad * 2) / colCount;
  const fitH = (PLAY_PANEL_H - pad * 2) / rowCount;
  let size = Math.floor(Math.min(fitW, fitH, PLAY_CELL_MAX));
  size = Math.max(PLAY_CELL_MIN, size);

  const width = colCount * size;
  const height = rowCount * size;
  if (width > PLAY_PANEL_W - pad * 2 || height > PLAY_PANEL_H - pad * 2) {
    size = Math.floor(Math.min((PLAY_PANEL_W - pad * 2) / colCount, (PLAY_PANEL_H - pad * 2) / rowCount));
  }

  return {
    step: size,
    size,
    width: colCount * size,
    height: rowCount * size,
    originX: PLAY_PANEL_X + (PLAY_PANEL_W - colCount * size) / 2,
    originY: PLAY_GRID_TOP + (PLAY_PANEL_H - rowCount * size) / 2,
  };
}

function playCellXY(cell) {
  const layout = playGridLayout();
  return {
    x: layout.originX + cell.c * layout.step,
    y: layout.originY + cell.r * layout.step,
    size: layout.size,
  };
}

function drawGame() {
  drawBackground();
  drawTopBar();
  drawBoardPanel();
  drawNumberTray();
  drawPowerUps();
  if (timeLeft() <= 0) finishLevel(false);
}

function drawTopBar() {
  const barY = TOP_BAR_Y;
  const barH = TOP_BAR_H;
  const barMid = barY + barH / 2;
  const btnSize = barH;
  const backX = 48;
  const refreshX = backX + btnSize + TOP_BAR_BTN_GAP;

  const pillH = barH;
  const pillR = pillH / 2;
  const timeW = 172;
  const coinW = 196;
  const pillGap = 14;
  const coinX = W - 48 - coinW;
  const timeX = coinX - pillGap - timeW;

  drawTopAssetButton("back", backX, barY, btnSize, btnSize, uiAssets.back);
  drawTopAssetButton("refresh", refreshX, barY, btnSize, btnSize, uiAssets.undo);
  const titleLeft = refreshX + btnSize + 38;
  const titleRight = timeX - 52;
  text(level().name, (titleLeft + titleRight) / 2, barMid + 3, 42, "#1e73d8", "center", "900");

  drawTopPill(timeX, barY, timeW, pillH, pillR);
  text(timeText(timeLeft()), timeX + timeW / 2, barMid + 2, 36, "#1e73d8", "center", "900");

  drawTopPill(coinX, barY, coinW, pillH, pillR);
  drawCoinIcon(coinX + 40, barMid, 23);
  text(String(state.coins), coinX + coinW / 2 + 16, barMid + 2, 36, "#1e73d8", "center", "900");
}

function drawTopPill(x, y, w, h, r) {
  roundRect(x, y, w, h, r, "rgba(255,255,255,.94)", "#bdd0dc", 3);
}

function drawCoinIcon(x, y, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const coin = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  coin.addColorStop(0, "#ffe98f");
  coin.addColorStop(1, "#f2b92d");
  ctx.fillStyle = coin;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#c98d12";
  ctx.stroke();
  text("$", x, y + 1, radius * 1.1, "#8a5d00");
  ctx.restore();
}

function refreshLevel() {
  playTapSound();
  beginLevel();
}

function drawBoardPanel() {
  roundRect(54 + 8, 250 + 14, 972, 1068, 26, "rgba(69, 82, 93, .20)");
  roundRect(54, 250, 972, 1068, 26, "rgba(242, 247, 249, .88)");
  drawEquationCells();
}

function drawEquationCells() {
  uniqueCells(level().cells).forEach((cell) => {
    const pos = playCellXY(cell);
    const blankId = `${cell.c}_${cell.r}_${cell.answer || ""}`;
    const isBlank = Boolean(cell.answer);
    const placed = state.placed[blankId];
    const shake = state.shakeId === blankId ? state.shake : 0;
    const value = placed || cell.text || "";
    const fill = isBlank && !placed ? "#fffaf0" : isBlank ? "#cfffcc" : isOperator(value) ? "#ffe9a9" : "#cfffcc";
    if (isBlank) blankRects[blankId] = { x: pos.x, y: pos.y, w: pos.size, h: pos.size, answer: cell.answer };
    drawCell(pos.x + shake, pos.y, pos.size, value, fill, isBlank && !placed);
  });
}

function isOperator(value) {
  return ["+", "-", "x", "/", "="].includes(value);
}

function drawCell(x, y, s, value, fill, blank = false) {
  roundRect(x + 3, y + 6, s - 6, s - 6, 6, "rgba(55, 67, 78, .22)");
  if (blank && !value) {
    const pulse = (Math.sin(state.pulse * 5) + 1) / 2;
    roundRect(
      x - 6,
      y - 6,
      s + 12,
      s + 12,
      9,
      `rgba(255, 187, 43, ${0.28 + pulse * 0.22})`
    );
  }
  const grad = ctx.createLinearGradient(0, y, 0, y + s);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, shade(fill, -14));
  const stroke = blank && !value ? "#ff9f1a" : blank ? "#19b861" : "#36a765";
  const line = blank && !value ? 6 : 3;
  roundRect(x, y, s, s, 5, grad, stroke, line);
  if (blank && !value) {
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, Math.max(5, s * 0.08), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 159, 26, .72)";
    ctx.fill();
  }
  if (value) {
    const size =
      value.length > 2 ? Math.floor(s * 0.48) : value.length > 1 ? Math.floor(s * 0.58) : Math.floor(s * 0.72);
    const color = blank ? "#0aa24d" : "#0f315b";
    text(value, x + s / 2, y + s / 2 + 2, size, color);
  }
}

function drawNumberTray() {
  roundRect(54 + 6, 1360 + 12, 972, 156, 24, "rgba(69, 82, 93, .18)");
  roundRect(54, 1360, 972, 156, 24, "rgba(247, 250, 251, .93)");
  const activeOptions = level().options.filter((item) => !state.used.has(item.id));
  activeOptions.forEach((item, i) => {
    const multiRow = activeOptions.length > 6;
    const cols = multiRow ? Math.ceil(activeOptions.length / 2) : activeOptions.length;
    const row = multiRow ? Math.floor(i / cols) : 0;
    const col = multiRow ? i % cols : i;
    const tileW = multiRow ? 96 : activeOptions.length >= 5 ? 112 : 124;
    const tileH = multiRow ? 64 : 102;
    const gap = multiRow ? 18 : activeOptions.length >= 5 ? 14 : 22;
    const total = cols * tileW + Math.max(0, cols - 1) * gap;
    const startX = W / 2 - total / 2;
    const x = startX + col * (tileW + gap);
    const y = multiRow ? 1374 + row * 68 : 1393;
    const selected = state.selectedOption?.id === item.id;
    optionRects[item.id] = { x, y, w: tileW, h: tileH, item };
    roundRect(x + 4, y + 8, tileW, tileH, 10, "rgba(52, 72, 83, .22)");
    roundRect(x, y, tileW, tileH, 10, selected ? "#fff3a5" : "#d6ffd2", selected ? "#f2ad1c" : "#159d5a", selected ? 6 : 4);
    const fontSize = multiRow ? item.value.length > 2 ? 30 : 36 : item.value.length > 2 ? 44 : item.value.length > 1 ? 52 : 62;
    text(item.value, x + tileW / 2, y + tileH / 2 + 3, fontSize, "#0aa24d");
  });
}

function drawPowerUps() {
  const dockY = 1554;
  const dockH = 186;
  const dockX = 54;
  const dockW = 972;
  const btnW = 292;
  const btnH = 156;
  const gap = 34;
  const startX = 72;
  const btnY = dockY + 15;

  roundRect(dockX + 4, dockY + 8, dockW, dockH, 28, "rgba(52, 72, 88, .1)");
  roundRect(dockX, dockY, dockW, dockH, 28, "rgba(255,255,255,.88)", "rgba(255,255,255,.55)", 2);

  drawDockAssetButton("gameSettings", uiAssets.dockSettings, startX, btnY, btnW, btnH);
  const hintX = startX + btnW + gap;
  const hintFit = drawDockAssetButton("gameHint", uiAssets.dockHint, hintX, btnY, btnW, btnH);
  drawDockAssetButton("gameHelp", uiAssets.dockHelp, startX + (btnW + gap) * 2, btnY, btnW, btnH);

  drawHintBadgeOnDock(hintFit, state.hintsLeft);
  if (state.hintsLeft === 0) {
    roundRect(hintX, btnY, btnW, btnH, 22, "rgba(58, 72, 84, .34)");
  }

  text("v.1.0.1", W / 2, 1840, 26, "#85909b");
}

function drawDockAssetButton(id, asset, x, y, w, h) {
  buttons[id] = { x, y, w, h };
  return drawDockImageFitted(asset, x, y, w, h);
}

function drawDockImageFitted(asset, x, y, w, h) {
  if (!asset.complete || !asset.naturalWidth) {
    return { drawX: x, drawY: y, drawW: w, drawH: h };
  }
  const scale = Math.min(w / asset.naturalWidth, h / asset.naturalHeight);
  const drawW = asset.naturalWidth * scale;
  const drawH = asset.naturalHeight * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  drawAsset(asset, drawX, drawY, drawW, drawH);
  return { drawX, drawY, drawW, drawH };
}

function drawHintBadgeOnDock(fit, count) {
  const badgeX = fit.drawX + fit.drawW * 0.905;
  const badgeY = fit.drawY + fit.drawH * 0.125;
  const badgeR = fit.drawH * 0.13;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = "#b8a4de";
  ctx.fill();

  drawHintCountBadge(badgeX, badgeY, count, badgeR);
}

function drawHintCountBadge(x, y, count, radius = 22) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = count > 0 ? "#ffffff" : "#e8edf0";
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius * 0.14);
  ctx.strokeStyle = count > 0 ? "#2d7fd4" : "#9aa8b3";
  ctx.stroke();
  text(String(count), x, y + 1, Math.round(radius * 1.05), count > 0 ? "#2d7fd4" : "#9aa8b3", "center", "900");
}

function useHint() {
  if (state.hintsLeft <= 0) {
    state.message = "No hints left";
    return;
  }
  const blanks = uniqueCells(level().cells).filter((cell) => {
    if (!cell.answer) return false;
    const blankId = `${cell.c}_${cell.r}_${cell.answer}`;
    return !state.placed[blankId];
  });
  if (!blanks.length) {
    state.message = "All filled";
    return;
  }
  const target = blanks[Math.floor(Math.random() * blanks.length)];
  const blankId = `${target.c}_${target.r}_${target.answer}`;
  const option = level().options.find((item) => item.value === target.answer && !state.used.has(item.id));
  if (!option) {
    state.message = "No number left";
    return;
  }
  state.placed[blankId] = option.value;
  state.placedOption[blankId] = option.id;
  state.used.add(option.id);
  if (state.selectedOption?.id === option.id) state.selectedOption = null;
  state.hintsLeft -= 1;
  state.message = "Hint used";
  playTapSound();
  if (Object.keys(state.placed).length === answerCount()) finishLevel(true);
}

function placeSelected(blankId) {
  const blank = blankRects[blankId];
  if (!blank || state.placed[blankId]) return;
  if (!state.selectedOption) {
    state.message = "Pick a number";
    state.shakeId = blankId;
    state.shake = 12;
    return;
  }
  if (state.selectedOption.value === blank.answer) {
    state.placed[blankId] = state.selectedOption.value;
    state.placedOption[blankId] = state.selectedOption.id;
    state.used.add(state.selectedOption.id);
    state.selectedOption = null;
    state.coins += 5;
    playTapSound();
    if (Object.keys(state.placed).length === answerCount()) finishLevel(true);
  } else {
    state.message = "Try another";
    state.shakeId = blankId;
    state.shake = 16;
  }
}

function finishLevel(won) {
  state.screen = "result";
  state.resultStartedAt = performance.now();
  state.finishedIn = Math.floor((performance.now() - state.startedAt) / 1000);
  state.message = won ? "Solved" : "Time up";
  if (won) playWinSound();
  else playLoseSound();
  if (won) {
    const score = runScore();
    if (score > state.highScore) state.highScore = score;
    if (state.levelIndex > state.highestCleared) state.highestCleared = state.levelIndex;
    saveProgress();
  }
}

function drawResult() {
  drawBackground();
  const won = state.message === "Solved";
  if (won) {
    drawResultGlow();
    drawCelebrationConfetti();
  }
  drawAsset(won ? uiAssets.resultClearTitle : uiAssets.resultTryTitle, 130, 172, 820, 210);
  if (won) drawAsset(uiAssets.resultBadge, 390, 360, 300, 300);

  const cardY = won ? 620 : 510;
  roundRect(145, cardY + 14, 790, 460, 38, "rgba(52, 72, 88, .18)");
  roundRect(145, cardY, 790, 460, 38, "rgba(250, 253, 252, .92)", "rgba(255,255,255,.7)", 4);
  text("Smart Score", W / 2, cardY + 128, 44, "#516577");
  text(String(runScore()), W / 2, cardY + 242, 108, won ? "#0f315b" : "#1e4a74");
  text(`${Object.keys(state.placed).length}/${answerCount()} blanks`, W / 2, cardY + 360, 42, "#516577");
  if (won && state.levelIndex < TOTAL_LEVELS - 1) {
    drawResultAssetButton("next", uiAssets.resultNext, 150, 1240, 780, 158);
  } else {
    drawResultAssetButton("again", uiAssets.resultAgain, 150, 1240, 780, 158);
  }
  drawResultAssetButton("share", uiAssets.resultShare, 205, 1455, 670, 136);
}

function drawResultGlow() {
  ctx.save();
  ctx.globalAlpha = 0.42;
  const glow = ctx.createRadialGradient(W / 2, 360, 40, W / 2, 360, 430);
  glow.addColorStop(0, "#fff8a8");
  glow.addColorStop(0.5, "rgba(255, 218, 82, .45)");
  glow.addColorStop(1, "rgba(255, 218, 82, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 860);
  ctx.restore();
}

function drawCelebrationConfetti() {
  const elapsed = Math.max(0, (performance.now() - state.resultStartedAt) / 1000);
  if (uiAssets.resultConfetti.complete) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, elapsed * 0.35);
    ctx.drawImage(uiAssets.resultConfetti, 0, 0, W, H);
    ctx.restore();
  }

  const colors = ["#ff5d5d", "#ffd24a", "#37c871", "#45b7ff", "#9b6dff", "#ff9f2e"];
  for (let i = 0; i < 100; i++) {
    const delay = (i % 16) * 0.035;
    const t = elapsed - delay;
    if (t <= 0 || t > 3.4) continue;

    const spread = -Math.PI + ((i * 2.399) % Math.PI);
    const speed = 280 + (i % 9) * 34;
    const wind = Math.sin(t * 4 + i) * 26;
    const x = W / 2 + Math.cos(spread) * speed * t + wind;
    const y = 470 + Math.sin(spread) * speed * t + 255 * t * t;
    const alpha = Math.max(0, Math.min(1, 1 - (t - 2.3) / 1.1));
    const rotate = t * (2.4 + (i % 5) * 0.35) + i;
    drawConfettiPiece(x, y, 14 + (i % 3) * 5, colors[i % colors.length], alpha, rotate, i % 4);
  }

  for (let i = 0; i < 36; i++) {
    const t = (elapsed + i * 0.13) % 3.2;
    const x = 35 + ((i * 97) % (W - 70)) + Math.sin(elapsed * 2 + i) * 22;
    const y = -40 + t * 600 + ((i * 43) % 120);
    const alpha = y > H ? 0 : 0.65;
    drawConfettiPiece(x, y, 12 + (i % 4) * 4, colors[(i + 2) % colors.length], alpha, elapsed * 3 + i, i % 4);
  }
}

function drawConfettiPiece(x, y, size, color, alpha, rotate, shape) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.fillStyle = color;
  if (shape === 0) {
    ctx.fillRect(-size / 2, -size / 2, size, size * 0.45);
  } else if (shape === 1) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 2) {
    ctx.beginPath();
    for (let p = 0; p < 5; p++) {
      const a = -Math.PI / 2 + (p * Math.PI * 2) / 5;
      const r = p % 2 ? size * 0.34 : size * 0.62;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-size * 0.18, -size * 0.8, size * 0.36, size * 1.6);
  }
  ctx.restore();
}

function drawResultAssetButton(id, asset, x, y, w, h) {
  buttons[id] = { x, y, w, h };
  if (asset.complete) ctx.drawImage(asset, x, y, w, h);
  else drawButton(id, x, y, w, h, id.toUpperCase(), "#fff5b6", "#113862", 50);
}

function hit(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function pointerToCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointerToCanvas(event);
  const button = Object.entries(buttons).find(([, rect]) => hit(rect, point.x, point.y));
  if (button) {
    handleButton(button[0]);
    return;
  }
  const option = Object.entries(optionRects).find(([, rect]) => hit(rect, point.x, point.y));
  if (option) {
    state.selectedOption = option[1].item;
    state.message = "Tap a blank";
    return;
  }
  const blank = Object.entries(blankRects).find(([, rect]) => hit(rect, point.x, point.y));
  if (blank) placeSelected(blank[0]);
});

function handleButton(id) {
  if (id === "play") startLevel();
  if (id === "levels") {
    state.screen = "levels";
  }
  if (id === "help") {
    state.returnAfterHelp = "title";
    state.screen = "help";
  }
  if (id === "helpInGame") {
    state.returnAfterHelp = "play";
    state.helpOpenedAt = performance.now();
    state.screen = "help";
  }
  if (id === "gameSettings") {
    state.returnAfterSettings = state.screen;
    if (state.screen === "play") state.settingsOpenedAt = performance.now();
    state.screen = "settings";
  }
  if (id === "gameHint") useHint();
  if (id === "gameHelp") {
    state.returnAfterHelp = "play";
    state.helpOpenedAt = performance.now();
    state.screen = "help";
  }
  if (id === "closeSettings") closeSettings();
  if (id === "toggleSound") {
    state.soundEnabled = !state.soundEnabled;
    saveProgress();
    if (state.soundEnabled) playTapSound();
  }
  if (id === "settingsHelp") {
    state.returnAfterHelp = "settings";
    state.screen = "help";
  }
  if (id === "closeHelp") closeHelp();
  if (id === "startFromHelp") {
    if (state.returnAfterHelp === "play") closeHelp();
    else if (state.returnAfterHelp === "settings") state.screen = "settings";
    else {
      state.showHelpFirst = false;
      beginLevel();
    }
  }
  if (id === "again") beginLevel();
  if (id === "next") {
    state.levelIndex = Math.min(TOTAL_LEVELS - 1, state.levelIndex + 1);
    saveProgress();
    beginLevel();
  }
  if (id === "back") state.screen = "title";
  if (id === "levelsBack") state.screen = "title";
  if (id.startsWith("levelPick_")) {
    const pickedLevel = Number(id.replace("levelPick_", ""));
    if (pickedLevel > unlockedLevelLimit()) return;
    state.levelIndex = pickedLevel;
    saveProgress();
    state.showHelpFirst = false;
    beginLevel();
  }
  if (id === "refresh") refreshLevel();
  if (id === "share") navigator.clipboard?.writeText("Can you beat my Math Crossword score?");
}

function closeHelp() {
  if (state.returnAfterHelp === "play") {
    state.startedAt += performance.now() - state.helpOpenedAt;
    state.screen = "play";
    return;
  }
  if (state.returnAfterHelp === "settings") {
    state.screen = "settings";
    return;
  }
  state.screen = "title";
}

function closeSettings() {
  if (state.returnAfterSettings === "play") {
    state.startedAt += performance.now() - state.settingsOpenedAt;
    state.screen = "play";
    return;
  }
  state.screen = state.returnAfterSettings || "title";
}

function undoLast() {
  const last = Object.keys(state.placed).pop();
  if (last) {
    state.used.delete(state.placedOption[last]);
    delete state.placed[last];
    delete state.placedOption[last];
  }
  state.message = "Undone";
}

function loop() {
  clearRects();
  state.pulse += 0.02;
  if (state.shake) state.shake *= -0.55;
  if (Math.abs(state.shake) < 1) {
    state.shake = 0;
    state.shakeId = null;
  }
  if (state.screen === "title") drawTitle();
  if (state.screen === "levels") drawLevelSelect();
  if (state.screen === "help") drawHelp();
  if (state.screen === "settings") drawSettings();
  if (state.screen === "play") drawGame();
  if (state.screen === "result") drawResult();
  requestAnimationFrame(loop);
}

loop();
