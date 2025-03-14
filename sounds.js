// Sound effects for Tetris game

const SOUNDS = {
    move: new Audio(),
    rotate: new Audio(),
    drop: new Audio(),
    clear: new Audio(),
    levelUp: new Audio(),
    gameOver: new Audio(),
    hold: new Audio(),
    music: new Audio('Tetris.mp3')
};

// Set default volume
const DEFAULT_SFX_VOLUME = 0.5;
const DEFAULT_MUSIC_VOLUME = 0.3;

// Sound settings
let soundEnabled = true;
let musicEnabled = true;

// Initialize sound sources
function initSounds() {
    // Set volumes
    Object.values(SOUNDS).forEach(sound => {
        if (sound === SOUNDS.music) {
            sound.volume = DEFAULT_MUSIC_VOLUME;
            sound.loop = true;
        } else {
            sound.volume = DEFAULT_SFX_VOLUME;
        }
    });
}

// Play a sound effect
function playSound(name) {
    if (soundEnabled && SOUNDS[name]) {
        SOUNDS[name].currentTime = 0;
        SOUNDS[name].play().catch(e => console.log('Audio play error:', e));
    }
}

// Start background music
function startMusic() {
    if (musicEnabled) {
        SOUNDS.music.play().catch(e => console.log('Music play error:', e));
    }
}

// Toggle sound effects
function toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
}

// Toggle music
function toggleMusic() {
    musicEnabled = !musicEnabled;
    if (musicEnabled) {
        startMusic();
    } else {
        SOUNDS.music.pause();
    }
    return musicEnabled;
}

// Initialize sounds when the module loads
initSounds();

// Export functions and state
export {
    playSound,
    startMusic,
    toggleSound,
    toggleMusic,
    soundEnabled,
    musicEnabled
};