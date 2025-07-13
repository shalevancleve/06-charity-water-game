// Set grid size dynamically for each level
let gridRows = 3;
let gridCols = 3;

// If you want to use a 5x5 grid for the final level, set gridRows = 5; gridCols = 5;
// Example: gridRows = 5; gridCols = 5; // For 5x5 grid

const board = document.getElementById('game-board');
let selectedTile = null;

// Tile map: each key represents a tile type
const TILE_MAP = {
  S: { type: 'start', img: 'assets/water-can-transparent.png', alt: 'Start', classes: 'start unmovable' },
  D: { type: 'destination', img: 'assets/destination-house.png', alt: 'Destination', classes: 'destination unmovable' },
  B: { type: 'stone-block', img: 'assets/stone-block.png', alt: 'Stone Block Obstacle', classes: 'unmovable' },
  E: { type: 'empty', img: 'assets/empty.png', alt: 'Empty Space', classes: '' },
  H: { type: 'h-pipe', img: 'assets/h-pipe.png', alt: 'Horizontal Pipe', classes: 'movable', draggable: true },
  V: { type: 'v-pipe', img: 'assets/v-pipe.png', alt: 'Vertical Pipe', classes: 'movable', draggable: true },
  L: { type: 'l-pipe', img: 'assets/l-pipe.png', alt: 'L Elbow Pipe', classes: 'movable', draggable: true },
  N: { type: 'n-pipe', img: 'assets/n-pipe.png', alt: 'N Elbow Pipe', classes: 'movable', draggable: true },
  R: { type: 'r-pipe', img: 'assets/r-pipe.png', alt: 'R Elbow Pipe', classes: 'movable', draggable: true },
  J: { type: 'j-pipe', img: 'assets/j-pipe.png', alt: 'J Elbow Pipe', classes: 'movable', draggable: true },
  TD: { type: 'td-pipe', img: 'assets/td-pipe.png', alt: 'Downward T Pipe', classes: 'movable', draggable: true },
  TU: { type: 'tu-pipe', img: 'assets/tu-pipe.png', alt: 'Upward T Pipe', classes: 'movable', draggable: true },
  TL: { type: 'tl-pipe', img: 'assets/tl-pipe.png', alt: 'Left T Pipe', classes: 'movable', draggable: true },
  TR: { type: 'tr-pipe', img: 'assets/tr-pipe.png', alt: 'Right T Pipe', classes: 'movable', draggable: true }
};

const preloadedImages = {};

// Preload all tile images and keep them in memory
function preloadTileImages() {
  for (const key in TILE_MAP) {
    const src = TILE_MAP[key].img;
    const img = new window.Image();
    img.src = src;
    preloadedImages[src] = img; // Store the image object

    // Preload the -f (filled) version for pipe tiles
    // Only for pipe types (not start, destination, stone, or empty)
    const pipeTypes = [
      'h-pipe', 'v-pipe', 'l-pipe', 'n-pipe', 'r-pipe', 'j-pipe',
      'td-pipe', 'tu-pipe', 'tl-pipe', 'tr-pipe'
    ];
    if (pipeTypes.includes(TILE_MAP[key].type)) {
      const filledSrc = src.replace('.png', '-f.png');
      if (!preloadedImages[filledSrc]) {
        const filledImg = new window.Image();
        filledImg.src = filledSrc;
        preloadedImages[filledSrc] = filledImg;
      }
    }
  }
}

preloadTileImages();

// Levels: each level is an array of tile keys
const LEVELS = [
  // Level 1 (3x3)
  [
    "S", "H", "N",
    "E", "E", "V",
    "E", "E", "D"
  ],
  // Level 2 (3x3) - example, you can add more
  [
    "S", "N", "E",
    "E", "L", "N",
    "E", "D", "J"
  ],
  // Level 3 (3x3)
  [
    "S", "N", "E",
    "B", "V", "E",
    "E", "L", "D"
  ],
  // Level 4 (3x3)
  [
    "E", "R", "S",
    "E", "TR", "N",
    "D", "TU", "D"
  ],
  // ...add more 3x3 levels here...
  // Challenge Level (5x5)
  [
    "R", "H", "H", "D", "E",
    "V", "B", "R", "H", "N",
    "TR", "H", "S", "B", "D",
    "L", "N", "B", "E", "V",
    "D", "TU", "H", "H", "J"
  ]
];

