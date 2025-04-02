import * as THREE from 'three';

/**
 * Wave Manager
 * Handles wave spawning and progression
 */
export class WaveManager {
    constructor(zombieManager, audioManager, uiManager, gameState) {
        this.zombieManager = zombieManager;
        this.audioManager = audioManager;
        this.uiManager = uiManager;
        this.gameState = gameState;
        this.scene = null; // We'll store the scene reference for adding zombies
        
        // Wave configuration
        this.waveConfigurations = [
            { regularZombies: 5, tankZombies: 0, runnerZombies: 0 },   // Wave 1
            { regularZombies: 7, tankZombies: 0, runnerZombies: 2 },   // Wave 2
            { regularZombies: 7, tankZombies: 1, runnerZombies: 2 },   // Wave 3
            { regularZombies: 8, tankZombies: 1, runnerZombies: 3 },   // Wave 4
            { regularZombies: 9, tankZombies: 2, runnerZombies: 5 },   // Wave 5
            { regularZombies: 10, tankZombies: 2, runnerZombies: 7 },  // Wave 6
            { regularZombies: 12, tankZombies: 3, runnerZombies: 10 }  // Wave 7
        ];
        
        // Wave state
        this.currentWave = 0;
        this.waveActive = false;
        this.zombiesRemaining = 0;
        this.waveStartTime = 0;
        
        // DOM element for wave announcement
        this.createWaveAnnouncementElement();
        
        // Set up zombie death event listener
        this.setupZombieDeathListener();
    }
    
    /**
     * Set the scene reference for adding zombies
     * @param {THREE.Scene} scene - The game scene
     */
    setScene(scene) {
        this.scene = scene;
    }
    
    /**
     * Create DOM element for wave announcements
     */
    createWaveAnnouncementElement() {
        this.waveAnnouncement = document.createElement('div');
        this.waveAnnouncement.className = 'wave-announcement';
        this.waveAnnouncement.style.display = 'none';
        document.body.appendChild(this.waveAnnouncement);
    }
    
    /**
     * Start the game with wave 1
     */
    startGame() {
        this.currentWave = 0;
        this.startNextWave();
    }
    
    /**
     * Start the next wave
     */
    startNextWave() {
        this.currentWave++;
        console.log(`Starting Wave ${this.currentWave}`);
        
        // Check if we've reached the end of our defined waves
        if (this.currentWave > this.waveConfigurations.length) {
            // Loop back to the last configuration but increase difficulty
            const lastWaveConfig = this.waveConfigurations[this.waveConfigurations.length - 1];
            const newWaveConfig = {
                regularZombies: Math.floor(lastWaveConfig.regularZombies * 1.2),
                tankZombies: Math.floor(lastWaveConfig.tankZombies * 1.2) + 1,
                runnerZombies: Math.floor(lastWaveConfig.runnerZombies * 1.3) + 2
            };
            this.waveConfigurations.push(newWaveConfig);
        }
        
        // Get wave configuration
        const waveConfig = this.waveConfigurations[this.currentWave - 1];
        
        // Display wave number
        this.announceWave(this.currentWave);
        
        // Play wave start sound
        this.audioManager.playSound('round_start');
        
        // Set wave state
        this.waveActive = true;
        this.waveStartTime = Date.now();
        this.zombiesRemaining = waveConfig.regularZombies + waveConfig.tankZombies + waveConfig.runnerZombies;
        
        // Spawn zombies with a slight delay
        setTimeout(() => {
            this.spawnWaveZombies(waveConfig);
        }, 2000);
    }
    
    /**
     * Announce the wave number with UI animation
     * @param {number} waveNumber - Current wave number
     */
    announceWave(waveNumber) {
        this.waveAnnouncement.textContent = `WAVE ${waveNumber}`;
        this.waveAnnouncement.style.display = 'block';
        this.waveAnnouncement.style.animation = 'none';
        
        // Trigger reflow to restart animation
        void this.waveAnnouncement.offsetWidth;
        
        this.waveAnnouncement.style.animation = 'waveAnnouncement 3s forwards';
        
        // Hide the announcement after animation completes
        setTimeout(() => {
            this.waveAnnouncement.style.display = 'none';
        }, 3000);
    }
    
