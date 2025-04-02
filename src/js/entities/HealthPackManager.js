import * as THREE from 'three';

/**
 * Health Pack Manager
 * Handles creation and management of health packs that can be picked up by the player
 */
export class HealthPackManager {
    constructor(audioManager) {
        this.audioManager = audioManager;
        this.healthPacks = [];
        
        // Health pack settings
        this.HEALTH_AMOUNT = 15; // Amount of health restored
        this.HEALING_DURATION = 2.5; // Time in seconds to complete healing
        this.DESPAWN_TIME = 30; // Time in seconds before health pack despawns
        
        // Drop chances based on zombie type
        this.DROP_CHANCES = {
            'regular': 0.15, // 15% for regular zombies
            'runner': 0.20,  // 20% for runner zombies
            'tank': 0.30     // 30% for tank zombies
        };
        
        // Looking at info
        this.lookingAtHealthPack = null;
    }
    
    /**
     * Add health packs to the scene
     * @param {THREE.Scene} scene - Scene to add health packs to
     */
    addToScene(scene) {
        for (const healthPack of this.healthPacks) {
            scene.add(healthPack);
        }
    }
    
    /**
     * Get all health packs
     * @returns {Array} Array of health pack objects
     */
    getHealthPacks() {
        return this.healthPacks;
    }
    