let currentLevel = 0; // Track the current level

// Store the solved state for the current level
let solvedState = [];

// Check if the current board matches the solved state
function isBoardSolved() {
  // Get the current board's tile keys
  const tiles = Array.from(board.children);
  const currentKeys = tiles.map(tile => {
    // Find the key in TILE_MAP that matches this tile's type
    for (const key in TILE_MAP) {
      if (TILE_MAP[key].type === tile.dataset.type) {
        return key;
      }
    }
    return null;
  });

  // Compare currentKeys to solvedState
  for (let i = 0; i < solvedState.length; i++) {
    if (currentKeys[i] !== solvedState[i]) {
      return false;
    }
  }
  return true;
}

// Timer and stars logic for beginners

let timer = null;           // Holds the setInterval reference
let elapsedSeconds = 0;     // Time for current level
let totalStars = 0;         // Total stars earned across all levels
let levelStars = [];        // Array to store stars earned per level

// Star thresholds (in seconds) for 3, 2, 1 stars per level
// You can adjust these values for each level if you want
const STAR_THRESHOLDS = [
  [10, 20], // Level 1: <=10s = 3 stars, <=20s = 2 stars, else 1
  [10, 20], // Level 2
  [10, 20], // Level 3
  [10, 20], // Level 4
  [60, 90] // Level 5 (5x5)
];

// Helper to generate star HTML for difficulty descriptions
function starRow(count) {
  return `<img src="assets/star-y.png" class="star-inline" alt="Star"> x${count}`;
}

// Difficulty settings with styled HTML descriptions (side-by-side)
const DIFFICULTIES = {
  easy: {
    name: "Easy",
    desc: [
      `<div>
        <b>3x3 levels</b><br>
        ${starRow(3)}: ≤30s<br>
        ${starRow(2)}: ≤50s<br>
        ${starRow(1)}: &gt;50s
      </div>`,
      `<div>
        <b>5x5 level</b><br>
        ${starRow(3)}: ≤120s<br>
        ${starRow(2)}: ≤180s<br>
        ${starRow(1)}: &gt;180s
      </div>`
    ],
    thresholds: [
      [30, 50], [30, 50], [30, 50], [30, 50], [120, 180]
    ]
  },
  medium: {
    name: "Medium",
    desc: [
      `<div>
        <b>3x3 levels</b><br>
        ${starRow(3)}: ≤20s<br>
        ${starRow(2)}: ≤35s<br>
        ${starRow(1)}: &gt;35s
      </div>`,
      `<div>
        <b>5x5 level</b><br>
        ${starRow(3)}: ≤90s<br>
        ${starRow(2)}: ≤120s<br>
        ${starRow(1)}: &gt;120s
      </div>`
    ],
    thresholds: [
      [20, 35], [20, 35], [20, 35], [20, 35], [90, 120]
    ]
  },
  hard: {
    name: "Hard",
    desc: [
      `<div>
        <b>3x3 levels</b><br>
        ${starRow(3)}: ≤10s<br>
        ${starRow(2)}: ≤20s<br>
        ${starRow(1)}: &gt;20s
      </div>`,
      `<div>
        <b>5x5 level</b><br>
        ${starRow(3)}: ≤60s<br>
        ${starRow(2)}: ≤90s<br>
        ${starRow(1)}: &gt;90s
      </div>`
    ],
    thresholds: [
      [10, 20], [10, 20], [10, 20], [10, 20], [60, 90]
    ]
  }
};

// Current difficulty (default to medium)
let currentDifficulty = DIFFICULTIES.medium;

// Show the difficulty overlay
function showDifficultyOverlay() {
  const overlay = document.getElementById('difficulty-overlay');
  if (overlay) overlay.style.display = 'flex';
}

