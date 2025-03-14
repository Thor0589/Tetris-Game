// Import sound system
import { playSound, startMusic, toggleSound, toggleMusic, soundEnabled, musicEnabled } from './sounds.js';

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceContext = nextPieceCanvas.getContext('2d');
const holdPieceCanvas = document.getElementById('hold-piece');
const holdPieceContext = holdPieceCanvas.getContext('2d');
const BLOCK_SIZE = 30;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const COLORS = [
    null,
    '#FF0D72', // I - Pink
    '#0DC2FF', // J - Light Blue
    '#0DFF72', // L - Light Green
    '#F538FF', // O - Purple
    '#FF8E0D', // S - Orange
    '#FFE138', // T - Yellow
    '#3877FF'  // Z - Blue
];

// Add piece effects
const EFFECTS = {
    glow: true,
    particles: true
};

// Particle system
const particles = [];

function createClearLineEffect(y) {
    if (!EFFECTS.particles) return;
    
    const blockSize = BLOCK_SIZE;
    for (let i = 0; i < BOARD_WIDTH; i++) {
        // Create particles at each block position in the cleared line
        for (let p = 0; p < 3; p++) {
            particles.push({
                x: i * blockSize + blockSize / 2,
                y: y * blockSize + blockSize / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                radius: Math.random() * 3 + 1,
                color: `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`,
                life: 60
            });
        }
    }
}

// Tetromino shapes
const PIECES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]], // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]  // Z
];

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let highScore = localStorage.getItem('tetris-high-score') || 0;
let level = 1;
let linesCleared = 0;
let paused = false;
let gameActive = true;
let canHold = true; // Flag to prevent multiple holds in a row

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    nextPiece: null,
    holdPiece: null,
    score: 0
};

const arena = createMatrix(BOARD_WIDTH, BOARD_HEIGHT);

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        canHold = true; // Reset hold ability after piece is placed
        
        // Play drop sound
        playSound('drop');
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        // Play move sound
        playSound('move');
    }
}

function getRandomPiece() {
    const pieces = 'IJLOSTZ';
    return PIECES[pieces.indexOf(pieces[Math.floor(Math.random() * pieces.length)])];
}

function drawNextPiece() {
    nextPieceContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (player.nextPiece) {
        // Scale to fit the preview canvas
        const blockSize = 20;
        nextPieceContext.save();
        nextPieceContext.translate(
            nextPieceCanvas.width / 2 - (player.nextPiece[0].length * blockSize) / 2,
            nextPieceCanvas.height / 2 - (player.nextPiece.length * blockSize) / 2
        );
        nextPieceContext.scale(blockSize, blockSize);
        
        player.nextPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    nextPieceContext.fillStyle = COLORS[value];
                    nextPieceContext.fillRect(x, y, 1, 1);
                    nextPieceContext.strokeStyle = '#222';
                    nextPieceContext.lineWidth = 0.05;
                    nextPieceContext.strokeRect(x, y, 1, 1);
                }
            });
        });
        nextPieceContext.restore();
    }
}

function resetGame() {
    // Reset game variables
    arena.forEach(row => row.fill(0));
    player.score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    gameActive = true;
    player.holdPiece = null;
    canHold = true;
    
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Update displays
    updateScore();
    updateLevel();
    updateLines();
    updateHighScore();
    drawHoldPiece();
    
    // Start with new pieces
    player.nextPiece = getRandomPiece();
    playerReset();
    
    // Restart music
    startMusic();
}

