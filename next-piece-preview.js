// Add these variables to your game variables section
let nextTetromino = null;
const nextPreviewSize = 4; // Size of the preview area

// Modify the generateTetromino function
function generateTetromino() {
    if (nextTetromino) {
        currentTetromino = nextTetromino;
    } else {
        const shapeIndex = Math.floor(Math.random() * tetrominoShapes.length);
        currentTetromino = {
            shape: tetrominoShapes[shapeIndex],
            color: tetrominoColors[shapeIndex]
        };
    }
    
    // Generate next tetromino
    const nextShapeIndex = Math.floor(Math.random() * tetrominoShapes.length);
    nextTetromino = {
        shape: tetrominoShapes[nextShapeIndex],
        color: tetrominoColors[nextShapeIndex]
    };
    
    // Draw next piece preview
    drawNextPiecePreview();
    
    // Reset position
    tetrominoX = Math.floor(gridWidth / 2) - Math.ceil(currentTetromino.shape[0].length / 2);
    tetrominoY = 0;
}

// Add this function to draw the next piece preview
function drawNextPiecePreview() {
    // Create a small canvas for the preview if it doesn't exist
    if (!document.getElementById('preview-canvas')) {
        const previewCanvas = document.createElement('canvas');
        previewCanvas.id = 'preview-canvas';
        previewCanvas.width = nextPreviewSize * gridSize;
        previewCanvas.height = nextPreviewSize * gridSize;
        previewCanvas.style.border = '2px solid #6b7280';
        previewCanvas.style.borderRadius = '4px';
        previewCanvas.style.marginBottom = '10px';
        
        // Add preview title
        const previewTitle = document.createElement('div');
        previewTitle.textContent = 'Next Piece';
        previewTitle.style.fontSize = '0.8rem';
        previewTitle.style.marginBottom = '5px';
        
        // Create container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'flex flex-col items-center mb-3';
        previewContainer.appendChild(previewTitle);
        previewContainer.appendChild(previewCanvas);
        
        // Insert after score display
        const scoreLevel = document.getElementById('score-level');
        scoreLevel.parentNode.insertBefore(previewContainer, scoreLevel.nextSibling);
    }
    
    // Get the preview canvas and context
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    
    // Clear the preview canvas
    previewCtx.fillStyle = '#242424';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // Center the tetromino in the preview
    const offsetX = Math.floor((nextPreviewSize - nextTetromino.shape[0].length) / 2);
    const offsetY = Math.floor((nextPreviewSize - nextTetromino.shape.length) / 2);
    
    // Draw the next tetromino
    nextTetromino.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                previewCtx.fillStyle = nextTetromino.color;
                previewCtx.fillRect((offsetX + x) * gridSize, (offsetY + y) * gridSize, gridSize, gridSize);
                previewCtx.strokeStyle = '#374151';
                previewCtx.lineWidth = 2;
                previewCtx.strokeRect((offsetX + x) * gridSize, (offsetY + y) * gridSize, gridSize, gridSize);
            }
        });
    });
}