// Hide the difficulty overlay
function hideDifficultyOverlay() {
  const overlay = document.getElementById('difficulty-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Set star thresholds based on selected difficulty
function setDifficulty(diffKey) {
  currentDifficulty = DIFFICULTIES[diffKey] || DIFFICULTIES.medium;
  // Update the global STAR_THRESHOLDS array
  for (let i = 0; i < currentDifficulty.thresholds.length; i++) {
    STAR_THRESHOLDS[i] = currentDifficulty.thresholds[i];
  }
}

// Helper to update the timer display
function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = `Time: ${elapsedSeconds}s`;
  }
}

// Start the timer for a level
function startTimer() {
  stopTimer(); // Make sure no previous timer is running
  elapsedSeconds = 0;
  updateTimerDisplay();
  timer = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

// Stop the timer
function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Reset the 3-star row to all gray
function resetLevelStarsDisplay() {
  const starImgs = document.querySelectorAll('#level-stars .star-icon');
  starImgs.forEach(img => {
    img.src = 'assets/star-g.png';
  });
}

// Update the 3-star row based on stars earned
function updateLevelStarsDisplay(stars) {
  const starImgs = document.querySelectorAll('#level-stars .star-icon');
  for (let i = 0; i < 3; i++) {
    starImgs[i].src = i < stars ? 'assets/star-y.png' : 'assets/star-g.png';
  }
}

// Update the total stars display at the bottom
function updateTotalStarsDisplay() {
  const totalStarsCount = document.getElementById('total-stars-count');
  if (totalStarsCount) {
    totalStarsCount.textContent = `x${totalStars}`;
  }
}

// Calculate stars earned for a level based on elapsedSeconds
function calculateStars(levelIndex, seconds) {
  const [threeStar, twoStar] = STAR_THRESHOLDS[levelIndex] || [30, 60];
  if (seconds <= threeStar) return 3;
  if (seconds <= twoStar) return 2;
  return 1;
}

// This function checks if the board is solved and enables the next level button
function checkForWin() {
  if (isBoardSolved()) {
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
      if (currentLevel < LEVELS.length - 1) {
        nextLevelBtn.disabled = false;
      } else {
        nextLevelBtn.disabled = true; // Stay grayed out on last level
        showConfetti(); // Show confetti on final win!
      }
    }
    
    // Block further input after solving the puzzle
    isSolved = true;

    // --- Begin: Show water-filled pipes and popout animation ---
    const tiles = Array.from(board.children);
    tiles.forEach(tile => {
      // Only update pipe tiles (not start, destination, stone, or empty)
      const type = tile.dataset.type;
      // List of pipe types that have a -f image
      const pipeTypes = [
        'h-pipe', 'v-pipe', 'l-pipe', 'n-pipe', 'r-pipe', 'j-pipe',
        'td-pipe', 'tu-pipe', 'tl-pipe', 'tr-pipe'
      ];
      if (pipeTypes.includes(type)) {
        const img = tile.querySelector('img');
        // Change image src to the -f (filled) version
        // Example: assets/r-pipe.png -> assets/r-pipe-f.png
        if (img && !img.src.includes('-f.png')) {
          img.src = img.src.replace('.png', '-f.png');
        }
        // Add popping class for popout animation
        tile.classList.add('popping');
      }
    });
    // Remove popping class after short delay so tiles return to normal
    setTimeout(() => {
      tiles.forEach(tile => {
        tile.classList.remove('popping');
      });
    }, 180);
    // --- End: Show water-filled pipes and popout animation ---

    // --- BEGIN: Timer and stars logic ---
    stopTimer(); // Stop the timer when level is solved

    // Calculate stars for this level
    const stars = calculateStars(currentLevel, elapsedSeconds);

    // Store and update stars for this level
    levelStars[currentLevel] = Math.max(levelStars[currentLevel] || 0, stars);

    // Recalculate total stars
    totalStars = levelStars.reduce((sum, s) => sum + (s || 0), 0);

    updateLevelStarsDisplay(stars);
    updateTotalStarsDisplay();
    // --- END: Timer and stars logic ---

    // You can add more win effects here (like a message or animation)
  }
}

