// Replace the game loop related variables and functions
let lastTime = 0;
let dropCounter = 0;

// Game loop using requestAnimationFrame
function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!isPaused) {
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            moveTetrominoDown();
            dropCounter = 0;
        }
        
        clearCanvas();
        drawGameGrid();
        drawGhostPiece();
        drawTetromino();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game loop
function startGameLoop() {
    lastTime = 0;
    dropCounter = 0;
    requestAnimationFrame(gameLoop);
}

// Remove the existing interval-based game loop
// No need for clearInterval(gameLoopInterval); anymore