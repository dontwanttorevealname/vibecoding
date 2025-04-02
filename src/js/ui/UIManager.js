/**
 * UI Manager
 * Handles all game user interface elements
 */
export class UIManager {
    constructor() {
        // HUD elements
        this.healthFill = document.querySelector('.health-fill');
        this.healthText = document.querySelector('.health-text');
        this.weaponName = document.querySelector('.weapon-name');
        
        // Create score display
        this.createScoreDisplay();
        
        // Create damage overlay
        this.createDamageOverlay();
        
        // Flash effect state
        this.isScreenFlashing = false;
        this.screenFlashStartTime = 0;
        this.SCREEN_FLASH_DURATION = 0.1; // Shortened to 0.1 seconds
    }
    
    /**
     * Create score display at the top of the screen
     */
    createScoreDisplay() {
        // Create score container
        this.scoreContainer = document.createElement('div');
        this.scoreContainer.className = 'score-container';
        this.scoreContainer.style.position = 'absolute';
        this.scoreContainer.style.top = '10px';
        this.scoreContainer.style.left = '50%';
        this.scoreContainer.style.transform = 'translateX(-50%)';
        this.scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.scoreContainer.style.color = 'white';
        this.scoreContainer.style.padding = '8px 20px';
        this.scoreContainer.style.borderRadius = '20px';
        this.scoreContainer.style.fontSize = '14px';
        this.scoreContainer.style.fontWeight = 'bold';
        this.scoreContainer.style.textAlign = 'center';
        this.scoreContainer.style.zIndex = '1001';
        this.scoreContainer.style.fontFamily = "'Press Start 2P', cursive, sans-serif";
        this.scoreContainer.style.textShadow = '2px 2px 2px rgba(0, 0, 0, 0.5)';
        this.scoreContainer.style.letterSpacing = '1px';
        
        // Create score text
        this.scoreText = document.createElement('div');
        this.scoreText.textContent = 'SCORE: 0';
        
        // Add to DOM
        this.scoreContainer.appendChild(this.scoreText);
        document.body.appendChild(this.scoreContainer);
    }
    
    /**
     * Create damage overlay for screen flash when hit
     */
    createDamageOverlay() {
        this.damageOverlay = document.createElement('div');
        this.damageOverlay.style.position = 'absolute';
        this.damageOverlay.style.top = '0';
        this.damageOverlay.style.left = '0';
        this.damageOverlay.style.width = '100%';
        this.damageOverlay.style.height = '100%';
        this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        this.damageOverlay.style.pointerEvents = 'none'; // Don't block mouse events
        this.damageOverlay.style.transition = 'background-color 0.1s ease-out';
        this.damageOverlay.style.zIndex = '1000';
        document.body.appendChild(this.damageOverlay);
    }
    
    /**
     * Flash screen red when player is hit
     */
    flashScreenRed() {
        this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
        this.isScreenFlashing = true;
        this.screenFlashStartTime = performance.now() / 1000;
        
        // Schedule the removal of the flash effect
        setTimeout(() => {
            this.damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
            this.isScreenFlashing = false;
        }, this.SCREEN_FLASH_DURATION * 1000);
    }
    
    /**
     * Update score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        if (this.scoreText) {
            this.scoreText.textContent = `SCORE: ${score}`;
        }
    }
    
    /**
     * Update UI elements
     * @param {number} health - Player's current health
     * @param {string} weapon - Player's current weapon
     * @param {number} score - Current score
     */
    update(health, weapon, score) {
        // Update health display
        const healthPercent = Math.max(0, Math.min(100, health));
        this.healthFill.style.width = `${healthPercent}%`;
        this.healthText.textContent = Math.round(healthPercent);

        // Update weapon display
        this.weaponName.textContent = weapon;
        
        // Update score display
        this.updateScore(score);
    }
    
    /**
     * Show game over screen
     */
    showGameOver() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.className = 'game-over-screen';
        gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <h1>GAME OVER</h1>
                <p>You were overrun by zombies!</p>
                <button id="restart-button">Restart Game</button>
            </div>
        `;
        document.body.appendChild(gameOverScreen);
        
        // Add restart functionality
        document.getElementById('restart-button').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    /**
     * Show wave complete screen
     * @param {number} wave - Completed wave number
     * @param {number} score - Current score
     * @param {Function} continueCallback - Callback to start next wave (unused, kept for compatibility)
     */
    showWaveComplete(wave, score, continueCallback) {
        const waveCompleteScreen = document.createElement('div');
        waveCompleteScreen.className = 'wave-complete-screen';
        waveCompleteScreen.innerHTML = `
            <div class="wave-complete-content">
                <h1>Wave ${wave} Complete!</h1>
                <p>Score: ${score}</p>
            </div>
        `;
        document.body.appendChild(waveCompleteScreen);
        
        // Auto-hide after 3 seconds and continue to next wave
        setTimeout(() => {
            waveCompleteScreen.remove();
            if (continueCallback) continueCallback();
        }, 3000);
    }
} 