// Helper function to shuffle an array (Fisher-Yates shuffle)
// This function makes a copy of the array, so the original is NOT changed.
function shuffleArray(array) {
  // Make a shallow copy so the original levelKeys is not modified
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap arr[i] and arr[j]
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

function scrambleLevelByMoves(levelKeys, rows, cols, moves = 300, minOutOfPlace = 0.6) {
  // minOutOfPlace: percent of movable tiles that must be out of place (0.6 = 60%)
  const solved = levelKeys.slice();
  let board = levelKeys.slice();
  const movableIndexes = [];
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    if (!["S", "B", "D"].includes(tile)) {
      movableIndexes.push(i);
    }
  }

  let attempts = 0;
  let maxAttempts = 20; // avoid infinite loops

  while (attempts < maxAttempts) {
    // Track which movable tiles have moved
    const moved = new Set();

    board = solved.slice(); // start from solved state

    let lastMove = null;

    for (let m = 0; m < moves; m++) {
      // Find all empty tile indexes
      const emptyIndexes = [];
      for (let i = 0; i < board.length; i++) {
        if (board[i] === "E") emptyIndexes.push(i);
      }

      const possibleSwaps = [];

      for (const emptyIdx of emptyIndexes) {
        // Get adjacent indexes
        const row = Math.floor(emptyIdx / cols);
        const col = emptyIdx % cols;
        const adj = [];
        if (row > 0) adj.push(emptyIdx - cols);
        if (row < rows - 1) adj.push(emptyIdx + cols);
        if (col > 0) adj.push(emptyIdx - 1);
        if (col < cols - 1) adj.push(emptyIdx + 1);

        for (const adjIdx of adj) {
          const tile = board[adjIdx];
          if (["S", "B", "D"].includes(tile)) continue; // skip unmovable
          const moveKey = `${adjIdx}-${emptyIdx}`;
          if (moveKey === lastMove) continue; // avoid undoing last move
          possibleSwaps.push({ from: adjIdx, to: emptyIdx, key: moveKey });
        }
      }

      if (possibleSwaps.length === 0) break;

      // Prioritize swaps with tiles that haven't moved yet
      let prioritized = possibleSwaps.filter(swap => !moved.has(swap.from));
      let swap;
      if (prioritized.length > 0) {
        swap = prioritized[Math.floor(Math.random() * prioritized.length)];
      } else {
        swap = possibleSwaps[Math.floor(Math.random() * possibleSwaps.length)];
      }

      // Execute the move
      [board[swap.from], board[swap.to]] = [board[swap.to], board[swap.from]];
      lastMove = `${swap.to}-${swap.from}`;
      moved.add(swap.from);
    }

    // After shuffling, check how many movable tiles are out of place
    let outOfPlace = 0;
    for (const idx of movableIndexes) {
      if (board[idx] !== solved[idx]) {
        outOfPlace++;
      }
    }
    const percentOut = outOfPlace / movableIndexes.length;

    // Make sure board is not solved and enough tiles are out of place
    let isSolved = true;
    for (let i = 0; i < board.length; i++) {
      if (board[i] !== solved[i]) {
        isSolved = false;
        break;
      }
    }

    if (!isSolved && percentOut >= minOutOfPlace) {
      // Good shuffle
      return board;
    }

    attempts++;
  }

  // If we can't get a good shuffle after maxAttempts, just return the last board
  return board;
}

// Set grid size and create grid for a level
function loadLevel(levelIndex) {
  currentLevel = levelIndex;
  const levelKeys = LEVELS[levelIndex];
  solvedState = levelKeys.slice();
  if (levelKeys.length === 25) {
    gridRows = 5;
    gridCols = 5;
  } else {
    gridRows = 3;
    gridCols = 3;
  }
  // Use improved scrambler with out-of-place requirement
  const scrambleMoves = (gridRows === 5 && gridCols === 5) ? 100 : 30;
  const scrambledKeys = scrambleLevelByMoves(levelKeys, gridRows, gridCols, scrambleMoves, 0.6);
  const tileData = scrambledKeys.map(key => TILE_MAP[key]);
  createGrid(gridRows, gridCols, tileData);

  const nextLevelBtn = document.getElementById('next-level-btn');
  if (nextLevelBtn) {
    nextLevelBtn.disabled = true;
  }
  // Reset solved flag when loading a new level
  isSolved = false;

  // --- BEGIN: Timer and stars logic ---
  resetLevelStarsDisplay();
  startTimer();
  // --- END: Timer and stars logic ---
}

