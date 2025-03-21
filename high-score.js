// Add this variable
let highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;

// Add this to the HTML inside score-level div
// <p>High Score: <span id="high-score">0</span></p>

// Update the high score display
function updateHighScore() {
    const highScoreDisplay = document.getElementById('high-score');
    highScoreDisplay.textContent = highScore;
}

// Modify the game over function
function gameOver() {
    isPaused = true;
    clearInterval(gameLoopInterval);
    
    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('tetrisHighScore', highScore);
        messageText.textContent = 'Game Over! New High Score: ' + highScore;
    } else {
        messageText.textContent = 'Game Over!';
    }
    
    updateHighScore();
    messageBox.classList.remove('hidden');
    playSound(gameOverSound);
}

// Call this at initialization
function initializeGame() {
    // ...existing initialization code...
    updateHighScore(); // Display the high score
}