    /**
     * Spawn zombies for the current wave
     * @param {Object} waveConfig - Configuration for the wave
     */
    spawnWaveZombies(waveConfig) {
        // Clear any existing zombies from the scene (just to be safe)
        const zombies = this.zombieManager.getZombies();
        for (let i = zombies.length - 1; i >= 0; i--) {
            const zombie = zombies[i];
            if (zombie.parent) {
                zombie.parent.remove(zombie);
            }
            // Remove from the zombies array
            zombies.splice(i, 1);
        }
        
        // Make sure the array is empty
        while (zombies.length > 0) {
            zombies.pop();
        }
        
        // Spawn regular zombies with random positioning
        for (let i = 0; i < waveConfig.regularZombies; i++) {
            // Use a higher minimum distance to keep zombies further from player at start
            const spawnPos = this.getSpawnPosition(40, 60);
            const zombie = this.zombieManager.createZombie(spawnPos.x, spawnPos.z, 'regular');
            
            // Make sure the zombie is added to the scene
            if (this.scene && !zombie.parent) {
                this.scene.add(zombie);
            }
        }
        
        // Spawn tank zombies with random positioning and greater distance
        for (let i = 0; i < waveConfig.tankZombies; i++) {
            const spawnPos = this.getSpawnPosition(50, 70);
            const zombie = this.zombieManager.createZombie(spawnPos.x, spawnPos.z, 'tank');
            
            // Make sure the zombie is added to the scene
            if (this.scene && !zombie.parent) {
                this.scene.add(zombie);
            }
        }
        
        // Spawn runner zombies with random positioning (closer to player for earlier encounters)
        for (let i = 0; i < waveConfig.runnerZombies; i++) {
            const spawnPos = this.getSpawnPosition(35, 55);
            const zombie = this.zombieManager.createZombie(spawnPos.x, spawnPos.z, 'runner');
            
            // Make sure the zombie is added to the scene
            if (this.scene && !zombie.parent) {
                this.scene.add(zombie);
            }
        }
        
        console.log(`Wave ${this.currentWave}: Spawned ${waveConfig.regularZombies} regular zombies, ${waveConfig.tankZombies} tank zombies, and ${waveConfig.runnerZombies} runner zombies`);
    }
    
    /**
     * Get a random spawn position at a safe distance from the player
     * @param {number} minDistance - Minimum distance from player
     * @param {number} maxDistance - Maximum distance from player
     * @returns {Object} Position { x, z }
     */
    getSpawnPosition(minDistance, maxDistance) {
        // Get random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        // Calculate position
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        return { x, z };
    }
    
    /**
     * Update wave state
     * @returns {boolean} True if all zombies in the wave have been defeated
     */
    update() {
        if (!this.waveActive) return false;
        
        const currentZombieCount = this.zombieManager.getZombies().filter(
            zombie => !zombie.userData.isDead
        ).length;
        
        // Don't allow wave to complete too quickly after starting
        const waveElapsedTime = Date.now() - this.waveStartTime;
        const minimumWaveTime = 5000; // 5 seconds minimum wave time
        
        // Log remaining zombies (limit frequency to avoid console spam)
        if (this.zombiesRemaining !== currentZombieCount) {
            console.log(`Wave ${this.currentWave}: ${currentZombieCount} zombies remaining`);
            this.zombiesRemaining = currentZombieCount;
        }
        
        // Check if all zombies have been defeated (only living zombies count)
        if (currentZombieCount === 0 && waveElapsedTime > minimumWaveTime) {
            console.log(`Wave ${this.currentWave} complete! All zombies defeated. Wave lasted ${Math.round(waveElapsedTime/1000)} seconds.`);
            this.waveActive = false;
            return true; // Wave complete
        }
        
        return false;
    }
    
    /**
     * Get current wave number
     * @returns {number} Current wave number
     */
    getCurrentWave() {
        return this.currentWave;
    }
    
    /**
     * Set up listener for zombie death events to award points
     */
    setupZombieDeathListener() {
        // First, try to patch the killZombie method if it exists
        const originalKillZombie = this.zombieManager.killZombie;
        if (originalKillZombie) {
            this.zombieManager.killZombie = (zombie, ...args) => {
                // Award points based on zombie type
                if (zombie.userData && zombie.userData.zombieType) {
                    if (zombie.userData.zombieType === 'tank') {
                        this.gameState.addScore(200); // More points for tank zombies
                    } else if (zombie.userData.zombieType === 'runner') {
                        this.gameState.addScore(150); // Runner zombies award more points than regular
                    } else {
                        this.gameState.addScore(100); // Regular zombie points
                    }
                }
                
                // Call the original method
                return originalKillZombie.call(this.zombieManager, zombie, ...args);
            };
        } 
        // If killZombie doesn't exist, patch damageZombie instead
        else {
            const originalDamageZombie = this.zombieManager.damageZombie;
            if (originalDamageZombie) {
                this.zombieManager.damageZombie = (zombie, damage, camera, ...args) => {
                    // Get result from original method first
                    const wasKilled = originalDamageZombie.call(
                        this.zombieManager, zombie, damage, camera, ...args
                    );
                    
                    // If zombie was killed, award points
                    if (wasKilled && zombie.userData && zombie.userData.zombieType) {
                        if (zombie.userData.zombieType === 'tank') {
                            this.gameState.addScore(200); // More points for tank zombies
                        } else if (zombie.userData.zombieType === 'runner') {
                            this.gameState.addScore(150); // Runner zombies award more points than regular
                        } else {
                            this.gameState.addScore(100); // Regular zombie points
                        }
                    }
                    
                    return wasKilled;
                };
            }
        }
    }
} 