function playerReset() {
    // Use next piece if available, otherwise get a random piece
    if (player.nextPiece) {
        player.matrix = player.nextPiece;
    } else {
        player.matrix = getRandomPiece();
    }
    
    // Generate the next piece
    player.nextPiece = getRandomPiece();
    drawNextPiece();
    
    player.pos.y = 0;
    player.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.matrix[0].length / 2);
    
    if (collide(arena, player)) {
        gameActive = false;
        let gameOverMessage = 'Game Over!';
        
        // Play game over sound
        playSound('gameOver');
        
        // Check if player got a high score
        if (player.score > highScore) {
            highScore = player.score;
            localStorage.setItem('tetris-high-score', highScore);
            updateHighScore();
            gameOverMessage = 'NEW HIGH SCORE!<br>' + player.score;
        }
        
        document.getElementById('game-over').innerHTML = gameOverMessage + '<br><span style="font-size: 24px">Press Space to restart</span>';
        document.getElementById('game-over').style.display = 'block';
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    // Play rotate sound
    playSound('rotate');
}

function arenaSweep() {
    let rowCount = 1;
    let linesInThisSweep = 0;
    
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        // Create visual effects before removing the line
        createClearLineEffect(y);
        
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        
        // Increase score based on level and consecutive lines
        player.score += rowCount * 10 * level;
        linesCleared++;
        linesInThisSweep++;
        rowCount *= 2;
        
        // Play clear sound
        playSound('clear');
    }
    
    // Update high score if needed
    if (player.score > highScore) {
        highScore = player.score;
        localStorage.setItem('tetris-high-score', highScore);
        updateHighScore();
    }
    
    // Check if we should level up (every 10 lines)
    if (linesCleared >= level * 10) {
        levelUp();
    }
    
    // Update lines display
    updateLines();
    
    return linesInThisSweep;
}

function levelUp() {
    level++;
    // Increase game speed with each level (min 100ms)
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    updateLevel();
    
    // Play level up sound
    playSound('levelUp');
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

function updateHighScore() {
    document.getElementById('high-score').innerText = highScore;
}

function updateLines() {
    document.getElementById('lines').innerText = linesCleared;
}

function updateLevel() {
    document.getElementById('level').innerText = level;
}

// Draw function moved to line ~637

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = COLORS[value];
                
                // Draw the block
                context.fillStyle = color;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Draw block border
                context.strokeStyle = '#222';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                
                // Add glow effect
                if (EFFECTS.glow) {
                    // Highlight top-left edge for 3D effect
                    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    context.fillRect(x + offset.x, y + offset.y, 0.1, 1);
                    context.fillRect(x + offset.x, y + offset.y, 1, 0.1);
                    
                    // Shadow on bottom-right edge
                    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    context.fillRect(x + offset.x + 0.9, y + offset.y, 0.1, 1);
                    context.fillRect(x + offset.x, y + offset.y + 0.9, 1, 0.1);
                }
            }
        });
    });
}

// Update particles
function updateParticles() {
    if (!EFFECTS.particles) return;
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Apply gravity
        p.vy += 0.1;
        
        // Decrease lifetime
        p.life--;
        
        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        context.fillStyle = p.color;
        context.beginPath();
        context.arc(p.x / BLOCK_SIZE, p.y / BLOCK_SIZE, p.radius / BLOCK_SIZE, 0, Math.PI * 2);
        context.fill();
    }
}

function update(time = 0) {
    if (!paused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
    }
    requestAnimationFrame(update);
}

context.scale(BLOCK_SIZE, BLOCK_SIZE);

