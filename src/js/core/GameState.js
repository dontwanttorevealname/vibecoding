/**
 * Game state manager
 * Tracks player input, score, and other global game state
 */
export class GameState {
    constructor() {
        // Input state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            e: false  // Add E key for health pack interactions
        };
        
        // Game state
        this.score = 0;
        this.wave = 1;
        this.enemiesRemaining = 0;
        
        // Setup event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
            this.keys[e.key.toLowerCase()] = true;
        }
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.key.toLowerCase())) {
            this.keys[e.key.toLowerCase()] = false;
        }
    }
    
    /**
     * Get the current key state
     * @returns {Object} Current key state
     */
    getKeys() {
        return this.keys;
    }
    
    /**
     * Update the current score
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.score += points;
    }
    
    /**
     * Get the current score
     * @returns {number} Current score
     */
    getScore() {
        return this.score;
    }
    
    /**
     * Set the current wave
     * @param {number} wave - Current wave number
     */
    setWave(wave) {
        this.wave = wave;
    }
    
    /**
     * Get the current wave
     * @returns {number} Current wave number
     */
    getWave() {
        return this.wave;
    }
    
    /**
     * Update enemies remaining
     * @param {number} count - Number of enemies remaining
     */
    setEnemiesRemaining(count) {
        this.enemiesRemaining = count;
    }
    
    /**
     * Get enemies remaining
     * @returns {number} Number of enemies remaining
     */
    getEnemiesRemaining() {
        return this.enemiesRemaining;
    }
} 