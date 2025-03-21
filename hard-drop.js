// Add this function
function hardDrop() {
    if (isPaused) return;
    
    let dropDistance = 0;
    while (isValidMove(0, dropDistance + 1)) {
        dropDistance++;
    }
    
    tetrominoY += dropDistance;
    lockTetromino();
    clearLines();
    
    // Generate new tetromino
    currentTetromino = generateTetromino();
    tetrominoX = Math.floor(gridWidth / 2) - Math.ceil(currentTetromino.shape[0].length / 2);
    tetrominoY = 0;
    
    if (!isValidMove(0, 0)) {
        gameOver();
        return;
    }
    
    playSound(pieceLandedSound);
    resetDropInterval();
}

// Add to keyboard event listener
document.addEventListener('keydown', event => {
    switch (event.key) {
        // ... existing cases ...
        case ' ': // Space for hard drop
            hardDrop();
            break;
        // Use ArrowUp for rotation instead
        case 'ArrowUp':
            rotateTetromino();
            break;
    }
});

// Add hard drop button to controls
const hardDropButton = document.createElement('button');
hardDropButton.id = 'hard-drop-button';
hardDropButton.className = 'game-button';
hardDropButton.textContent = 'Drop';
hardDropButton.addEventListener('click', () => {
    playSound(buttonClickSound);
    hardDrop();
});

document.getElementById('controls-container').appendChild(hardDropButton);