document.addEventListener('keydown', event => {
    // Game over screen is showing - check for restart
    if (document.getElementById('game-over').style.display === 'block') {
        if (event.keyCode === 13 || event.keyCode === 32) { // Enter or Space
            resetGame();
            return;
        }
    }
    
    if (event.keyCode === 27) { // Esc key
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('game-over').innerHTML = 'Game Quit!<br><span style="font-size: 24px">Press Space to restart</span>';
        paused = true;
    } else if (event.keyCode === 80) { // P key
        paused = !paused;
        if (paused) {
            document.getElementById('pause-screen').style.display = 'block';
        } else {
            document.getElementById('pause-screen').style.display = 'none';
            lastTime = performance.now();
        }
    }
    
    if (!paused) {
        if (event.keyCode === 37) { // Left arrow
            playerMove(-1);
        } else if (event.keyCode === 39) { // Right arrow
            playerMove(1);
        } else if (event.keyCode === 40) { // Down arrow
            playerDrop();
        } else if (event.keyCode === 38 || event.keyCode === 87) { // Up arrow or W
            playerRotate(1);
        } else if (event.keyCode === 81) { // Q
            playerRotate(-1);
        } else if (event.keyCode === 67 || event.keyCode === 16) { // C key or Shift - Hold piece
            holdPiece();
        } else if (event.keyCode === 32) { // Space - Hard drop
            while (!collide(arena, player)) {
                player.pos.y++;
            }
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
            dropCounter = 0;
        }
    }
});

// Add mobile controls
document.getElementById('mobile-left').addEventListener('click', () => {
    if (!paused) playerMove(-1);
});

document.getElementById('mobile-right').addEventListener('click', () => {
    if (!paused) playerMove(1);
});

document.getElementById('mobile-down').addEventListener('click', () => {
    if (!paused) playerDrop();
});

document.getElementById('mobile-rotate').addEventListener('click', () => {
    if (!paused) playerRotate(1);
});

document.getElementById('mobile-drop').addEventListener('click', () => {
    if (!paused) {
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
    }
});

document.getElementById('mobile-pause').addEventListener('click', () => {
    paused = !paused;
    if (paused) {
        document.getElementById('pause-screen').style.display = 'block';
    } else {
        document.getElementById('pause-screen').style.display = 'none';
        lastTime = performance.now();
    }
});

// Handle touch events for mobile swipe controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', (e) => {
    if (paused || document.getElementById('game-over').style.display === 'block') {
        if (document.getElementById('game-over').style.display === 'block') {
            resetGame();
        } else {
            paused = false;
            document.getElementById('pause-screen').style.display = 'none';
            lastTime = performance.now();
        }
        return;
    }
    
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Detect swipe direction if it's a significant movement
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        // Horizontal swipe is more significant
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                playerMove(1);  // Right swipe
            } else {
                playerMove(-1); // Left swipe
            }
        } 
        // Vertical swipe is more significant
        else {
            if (diffY > 0) {
                playerDrop();  // Down swipe
            } else {
                // Hard drop on up swipe
                while (!collide(arena, player)) {
                    player.pos.y++;
                }
                player.pos.y--;
                merge(arena, player);
                playerReset();
                arenaSweep();
                updateScore();
            }
        }
    } else {
        // Tap to rotate
        playerRotate(1);
    }
}, false);

// Prevent scrolling when touching the canvas
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Add a grid to the game board
function drawGrid() {
    context.strokeStyle = 'rgba(52, 73, 94, 0.3)';
    context.lineWidth = 0.02;
    
    // Draw vertical lines
    for (let i = 0; i <= BOARD_WIDTH; i++) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i, BOARD_HEIGHT);
        context.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
        context.beginPath();
        context.moveTo(0, i);
        context.lineTo(BOARD_WIDTH, i);
        context.stroke();
    }
}

// Add ghost piece (where the current piece will land)
function drawGhostPiece() {
    // Clone player position
    const ghostPos = {
        x: player.pos.x,
        y: player.pos.y
    };
    
    // Find the position where the piece would land
    while (!collide(arena, {matrix: player.matrix, pos: ghostPos})) {
        ghostPos.y++;
    }
    ghostPos.y--; // Move back up one to the valid position
    
    // Draw the ghost piece
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(255, 255, 255, 0.2)';
                context.fillRect(x + ghostPos.x, y + ghostPos.y, 1, 1);
                context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                context.lineWidth = 0.05;
                context.strokeRect(x + ghostPos.x, y + ghostPos.y, 1, 1);
            }
        });
    });
}