    /**
     * Create a 3D health pack model at the given position
     * @param {number} x - X position
     * @param {number} z - Z position
     * @returns {THREE.Group} The created health pack
     */
    createHealthPack(x, z) {
        const healthPack = new THREE.Group();
        
        // Main box (red with white cross) - make it larger
        const boxGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.6); // Larger box
        const boxMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.8
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        // White cross on top - make it more visible
        const horizontalCrossGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.15);
        const verticalCrossGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.5);
        const crossMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.7,
            roughness: 0.2
        });
        
        const horizontalCross = new THREE.Mesh(horizontalCrossGeometry, crossMaterial);
        horizontalCross.position.y = 0.2; // Higher position on the box
        
        const verticalCross = new THREE.Mesh(verticalCrossGeometry, crossMaterial);
        verticalCross.position.y = 0.2; // Higher position on the box
        
        // Add all parts to the group
        healthPack.add(box);
        healthPack.add(horizontalCross);
        healthPack.add(verticalCross);
        
        // Add a glowing light to make it more visible
        const light = new THREE.PointLight(0xff0000, 1, 3);
        light.position.set(0, 0.5, 0);
        healthPack.add(light);
        
        // Set position - raise it higher off the ground
        healthPack.position.set(x, 0.5, z); 
        
        // Add floating animation
        healthPack.userData = {
            type: 'healthPack',
            spawnTime: performance.now() / 1000,
            floatOffset: Math.random() * Math.PI * 2, // Random starting phase
            healAmount: this.HEALTH_AMOUNT,
            healDuration: this.HEALING_DURATION,
            despawnTime: this.DESPAWN_TIME,
            radius: 0.8 // Larger collision radius
        };
        
        // Add to array
        this.healthPacks.push(healthPack);
        
        return healthPack;
    }
    
    /**
     * Spawn a health pack at a zombie's death position
     * @param {THREE.Group} zombie - The zombie that died
     * @param {THREE.Scene} scene - Scene to add the health pack to
     * @returns {boolean} Whether a health pack was spawned
     */
    spawnHealthPackAtZombie(zombie, scene) {
        // Apply drop chance based on zombie type
        const zombieType = zombie.userData.zombieType || 'regular';
        const dropChance = this.DROP_CHANCES[zombieType] || this.DROP_CHANCES.regular;
        
        // Check if this zombie should drop a health pack
        if (Math.random() > dropChance) {
            return false; // Don't spawn a health pack
        }
        
        // Store zombie's position before creating the health pack
        const zombieX = zombie.position.x;
        const zombieZ = zombie.position.z;
        
        // Create health pack at zombie's position
        const healthPack = this.createHealthPack(zombieX, zombieZ);
        
        // Make sure it's added to the scene
        scene.add(healthPack);
        
        console.log(`Spawned health pack at position: ${zombieX}, ${zombieZ}`);
        
        return healthPack;
    }
    
    /**
     * Check if player is looking at a health pack
     * @param {THREE.Camera} camera - Player's camera
     * @returns {THREE.Group|null} The health pack being looked at or null
     */
    checkHealthPackLookAt(camera) {
        // Reset looking at state
        this.lookingAtHealthPack = null;
        
        // If no health packs, return null
        if (this.healthPacks.length === 0) {
            return null;
        }
        
        // Get player's forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        forward.normalize();
        
        // Check each health pack
        let closestHealthPack = null;
        let closestDistance = Infinity;
        
        for (const healthPack of this.healthPacks) {
            // Vector from player to health pack
            const toHealthPack = new THREE.Vector3();
            toHealthPack.subVectors(healthPack.position, camera.position);
            
            // Simple distance check first for optimization
            const distance = toHealthPack.length();
            
            // Skip if too far away
            if (distance > 5) continue;
            
            // Normalize the direction vector
            const dirToHealthPack = toHealthPack.clone().normalize();
            
            // Calculate dot product to determine if health pack is in front of player
            const dotProduct = forward.dot(dirToHealthPack);
            
            // Health pack is in front of player if dot product is positive and above threshold
            if (dotProduct > 0.95 && distance < closestDistance) { // Looking directly at it (within ~18 degrees)
                closestHealthPack = healthPack;
                closestDistance = distance;
            }
        }
        
        if (closestHealthPack) {
            console.log(`Looking at health pack at distance: ${closestDistance.toFixed(2)}`);
        }
        
        this.lookingAtHealthPack = closestHealthPack;
        return closestHealthPack;
    }
    
    /**
     * Get the health pack player is currently looking at
     * @returns {THREE.Group|null} Health pack being looked at
     */
    getLookingAtHealthPack() {
        return this.lookingAtHealthPack;
    }
    
    /**
     * Try to use a health pack if player is looking at one and presses E
     * @param {PlayerController} player - The player controller
     * @param {boolean} actionButtonPressed - Whether the action button (E) is pressed
     * @returns {boolean} Whether a health pack was used
     */
    tryUseHealthPack(player, actionButtonPressed) {
        // Get current player health
        const currentHealth = player.getHealth();
        
        // Don't allow collection if health is full
        if (currentHealth >= 100) {
            console.log("Cannot use health pack - health is already full");
            return false;
        }
        
        // Get the health pack player is looking at
        const healthPack = this.lookingAtHealthPack;
        
        // If no health pack or button not pressed, return false
        if (!healthPack) {
            console.log("No health pack found to use");
            return false;
        }
        
        if (!actionButtonPressed) {
            console.log("Action button not pressed");
            return false;
        }
        
        console.log("Using health pack!");
        
        // Use the health pack
        return this.beginHealing(player, healthPack);
    }
    
    /**
     * Check if player can collect a health pack
     * @param {PlayerController} player - The player controller
     * @returns {THREE.Group|null} Collected health pack or null
     */
    checkHealthPackCollection(player) {
        // This method is kept for backwards compatibility but no longer used for collection
        // Now we use tryUseHealthPack instead
        return null;
    }
    
    /**
     * Begin healing the player with a health pack
     * @param {PlayerController} player - The player to heal
     * @param {THREE.Group} healthPack - The health pack to use
     * @returns {boolean} Whether healing has begun
     */
    beginHealing(player, healthPack) {
        // Don't allow healing if health is full
        if (player.getHealth() >= 100) {
            return false;
        }
        
        // Remove health pack from scene and array
        if (healthPack.parent) {
            healthPack.parent.remove(healthPack);
        }
        
        const index = this.healthPacks.indexOf(healthPack);
        if (index !== -1) {
            this.healthPacks.splice(index, 1);
        }
        
        // Start the healing process on the player
        player.startHealing(
            healthPack.userData.healAmount,
            healthPack.userData.healDuration
        );
        
        // Play medkit sound
        this.audioManager.playSound('medkit', 0.7);
        
        return true;
    }
    
    /**
     * Update all health packs
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const currentTime = performance.now() / 1000;
        
        // Update each health pack
        for (let i = this.healthPacks.length - 1; i >= 0; i--) {
            const healthPack = this.healthPacks[i];
            
            // Enhanced floating animation - higher base position and more movement
            const baseHeight = 0.4; // Base height off the ground
            const floatHeight = 0.15; // Increased float height (was 0.05)
            
            // Floating animation
            healthPack.position.y = baseHeight + Math.sin(currentTime * 2 + healthPack.userData.floatOffset) * floatHeight;
            
            // Rotation animation - spin and wobble
            healthPack.rotation.y += deltaTime * 3; // Spin faster (was 2)
            healthPack.rotation.x = Math.sin(currentTime) * 0.1; // Add slight wobble
            
            // Check for despawn
            if (currentTime - healthPack.userData.spawnTime > healthPack.userData.despawnTime) {
                // Remove from scene
                if (healthPack.parent) {
                    healthPack.parent.remove(healthPack);
                }
                
                // Remove from array
                this.healthPacks.splice(i, 1);
            }
        }
    }
} 