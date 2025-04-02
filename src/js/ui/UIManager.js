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
        
        // Create interaction prompt
        this.createInteractionPrompt();
        
        // Create healing indicator
        this.createHealingIndicator();
        
        // Create damage overlay
        this.createDamageOverlay();
        
        // Create low health overlay
        this.createLowHealthOverlay();
        
        // Flash effect state
        this.isScreenFlashing = false;
        this.screenFlashStartTime = 0;
        this.SCREEN_FLASH_DURATION = 0.1; // Shortened to 0.1 seconds
        
        // Low health state
        this.isLowHealth = false;
        this.heartbeatSound = null;
        this.lowHealthPulseTime = 0;
    }
    
    /**
     * Create interaction prompt for health packs
     */
    createInteractionPrompt() {
        // Create the prompt container
        this.interactionPromptContainer = document.createElement('div');
        this.interactionPromptContainer.style.position = 'absolute';
        this.interactionPromptContainer.style.top = '55%';
        this.interactionPromptContainer.style.left = '50%';
        this.interactionPromptContainer.style.transform = 'translate(-50%, -50%)';
        this.interactionPromptContainer.style.textAlign = 'center';
        this.interactionPromptContainer.style.color = 'white';
        this.interactionPromptContainer.style.fontFamily = 'Arial, sans-serif';
        this.interactionPromptContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
        this.interactionPromptContainer.style.display = 'none';
        this.interactionPromptContainer.style.zIndex = '1010';
        
        // Create the prompt text
        this.interactionPrompt = document.createElement('div');
        this.interactionPrompt.style.fontSize = '1.2rem';
        this.interactionPrompt.style.fontWeight = 'bold';
        this.interactionPrompt.textContent = 'Press E to use Health Pack';
        
        // Add the elements to the DOM
        this.interactionPromptContainer.appendChild(this.interactionPrompt);
        document.body.appendChild(this.interactionPromptContainer);
    }
    
    /**
     * Show or hide the interaction prompt
     * @param {boolean} show - Whether to show the prompt
     * @param {string} text - Text to display in the prompt (optional)
     */
    showInteractionPrompt(show, text = 'Press E to use Health Pack') {
        if (show) {
            this.interactionPromptContainer.style.display = 'block';
            this.interactionPrompt.textContent = text;
        } else {
            this.interactionPromptContainer.style.display = 'none';
        }
    }
    
    /**
     * Create score display at the top of the screen
     */
    createScoreDisplay() {
        // Removed score display implementation
    }
    
    /**
     * Create a healing indicator overlay
     */
    createHealingIndicator() {
        // Create healing overlay
        this.healingOverlay = document.createElement('div');
        this.healingOverlay.style.position = 'absolute';
        this.healingOverlay.style.top = '0';
        this.healingOverlay.style.left = '0';
        this.healingOverlay.style.width = '100%';
        this.healingOverlay.style.height = '100%';
        this.healingOverlay.style.backgroundColor = 'rgba(0, 255, 0, 0)';
        this.healingOverlay.style.pointerEvents = 'none';
        this.healingOverlay.style.transition = 'background-color 0.2s ease';
        this.healingOverlay.style.zIndex = '997'; // Below damage overlay
        document.body.appendChild(this.healingOverlay);
        
        // Create healing text
        this.healingText = document.createElement('div');
        this.healingText.style.position = 'absolute';
        this.healingText.style.top = '60%';
        this.healingText.style.left = '50%';
        this.healingText.style.transform = 'translate(-50%, -50%)';
        this.healingText.style.color = '#00ff00';
        this.healingText.style.fontFamily = 'Arial, sans-serif';
        this.healingText.style.fontSize = '24px';
        this.healingText.style.fontWeight = 'bold';
        this.healingText.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.8)';
        this.healingText.style.display = 'none';
        this.healingText.textContent = 'HEALING';
        document.body.appendChild(this.healingText);
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
     * Create low health overlay for grey tint and pulsating red when health is low
     */
    createLowHealthOverlay() {
        // Grayscale overlay for a "bleeding out" effect
        this.lowHealthOverlay = document.createElement('div');
        this.lowHealthOverlay.style.position = 'absolute';
        this.lowHealthOverlay.style.top = '0';
        this.lowHealthOverlay.style.left = '0';
        this.lowHealthOverlay.style.width = '100%';
        this.lowHealthOverlay.style.height = '100%';
        this.lowHealthOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)'; // Start transparent
        this.lowHealthOverlay.style.pointerEvents = 'none'; // Don't block mouse events
        this.lowHealthOverlay.style.transition = 'all 0.5s ease';
        this.lowHealthOverlay.style.mixBlendMode = 'saturation'; // This creates a true grayscale effect
        this.lowHealthOverlay.style.zIndex = '998'; // Lower z-index
        document.body.appendChild(this.lowHealthOverlay);
        
        // Red pulse overlay (separate from damage overlay) - higher z-index to be above grayscale
        this.lowHealthPulse = document.createElement('div');
        this.lowHealthPulse.style.position = 'absolute';
        this.lowHealthPulse.style.top = '0';
        this.lowHealthPulse.style.left = '0';
        this.lowHealthPulse.style.width = '100%';
        this.lowHealthPulse.style.height = '100%';
        this.lowHealthPulse.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        this.lowHealthPulse.style.pointerEvents = 'none';
        this.lowHealthPulse.style.zIndex = '999'; // Higher z-index so it appears above grayscale
        document.body.appendChild(this.lowHealthPulse);
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
        // Removed score display update
    }
    
    /**
     * Handle low health effects
     * @param {number} health - Current health
     * @param {number} deltaTime - Time since last update
     * @param {AudioManager} audioManager - Audio manager for heartbeat sound
     */
    updateLowHealthEffects(health, deltaTime, audioManager) {
        const LOW_HEALTH_THRESHOLD = 50;
        
        // Check if player has low health
        if (health <= LOW_HEALTH_THRESHOLD) {
            // Apply grayscale effect if not already applied
            if (!this.isLowHealth) {
                this.isLowHealth = true;
                this.lowHealthOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'; // White with saturation mix blend mode creates grayscale
                
                // Start heartbeat sound
                if (!this.heartbeatSound) {
                    this.heartbeatSound = audioManager.createLoopingSound('heartbeat');
                    audioManager.playSound('heartbeat', 2, true);
                }
            }
            
            // Update pulsating red effect - significantly increased frequency
            this.lowHealthPulseTime += deltaTime;
            const pulseIntensity = Math.abs(Math.sin(this.lowHealthPulseTime * 6)) * 0.3; // Increased from 2 to 8 for much faster pulsing
            this.lowHealthPulse.style.backgroundColor = `rgba(255, 0, 0, ${pulseIntensity})`;
            
        } else if (this.isLowHealth) {
            // Remove effects when health is above threshold
            this.isLowHealth = false;
            this.lowHealthOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
            this.lowHealthPulse.style.backgroundColor = 'rgba(255, 0, 0, 0)';
            
            // Stop heartbeat sound
            if (this.heartbeatSound) {
                audioManager.stopSound('heartbeat');
                this.heartbeatSound = null;
            }
        }
    }
    
    /**
     * Update healing indicator
     * @param {boolean} isHealing - Whether player is being healed
     * @param {number} progress - Healing progress from 0 to 1
     */
    updateHealingIndicator(isHealing, progress = 0) {
        if (isHealing) {
            // Show green overlay with pulsating intensity
            const intensity = 0.15 + Math.sin(performance.now() / 200) * 0.05;
            this.healingOverlay.style.backgroundColor = `rgba(0, 255, 0, ${intensity})`;
            
            // Show healing text
            this.healingText.style.display = 'block';
            
            // Update text based on progress
            const progressPercent = Math.floor(progress * 100);
            this.healingText.textContent = `HEALING ${progressPercent}%`;
        } else {
            // Hide green overlay
            this.healingOverlay.style.backgroundColor = 'rgba(0, 255, 0, 0)';
            
            // Hide healing text
            this.healingText.style.display = 'none';
        }
    }
    
    /**
     * Update UI elements
     * @param {number} health - Player's current health
     * @param {string} weapon - Player's current weapon
     * @param {number} score - Current score
     * @param {number} deltaTime - Time since last update
     * @param {AudioManager} audioManager - Audio manager for effects
     * @param {Object} healingInfo - Information about player healing state
     * @param {Object} lookingAt - Information about what player is looking at
     */
    update(health, weapon, score, deltaTime, audioManager, healingInfo = null, lookingAt = null) {
        // Update health display
        const healthPercent = Math.max(0, Math.min(100, health));
        this.healthFill.style.width = `${healthPercent}%`;
        this.healthText.textContent = Math.round(healthPercent);

        // Update weapon display
        this.weaponName.textContent = weapon;
        
        // Update healing indicator if info provided
        if (healingInfo) {
            this.updateHealingIndicator(healingInfo.isHealing, healingInfo.progress);
        } else {
            this.updateHealingIndicator(false);
        }
        
        // Update interaction prompts
        if (lookingAt && lookingAt.isLookingAtHealthPack && health < 100) {
            this.showInteractionPrompt(true);
        } else {
            this.showInteractionPrompt(false);
        }
        
        // Update low health effects
        this.updateLowHealthEffects(health, deltaTime, audioManager);
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
     * @param {Function} continueCallback - Callback to start next wave
     */
    showWaveComplete(wave, score, continueCallback) {
        // Immediately call the callback to continue to the next wave without showing a screen
        if (continueCallback) {
            setTimeout(continueCallback, 500); // Small delay before starting next wave
        }
    }
} 