// Update the draw function to include grid, ghost piece, and particles
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    if (gameActive && !paused) {
        drawGhostPiece();
    }
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
    
    // Update and draw particles
    updateParticles();
}

// Function to draw the hold piece
function drawHoldPiece() {
    holdPieceContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    holdPieceContext.fillRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);
    
    if (player.holdPiece) {
        // Scale to fit the hold canvas
        const blockSize = 20;
        holdPieceContext.save();
        holdPieceContext.translate(
            holdPieceCanvas.width / 2 - (player.holdPiece[0].length * blockSize) / 2,
            holdPieceCanvas.height / 2 - (player.holdPiece.length * blockSize) / 2
        );
        holdPieceContext.scale(blockSize, blockSize);
        
        player.holdPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    holdPieceContext.fillStyle = COLORS[value];
                    holdPieceContext.fillRect(x, y, 1, 1);
                    holdPieceContext.strokeStyle = '#222';
                    holdPieceContext.lineWidth = 0.05;
                    holdPieceContext.strokeRect(x, y, 1, 1);
                }
            });
        });
        holdPieceContext.restore();
    }
}

// Function to hold the current piece
function holdPiece() {
    if (!canHold || !gameActive) return; // Prevent multiple holds in a row or when game is over
    
    if (player.holdPiece === null) {
        // First hold - store current piece and get a new one
        player.holdPiece = player.matrix;
        playerReset();
    } else {
        // Swap current piece with held piece
        const temp = player.matrix;
        player.matrix = player.holdPiece;
        player.holdPiece = temp;
        
        // Reset position
        player.pos.y = 0;
        player.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Check for collision after swap
        if (collide(arena, player)) {
            // If collision, revert the swap
            player.holdPiece = player.matrix;
            player.matrix = temp;
            return;
        }
    }
    
    // Play hold sound
    playSound('hold');
    
    // Update hold piece display
    drawHoldPiece();
    
    // Prevent holding again until piece is placed
    canHold = false;
}

// Add mobile hold button event listener
document.getElementById('mobile-hold').addEventListener('click', () => {
    if (!paused) holdPiece();
});

// Game initialization function
function initGame() {
    playerReset();
    updateLevel();
    updateLines();
    updateHighScore();
    drawHoldPiece(); // Initialize hold piece display
    
    // Start background music
    startMusic();
    
    // Hide game menu
    document.getElementById('game-menu').style.display = 'none';
    
    // Start game loop
    update();
}

// Menu controls
document.getElementById('start-game').addEventListener('click', () => {
    initGame();
});

document.getElementById('settings-button').addEventListener('click', () => {
    document.getElementById('settings-panel').style.display = 'block';
});

document.getElementById('instructions-button').addEventListener('click', () => {
    document.getElementById('instructions-panel').style.display = 'block';
});

document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-panel').style.display = 'none';
});

document.getElementById('close-instructions').addEventListener('click', () => {
    document.getElementById('instructions-panel').style.display = 'none';
});

// Settings controls
document.getElementById('toggle-sound').addEventListener('click', () => {
    const isEnabled = toggleSound();
    const button = document.getElementById('toggle-sound');
    button.textContent = isEnabled ? 'ON' : 'OFF';
    button.classList.toggle('active', isEnabled);
});

document.getElementById('toggle-music').addEventListener('click', () => {
    const isEnabled = toggleMusic();
    const button = document.getElementById('toggle-music');
    button.textContent = isEnabled ? 'ON' : 'OFF';
    button.classList.toggle('active', isEnabled);
});

document.getElementById('toggle-effects').addEventListener('click', () => {
    EFFECTS.particles = !EFFECTS.particles;
    EFFECTS.glow = !EFFECTS.glow;
    const button = document.getElementById('toggle-effects');
    button.textContent = EFFECTS.particles ? 'ON' : 'OFF';
    button.classList.toggle('active', EFFECTS.particles);
});

// Initialize the game menu
update(); // Start the render loop but game will be paused until player starts