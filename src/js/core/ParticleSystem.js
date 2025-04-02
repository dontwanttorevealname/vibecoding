import * as THREE from 'three';

/**
 * Particle System
 * Handles creation and management of particle effects
 */
export class ParticleSystem {
    constructor() {
        this.particleCount = 40; // Number of particles to create
        this.bloodParticles = new THREE.Group();
        
        // Create blood particle system
        this.bloodParticlePool = this.createBloodParticleSystem();
    }
    
    /**
     * Create a blood particle system pool
     * @returns {THREE.Group} Particle system group
     */
    createBloodParticleSystem() {
        const particleSystem = new THREE.Group();
        
        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            // Larger blood chunk particles
            const particle = new THREE.Mesh(
                // Using BoxGeometry with non-uniform dimensions to create chunky flesh pieces
                new THREE.BoxGeometry(
                    0.2 + Math.random() * 0.3, // Width between 0.2 and 0.5
                    0.1 + Math.random() * 0.2, // Height between 0.1 and 0.3
                    0.2 + Math.random() * 0.3  // Depth between 0.2 and 0.5
                ),
                new THREE.MeshBasicMaterial({ 
                    color: 0x8a0303, // Dark red color
                    transparent: true,
                    opacity: 1.0
                })
            );
            
            // Set initial position (will be updated when used)
            particle.position.set(0, 0, 0);
            
            // Hide initially
            particle.visible = false;
            
            // Add some custom properties for animation
            particle.userData = {
                velocity: new THREE.Vector3(0, 0, 0),
                active: false,
                lifespan: 0,
                maxLife: 1.0, // 1 second
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 10 - 5,
                    Math.random() * 10 - 5,
                    Math.random() * 10 - 5
                ) // Random rotation for tumbling effect
            };
            
            particleSystem.add(particle);
        }
        
        return particleSystem;
    }
    
    /**
     * Update particle systems
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        this.updateBloodParticles(deltaTime);
    }
    
    /**
     * Update blood particles
     * @param {number} deltaTime - Time since last update
     */
    updateBloodParticles(deltaTime) {
        for (const particle of this.bloodParticlePool.children) {
            if (particle.userData.active) {
                // Update position based on velocity
                particle.position.x += particle.userData.velocity.x * deltaTime;
                particle.position.y += particle.userData.velocity.y * deltaTime;
                particle.position.z += particle.userData.velocity.z * deltaTime;
                
                // Apply gravity - a bit less to make chunks float more dramatically
                particle.userData.velocity.y -= 7 * deltaTime;
                
                // Add rotation for tumbling effect
                particle.rotation.x += particle.userData.rotationSpeed.x * deltaTime;
                particle.rotation.y += particle.userData.rotationSpeed.y * deltaTime;
                particle.rotation.z += particle.userData.rotationSpeed.z * deltaTime;
                
                // Update lifespan
                particle.userData.lifespan += deltaTime;
                
                // Calculate opacity based on remaining life (fade out)
                const remainingLife = 1 - (particle.userData.lifespan / particle.userData.maxLife);
                particle.material.opacity = remainingLife;
                
                // Disable when lifespan is over
                if (particle.userData.lifespan >= particle.userData.maxLife) {
                    particle.userData.active = false;
                    particle.visible = false;
                }
            }
        }
    }
    
    /**
     * Spawn blood particles at a position with a direction
     * @param {THREE.Vector3} position - Position to spawn particles
     * @param {THREE.Vector3} direction - Direction vector for particles
     */
    spawnBloodParticles(position, direction) {
        // Get the count of particles to spawn
        const particlesToSpawn = Math.min(20, this.particleCount);
        let spawnedCount = 0;
        
        // Find inactive particles and activate them
        for (const particle of this.bloodParticlePool.children) {
            if (!particle.userData.active && spawnedCount < particlesToSpawn) {
                // Reset properties
                particle.userData.active = true;
                particle.userData.lifespan = 0;
                particle.visible = true;
                
                // Set position slightly elevated from hit point
                particle.position.copy(position);
                particle.position.y += 1.0; // Position at center of zombie
                
                // Direction now TOWARDS player instead of away
                const playerDirection = direction.clone().normalize().multiplyScalar(-1);
                
                // Set random velocity based on direction - flying toward player with some spread
                const speed = 2 + Math.random() * 5;
                
                // Add some randomness to the direction
                particle.userData.velocity.set(
                    playerDirection.x * speed + (Math.random() - 0.5) * 3,
                    Math.random() * 6 - 2, // Some up, some down for spread
                    playerDirection.z * speed + (Math.random() - 0.5) * 3
                );
                
                // Randomize initial rotation
                particle.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                // Create variation in chunk appearance
                // Randomize the color slightly for variety
                const redVariation = 0.7 + Math.random() * 0.3; // 0.7-1.0 range for red multiplier
                const color = new THREE.Color(
                    0.5 * redVariation, // Red with variation
                    0.01 * redVariation, // Tiny bit of green
                    0.01 * redVariation  // Tiny bit of blue
                );
                
                // Set material properties
                particle.material = new THREE.MeshBasicMaterial({ 
                    color: color, 
                    transparent: true,
                    opacity: 1.0
                });
                
                spawnedCount++;
            }
        }
        
        console.log(`Spawned ${spawnedCount} blood chunks`); // Debug output
    }
    
    /**
     * Add particle systems to scene
     * @param {THREE.Scene} scene - Scene to add particles to
     */
    addToScene(scene) {
        scene.add(this.bloodParticlePool);
    }
} 