// Get the index of a tile in the grid
function getTileIndex(tile) {
  return Array.from(board.children).indexOf(tile);
}

// Check if two tiles are adjacent in the grid
function areAdjacent(i1, i2) {
  // Calculate row and column for each index using gridCols
  const r1 = Math.floor(i1 / gridCols), c1 = i1 % gridCols;
  const r2 = Math.floor(i2 / gridCols), c2 = i2 % gridCols;
  // Tiles are adjacent if they are next to each other horizontally or vertically
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function highlightAdjacents(index) {
  clearHighlights();
  const tiles = Array.from(board.children);
  tiles.forEach((tile, i) => {
    if (
      areAdjacent(index, i) &&
      tile.dataset.type === 'empty' &&
      !tile.classList.contains('start') &&
      !tile.classList.contains('destination')
    ) {
      tile.classList.add('highlight');
    }
  });
}

function clearHighlights() {
  board.querySelectorAll('.highlight').forEach(t => t.classList.remove('highlight'));
}

let isAnimating = false; // Flag to block user input during animation
let isSolved = false;    // Flag to block input after puzzle is solved

function swapTiles(fromTile, toTile) {
  // Block input during animation
  isAnimating = true;

  fromTile.classList.remove('popping');

  const fromImg = fromTile.querySelector('img');
  const toImg = toTile.querySelector('img');

  const fromRect = fromTile.getBoundingClientRect();
  const toRect = toTile.getBoundingClientRect();
  const deltaX = toRect.left - fromRect.left;
  const deltaY = toRect.top - fromRect.top;

  fromTile.classList.add('animating');
  toTile.classList.add('animating');

  fromTile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  toTile.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

  setTimeout(() => {
    // Swap images and alt text
    const tempSrc = fromImg.src;
    const tempAlt = fromImg.alt;
    fromImg.src = toImg.src;
    fromImg.alt = toImg.alt;
    toImg.src = tempSrc;
    toImg.alt = tempAlt;

    // Swap data-type
    const tempType = fromTile.dataset.type;
    fromTile.dataset.type = toTile.dataset.type;
    toTile.dataset.type = tempType;

    // Update movable class
    fromTile.classList.toggle('movable', fromTile.dataset.type !== 'empty');
    toTile.classList.toggle('movable', toTile.dataset.type !== 'empty');

    // Always remove popping class after swap so popout can be triggered again
    fromTile.classList.remove('popping');
    toTile.classList.remove('popping');

    fromTile.style.transition = 'none';
    toTile.style.transition = 'none';
    fromTile.style.transform = 'none';
    toTile.style.transform = 'none';

    void fromTile.offsetWidth;
    void toTile.offsetWidth;

    fromTile.classList.remove('animating');
    toTile.classList.remove('animating');
    fromTile.style.transition = '';
    toTile.style.transition = '';

    // Remove the inline transform style so .popping can work again
    fromTile.style.removeProperty('transform');
    toTile.style.removeProperty('transform');

    // After swap, check for win
    checkForWin();

    // Re-enable user input after animation
    isAnimating = false;
  }, 300);
}

function clearSelection() {
  if (selectedTile) {
    selectedTile.classList.remove('popping');
    selectedTile = null;
  }
  clearHighlights();
}

// If you want to generate the grid dynamically, you can use a function like this:
// Update createGrid to set the correct board size class
function createGrid(rows, cols, tileData) {
  board.innerHTML = '';

  let tileSize = 102;
  let gap = 5;
  if (rows === 5 && cols === 5) {
    tileSize = 56;
    gap = 5;
  }

  board.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}px)`;
  board.style.gridTemplateRows = `repeat(${rows}, ${tileSize}px)`;
  board.style.width = `${cols * tileSize + (cols - 1) * gap}px`;
  board.style.height = `${rows * tileSize + (rows - 1) * gap}px`;
  board.style.gap = `${gap}px`;
  board.classList.toggle('five-by-five', rows === 5 && cols === 5);

  for (let i = 0; i < rows * cols; i++) {
    const data = tileData[i] || { type: 'empty', img: 'assets/empty.png', alt: 'Empty Space', classes: '' };
    const tile = document.createElement('div');
    tile.className = `tile${data.classes ? ' ' + data.classes : ''}`;
    tile.dataset.type = data.type;
    if (data.draggable) tile.setAttribute('draggable', 'true');
    const img = document.createElement('img');
    // Use the preloaded image's src if available
    img.src = preloadedImages[data.img] ? preloadedImages[data.img].src : data.img;
    img.alt = data.alt;
    tile.appendChild(img);
    board.appendChild(tile);
  }
}

board.addEventListener('click', (e) => {
  // Block interaction if animating or solved
  if (isAnimating || isSolved) return;

  const clickedTile = e.target.closest('.tile');
  if (!clickedTile) return;

  if (clickedTile.classList.contains('highlight') && selectedTile) {
    swapTiles(selectedTile, clickedTile);
    clearSelection();
    return;
  }

  if (clickedTile.classList.contains('movable')) {
    if (selectedTile === clickedTile) {
      clearSelection();
    } else {
      clearSelection();
      selectedTile = clickedTile;
      
      selectedTile.classList.remove('popping');
      void selectedTile.offsetWidth;
      selectedTile.classList.add('popping');

      const index = getTileIndex(selectedTile);
      highlightAdjacents(index);
    }
    return;
  }

  clearSelection();
});

board.addEventListener('touchstart', (e) => {
  // Block interaction if animating or solved
  if (isAnimating || isSolved) return;

  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const tile = target.closest('.tile');
  if (!tile) return;
  tile.click();
  e.preventDefault();
}, { passive: false });

// Hamburger menu and sidebar logic for beginners
const hamburger = document.getElementById('hamburger-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const closeBtn = document.getElementById('sidebar-close'); // Add close button

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.style.display = 'none';
});

// Add close button logic for sidebar (for index.html)
if (closeBtn && sidebar && overlay) {
  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
  });
}

// Hide sidebar if window is resized above 1000px
window.addEventListener('resize', () => {
  if (window.innerWidth > 1000) {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
  }
});

function showConfetti() {
  // Array of bright colors for confetti
  const colors = ['#FFD700', '#FF69B4', '#00CFFF', '#7CFC00', '#FF6347', '#FFB347'];
  const confettiContainer = document.getElementById('confetti-container');
  if (!confettiContainer) return;

  // Remove old confetti if any
  confettiContainer.innerHTML = '';

  // Create more confetti pieces (120 instead of 50)
  for (let i = 0; i < 120; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    // Random horizontal position
    confetti.style.left = `${Math.random() * 100}vw`;
    // Start a bit above the screen
    confetti.style.top = `-${Math.random() * 40}px`;
    // Random rotation
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    // Make some confetti bigger
    const size = 10 + Math.random() * 18; // 10px to 28px
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    // Random animation duration for different falling speeds
    confetti.style.animationDuration = `${2 + Math.random() * 1.8}s`;
    confettiContainer.appendChild(confetti);
  }

  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 3200); // Slightly longer to match slower pieces
}

// On page load, fill the board with empty tiles only
window.addEventListener('DOMContentLoaded', () => {
  // Fill the board with empty tiles (dirt background)
  const emptyTiles = Array(gridRows * gridCols).fill(TILE_MAP.E);
  createGrid(gridRows, gridCols, emptyTiles);

  // Set up menu buttons
  const newGameBtn = document.getElementById('new-game-btn');
  const nextLevelBtn = document.getElementById('next-level-btn');

  // --- BEGIN: Timer and stars logic ---
  resetLevelStarsDisplay();
  updateTotalStarsDisplay();
  updateTimerDisplay();
  // --- END: Timer and stars logic ---

  // --- BEGIN: Difficulty overlay logic ---
  const overlay = document.getElementById('difficulty-overlay');
  const desc = document.getElementById('difficulty-desc');
  const btns = document.querySelectorAll('.difficulty-btn');

  // Helper to show a difficulty's description
  function showDifficultyDesc(diffKey) {
    const d = DIFFICULTIES[diffKey] || DIFFICULTIES.medium;
    desc.innerHTML = d.desc.join('');
  }

  // Helper to clear the description
  function clearDifficultyDesc() {
    desc.innerHTML = '';
  }

  // Helper to clear .active from all buttons
  function clearActiveBtn() {
    btns.forEach(btn => btn.classList.remove('active'));
  }

  // Track which button is "active" for touch users
  let activeDiffBtn = null;

  // Show overlay when New Game is clicked
  if (newGameBtn) {
    newGameBtn.addEventListener('click', (e) => {
      showDifficultyOverlay();
      totalStars = 0;
      levelStars = [];
      updateTotalStarsDisplay();
      clearDifficultyDesc();
      clearActiveBtn();
      activeDiffBtn = null;
    });
  }

  // Show description on hover/focus, clear on mouseleave/blur (desktop)
  btns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      showDifficultyDesc(btn.getAttribute('data-diff'));
      clearActiveBtn();
    });
    btn.addEventListener('focus', () => {
      showDifficultyDesc(btn.getAttribute('data-diff'));
      clearActiveBtn();
    });
    btn.addEventListener('mouseleave', () => {
      clearDifficultyDesc();
    });
    btn.addEventListener('blur', () => {
      clearDifficultyDesc();
    });

    // Touch/mobile: tap once to show desc (and highlight), tap again to select
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevents mouse events after touch
      const diff = btn.getAttribute('data-diff');
      if (activeDiffBtn === btn) {
        // Second tap: select difficulty
        setDifficulty(diff);
        hideDifficultyOverlay();
        totalStars = 0;
        levelStars = [];
        updateTotalStarsDisplay();
        loadLevel(0);
        activeDiffBtn = null;
        clearDifficultyDesc();
        clearActiveBtn();
      } else {
        // First tap: just show description and highlight
        activeDiffBtn = btn;
        showDifficultyDesc(diff);
        clearActiveBtn();
        btn.classList.add('active');
        // Remove desc and highlight if user taps outside buttons
        document.addEventListener('touchstart', function clearOnOutside(touchEvt) {
          if (!btn.contains(touchEvt.target)) {
            activeDiffBtn = null;
            clearDifficultyDesc();
            clearActiveBtn();
            document.removeEventListener('touchstart', clearOnOutside);
          }
        });
      }
    });

    // Desktop: click selects immediately (for accessibility)
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff');
      setDifficulty(diff);
      hideDifficultyOverlay();
      totalStars = 0;
      levelStars = [];
      updateTotalStarsDisplay();
      loadLevel(0);
      clearDifficultyDesc();
      clearActiveBtn();
    });
  });
  // --- END: Difficulty overlay logic ---

  // Optionally, close overlay if user clicks outside modal (not required)
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Optionally hide overlay here
        // hideDifficultyOverlay();
      }
    });
  }

  // Add style for inline star images in difficulty desc and .active button
  const style = document.createElement('style');
  style.textContent = `
    .star-inline {
      width: 22px;
      height: 22px;
      vertical-align: middle;
      margin-right: 2px;
      margin-bottom: 2px;
    }
    #difficulty-desc b {
      color: #198ff0;
      font-weight: 600;
    }
    #difficulty-desc {
      line-height: 1.7;
    }
    .difficulty-btn.active {
      outline: 2px solid #198ff0;
      background: #e6f4ff;
    }
  `;
  document.head.appendChild(style);

  // Next level button logic (not related to difficulty overlay)
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      // Only go to next level if not at last level
      if (currentLevel < LEVELS.length - 1) {
        loadLevel(currentLevel + 1);
      }
    });
    nextLevelBtn.disabled = true; // Always disabled for now
  }
});