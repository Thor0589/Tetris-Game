// Add this function to draw the ghost piece
function drawGhostPiece() {
    if (!currentTetromino || isPaused) return;
    
    // Find how far the piece can drop
    let ghostY = 0;
    while (isValidMove(0, ghostY + 1)) {
        ghostY++;
    }
    
    // Draw the ghost piece
    currentTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                ctx.globalAlpha = 0.3; // Make it semi-transparent
                ctx.fillStyle = currentTetromino.color;
                ctx.fillRect((tetrominoX + x) * gridSize, (tetrominoY + y + ghostY) * gridSize, gridSize, gridSize);
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1;
                ctx.strokeRect((tetrominoX + x) * gridSize, (tetrominoY + y + ghostY) * gridSize, gridSize, gridSize);
                ctx.globalAlpha = 1.0; // Reset transparency
            }
        });
    });
}

// Modify the game loop to include the ghost piece
function gameLoop() {
    if (!isPaused) {
        clearCanvas();
        drawGameGrid();
        drawGhostPiece(); // Draw ghost piece before actual piece
        drawTetromino();
        moveTetrominoDown();
    }
}