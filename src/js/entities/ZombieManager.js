import * as THREE from 'three';

/**
 * Zombie Manager
 * Handles creation, AI, and management of zombie entities
 */
export class ZombieManager {
    constructor(audioManager, particleSystem) {
        this.audioManager = audioManager;
        this.particleSystem = particleSystem;
        this.zombies = [];
        this.obstacles = []; // Track obstacles for pathfinding
        
        // Common zombie parameters
        this.REGULAR_ZOMBIE = {
            health: 100,
            speed: 3.0,
            damage: 10,
            skinColor: 0x82a55d, // Zombie green
            eyeColor: 0xff0000, // Red eyes
            clothesColor: 0x3b312e, // Dark brown for tattered clothes
            scale: 1.0,
            soundPitch: {
                groan: 1.0,   // Regular pitch for groans
                attack: 0.6,  // Lower pitch for attack sounds
                pain: 0.6,    // Lower pitch for pain sounds
                death: 0.6    // Lower pitch for death sounds
            }
        };
        
        // Tank zombie parameters (larger, tougher, slower)
        this.TANK_ZOMBIE = {
            health: 200,
            speed: 2.0,
            damage: 20,
            skinColor: 0x4a6f32, // Darker green
            eyeColor: 0xffaa00, // Orange-red eyes
            clothesColor: 0x252018, // Darker clothes
            scale: 1.3,
            soundPitch: {
                groan: 0.6,   // Lower pitch for groans
                attack: 0.4,  // Much lower pitch for attack sounds
                pain: 0.4,    // Much lower pitch for pain sounds
                death: 0.4    // Much lower pitch for death sounds
            }
        };
    }
    
    /**
     * Add zombies to the scene
     * @param {THREE.Scene} scene - Scene to add zombies to
     */
    addToScene(scene) {
        for (const zombie of this.zombies) {
            scene.add(zombie);
        }
    }
    
    /**
     * Get all zombies
     * @returns {Array} Array of zombie objects
     */
    getZombies() {
        return this.zombies;
    }
    
    /**
     * Create a Minecraft-style zombie at the given position
     * @param {number} x - X position
     * @param {number} z - Z position
     * @param {string} type - Type of zombie: 'regular' or 'tank'
     * @returns {THREE.Group} The created zombie
     */
    createZombie(x, z, type = 'regular') {
        // Get zombie params based on type
        const params = type === 'tank' ? this.TANK_ZOMBIE : this.REGULAR_ZOMBIE;
        
        const zombie = new THREE.Group();
        
        // Zombie color palette
        const zombieSkinColor = params.skinColor;
        const zombieEyeColor = params.eyeColor;
        const zombieClothesColor = params.clothesColor;
        
        // Store original colors for flashing effect
        zombie.userData = {
            originalColors: {
                skin: zombieSkinColor,
                clothes: zombieClothesColor,
                eyes: zombieEyeColor,
                mouth: 0x000000
            },
            materials: {}
        };
        
        // Head (slightly rectangular for Minecraft style)
        const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: zombieSkinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8; // Position head on top of body
        zombie.add(head);
        
        // Store material references for damage flash effect
        zombie.userData.materials.head = headMaterial;
        
        // Create face group and attach it to the head
        const face = new THREE.Group();
        head.add(face);
        
        // Eyes positioned relative to the face group
        const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: zombieEyeColor, 
            emissive: zombieEyeColor, 
            emissiveIntensity: 0.5 
        });
        
        // Left eye positioned relative to the face
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0, 0.45);
        face.add(leftEye);
        
        // Right eye positioned relative to the face
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
        rightEye.position.set(0.2, 0, 0.45);
        face.add(rightEye);
        
        // Store eye materials
        zombie.userData.materials.leftEye = eyeMaterial;
        zombie.userData.materials.rightEye = rightEye.material;
        
        // Mouth positioned relative to the face
        const mouthGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.2, 0.45);
        face.add(mouth);
        
        // Store mouth material
        zombie.userData.materials.mouth = mouthMaterial;
        
        // Store head reference for animation
        zombie.userData.head = head;
        
        // Body (rectangular for Minecraft style)
        const bodyGeometry = new THREE.BoxGeometry(0.9, 1.2, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: zombieClothesColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.0; // Position body above ground
        zombie.add(body);
        
        // Store body material for damage flash
        zombie.userData.materials.body = bodyMaterial;
        
        // Create and add limbs
        this.createZombieLimbs(zombie, zombieSkinColor, zombieClothesColor);
        
        // Set zombie position
        zombie.position.set(x, 0, z);
        
        // Apply scaling for different zombie types
        zombie.scale.set(params.scale, params.scale, params.scale);
        
        // Add zombie data for game logic
        zombie.userData = {
            ...zombie.userData, // Preserve existing properties
            type: 'zombie',
            zombieType: type, // Additional property to identify zombie type
            health: params.health,
            speed: params.speed,
            damage: params.damage,
            isWalking: true, // Default to walking
            walkTime: Math.random() * Math.PI * 2, // Randomize starting walk phase
            walkSpeed: 3.5, // Fixed walk speed for animation
            radius: 0.5 * params.scale, // Collision radius adjusted for scale
            attackRange: 1.2 * params.scale, // Attack range adjusted for scale
            hitRange: 2.5 * params.scale, // Slightly larger than attack range
            attackCooldown: 1, // Time between attacks
            lastAttackTime: 0,
            lastSoundTime: 0,
            soundCooldown: 5 + Math.random() * 10, // 5-15 seconds
            soundPitch: params.soundPitch, // Sound pitch settings for different sound types
            sound: null, // Will be initialized when first needed
            attackSound: null,
            painSound: null,
            deathSound: null,
            leftStepSound: null,
            rightStepSound: null,
            isHit: false,
            hitFlashDuration: 0.2,
            hitFlashTime: 0,
            isDead: false,
            deathAnimationProgress: 0,
            deathAnimationDuration: 1.5,
            // Simplified state management - only chase and attack
            state: 'chase', // Only chase and attack states remain
            avoidanceTime: 0, // Timer for obstacle avoidance behavior
            isAvoidingObstacle: false, // Whether currently avoiding an obstacle
            avoidanceDirection: new THREE.Vector3(), // Direction to avoid obstacles
            obstacleDetectionRange: 2.0, // How far to check for obstacles
            pathfindCooldown: 0 // Cooldown for pathfinding calculations
        };
        
        // Add to zombies array
        this.zombies.push(zombie);
        
        return zombie;
    }
    
    /**
     * Create limbs for a zombie
     * @param {THREE.Group} zombie - Zombie to add limbs to
     * @param {number} skinColor - Color for skin
     * @param {number} clothesColor - Color for clothes
     */
    createZombieLimbs(zombie, skinColor, clothesColor) {
        // Arms - Create arm containers for proper positioning
        // Left arm container
        const leftArmContainer = new THREE.Group();
        leftArmContainer.position.set(-0.65, 1.5, 0); // Position at shoulder height
        zombie.add(leftArmContainer);
        
        // Left arm mesh
        const armGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.4);
        const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.y = -0.5; // Center the arm on its pivot point
        leftArmContainer.add(leftArm);
        zombie.userData.leftArm = leftArmContainer; // Reference for animation
        
        // Store arm material for damage flash
        zombie.userData.materials.leftArm = armMaterial;
        
        // Right arm container
        const rightArmContainer = new THREE.Group();
        rightArmContainer.position.set(0.65, 1.5, 0); // Position at shoulder height
        zombie.add(rightArmContainer);
        
        // Right arm mesh
        const rightArm = new THREE.Mesh(armGeometry, armMaterial.clone());
        rightArm.position.y = -0.5; // Center the arm on its pivot point
        rightArmContainer.add(rightArm);
        zombie.userData.rightArm = rightArmContainer; // Reference for animation
        
        // Store right arm material for damage flash
        zombie.userData.materials.rightArm = rightArm.material;
        
        // Legs - Create leg containers for proper positioning
        // Left leg container
        const leftLegContainer = new THREE.Group();
        leftLegContainer.position.set(-0.25, 0.5, 0); // Position at hip height
        zombie.add(leftLegContainer);
        
        // Left leg mesh
        const legGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({ color: clothesColor });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.y = -0.5; // Center the leg on its pivot point
        leftLegContainer.add(leftLeg);
        zombie.userData.leftLeg = leftLegContainer; // Reference for animation
        
        // Store leg material for damage flash
        zombie.userData.materials.leftLeg = legMaterial;
        
        // Right leg container
        const rightLegContainer = new THREE.Group();
        rightLegContainer.position.set(0.25, 0.5, 0); // Position at hip height
        zombie.add(rightLegContainer);
        
        // Right leg mesh
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial.clone());
        rightLeg.position.y = -0.5; // Center the leg on its pivot point
        rightLegContainer.add(rightLeg);
        zombie.userData.rightLeg = rightLegContainer; // Reference for animation
        
        // Store right leg material for damage flash
        zombie.userData.materials.rightLeg = rightLeg.material;
    }
    
    /**
     * Spawn initial zombies
     * @param {number} count - Number of zombies to spawn
     */
    spawnInitialZombies(count) {
        for (let i = 0; i < count; i++) {
            const position = this.getRandomSpawnPosition(50, 80); // Spawn 50-80 units away
            
            // Create a tank zombie for approximately 1/4 of zombies
            if (Math.random() < 0.25) {
                this.createTankZombie(position.x, position.z);
            } else {
                this.createZombie(position.x, position.z);
            }
        }
    }
    
    /**
     * Get random spawn position that doesn't collide with obstacles
     * @param {number} minDistance - Minimum distance from player
     * @param {number} maxDistance - Maximum distance from player
     * @returns {Object} Position { x, z }
     */
    getRandomSpawnPosition(minDistance, maxDistance) {
        let position = null;
        let attempts = 0;
        const maxAttempts = 50; // Prevent infinite loops
        
        while (!position && attempts < maxAttempts) {
            // Get random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            
            // Calculate position
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Check if position is valid (not too close to other zombies)
            let isValid = true;
            
            for (const zombie of this.zombies) {
                const dx = x - zombie.position.x;
                const dz = z - zombie.position.z;
                const distToZombie = Math.sqrt(dx * dx + dz * dz);
                
                // Keep a minimum distance from other zombies
                if (distToZombie < 3) {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) {
                position = { x, z };
            }
            
            attempts++;
        }
        
        // If we couldn't find a good position after max attempts, just return a random one
        if (!position) {
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            position = {
                x: Math.cos(angle) * distance,
                z: Math.sin(angle) * distance
            };
        }
        
        return position;
    }
    
    /**
     * Check if a zombie is in front of the player and in hit range
     * @param {THREE.Camera} camera - Player camera for position/direction
     * @returns {THREE.Group} The hit zombie or null if none hit
     */
    checkZombieHit(camera) {
        // Get player's forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        
        // Normalize to get a unit vector
        forward.normalize();
        
        let hitZombie = null;
        let closestDistance = Infinity;
        
        // Check each zombie
        for (const zombie of this.zombies) {
            // Skip dead zombies
            if (zombie.userData.isDead) continue;
            
            // Vector from player to zombie
            const dx = zombie.position.x - camera.position.x;
            const dy = zombie.position.y + 1.0 - camera.position.y; // Aim at zombie's center
            const dz = zombie.position.z - camera.position.z;
            
            // Distance to zombie
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Check if zombie is within hit range
            if (distance <= zombie.userData.hitRange) {
                // Normalize direction to zombie
                const direction = new THREE.Vector3(dx, dy, dz).normalize();
                
                // Calculate dot product to determine if zombie is in front of player
                const dotProduct = forward.dot(direction);
                
                // If dot product is positive and above threshold, zombie is in front of player
                // Higher threshold means a narrower cone in front of the player
                const hitThreshold = 0.7; // Approximately 45 degree cone
                
                if (dotProduct > hitThreshold && distance < closestDistance) {
                    hitZombie = zombie;
                    closestDistance = distance;
                }
            }
        }
        
        return hitZombie;
    }
    
    /**
     * Apply damage to a zombie and handle hit effects
     * @param {THREE.Group} zombie - Zombie to damage
     * @param {number} damage - Amount of damage to apply
     * @param {THREE.Camera} camera - Player camera for hit effects
     * @returns {boolean} Whether the zombie was killed
     */
    damageZombie(zombie, damage, camera) {
        // Apply damage
        zombie.userData.health -= damage;
        
        // Set hit flash effect
        zombie.userData.isHit = true;
        zombie.userData.hitFlashTime = 0;
        
        // Apply red color to all zombie parts
        for (const [part, material] of Object.entries(zombie.userData.materials)) {
            material.color.setHex(0xff0000); // Set to red
            // Special handling for eyes - make them glow more brightly
            if (part.includes('Eye')) {
                material.emissive.setHex(0xff0000); // Bright red glow
                material.emissiveIntensity = 1.0; // Full intensity
            } else {
                material.emissive.setHex(0x330000); // Add slight glow to other parts
                material.emissiveIntensity = 0.5;
            }
        }
        
        // Create a direction vector from player to zombie (for particle direction)
        const hitDirection = new THREE.Vector3(
            zombie.position.x - camera.position.x,
            0, // Keep it flat on xz plane
            zombie.position.z - camera.position.z
        );
        
        // Spawn blood particles at zombie position with direction towards player
        this.particleSystem.spawnBloodParticles(zombie.position, hitDirection);
        
        // Handle death
        if (zombie.userData.health <= 0) {
            // Set death state
            zombie.userData.isDead = true;
            zombie.userData.deathAnimationProgress = 0;
            
            // Initialize death sound if not already present
            if (!zombie.userData.deathSound) {
                zombie.userData.deathSound = this.audioManager.createZombieDeathSound();
            }
            
            // Get the death pitch from the zombie's sound pitch settings
            const pitch = zombie.userData.soundPitch.death;
            
            // Play the death sound at zombie position with death pitch
            this.audioManager.playPositionedSound(
                zombie.userData.deathSound, 
                zombie.position, 
                camera.position, 
                camera.quaternion, 
                0.8,
                pitch // Pass the death pitch value
            );
            
            // Remove from zombies array for collision detection after death animation
            const zombieIndex = this.zombies.indexOf(zombie);
            if (zombieIndex !== -1) {
                // We will keep the zombie in the array but mark it as dead
                // It will be removed later after death animation completes
            }
        } else {
            // Play a pain sound instead of attack sound for hit reaction
            if (!zombie.userData.painSound) {
                zombie.userData.painSound = this.audioManager.createZombiePainSound();
            }
            
            // Get the pain pitch from the zombie's sound pitch settings
            const pitch = zombie.userData.soundPitch.pain;
            
            // Play hit reaction sound with pain pitch
            this.audioManager.playPositionedSound(
                zombie.userData.painSound, 
                zombie.position, 
                camera.position, 
                camera.quaternion, 
                0.6,
                pitch // Pass the pain pitch value
            );
        }
        
        // Return true if zombie is killed
        return zombie.userData.health <= 0;
    }
    
    /**
     * Update all zombies
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Camera} camera - Player camera
     * @param {PlayerController} player - Player controller
     */
    update(deltaTime, camera, player) {
        // Update hit flash effects
        this.updateZombieHitEffects(deltaTime);
        
        // Get obstacles for collision avoidance
        const obstacles = player.getObstacles();
        
        // Update zombie AI and animations
        for (const zombie of this.zombies) {
            // Skip AI update for dead zombies
            if (zombie.userData.isDead) {
                // Update death animation
                this.updateZombieDeathAnimation(zombie, deltaTime);
            } else {
                // Update AI for living zombies
                this.updateZombieAI(zombie, deltaTime, camera, player, obstacles);
            }
        }
        
        // Remove dead zombies that have completed death animation
        this.removeDeadZombies();
    }
    
    /**
     * Update zombie hit flash effects
     * @param {number} deltaTime - Time since last update
     */
    updateZombieHitEffects(deltaTime) {
        for (const zombie of this.zombies) {
            if (zombie.userData.isHit) {
                zombie.userData.hitFlashTime += deltaTime;
                
                // Check if hit flash duration is over
                if (zombie.userData.hitFlashTime >= zombie.userData.hitFlashDuration) {
                    // Reset hit state
                    zombie.userData.isHit = false;
                    
                    // Restore original colors if zombie is still alive
                    if (zombie.userData.health > 0) {
                        for (const [part, material] of Object.entries(zombie.userData.materials)) {
                            if (part.includes('Arm') || part === 'head') {
                                // Skin color for arms and head
                                material.color.setHex(zombie.userData.originalColors.skin);
                            } else if (part.includes('Eye')) {
                                // Eye color
                                material.color.setHex(zombie.userData.originalColors.eyes);
                                material.emissive.setHex(zombie.userData.originalColors.eyes);
                                material.emissiveIntensity = 0.5; // Default eye glow
                            } else if (part === 'mouth') {
                                // Mouth color
                                material.color.setHex(zombie.userData.originalColors.mouth);
                                material.emissive.setHex(0x000000);
                                material.emissiveIntensity = 0;
                            } else {
                                // Clothes color for body and legs
                                material.color.setHex(zombie.userData.originalColors.clothes);
                                material.emissive.setHex(0x000000);
                                material.emissiveIntensity = 0;
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Update a single zombie's AI and movement
     * @param {THREE.Group} zombie - Zombie to update
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Camera} camera - Player camera for position
     * @param {PlayerController} player - Player controller for damage
     */
    updateZombieAI(zombie, deltaTime, camera, player, obstacles) {
        // Skip AI update if zombie is dead
        if (zombie.userData.isDead) return;
        
        // Update animation timers
        zombie.userData.walkTime += deltaTime;
        const walkTime = zombie.userData.walkTime;
        
        // Calculate distance to player
        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
        
        // Update pathfinding cooldown
        zombie.userData.pathfindCooldown -= deltaTime;
        zombie.userData.avoidanceTime -= deltaTime;
        
        // Simplified state machine - only chase and attack
        if (distanceToPlayer <= zombie.userData.attackRange) {
            // Handle attack state
            this.handleAttackState(zombie, deltaTime, player, camera);
        } else {
            // Handle chase state
            this.handleChaseState(zombie, deltaTime, camera, obstacles);
        }
        
        // Head slow rotation (looking around) - continues regardless of state
        if (zombie.userData.head) {
            zombie.userData.head.rotation.y = Math.sin(walkTime * 0.5) * 0.2;
        }
        
        // Update sound timer
        zombie.userData.lastSoundTime += deltaTime;
        
        // Randomly play zombie sounds based on cooldown
        if (zombie.userData.lastSoundTime >= zombie.userData.soundCooldown) {
            this.playZombieSound(zombie, camera);
            zombie.userData.lastSoundTime = 0;
            zombie.userData.soundCooldown = 5 + Math.random() * 10; // 5-15 seconds
        }
    }
    
    /**
     * Handle zombie in chase state
     * @param {THREE.Group} zombie - The zombie to update
     * @param {number} deltaTime - Time since last update
     * @param {THREE.Camera} camera - Player camera
     * @param {Array} obstacles - Array of obstacles for collision avoidance
     */
    handleChaseState(zombie, deltaTime, camera, obstacles) {
        // Always move toward player - no line of sight needed
        const targetPosition = camera.position;
        
        // Check for and avoid obstacles
        const moveDirection = this.getAvoidanceDirection(zombie, targetPosition, obstacles, deltaTime);
        
        // Move in calculated direction
        const speed = zombie.userData.speed * deltaTime;
        zombie.position.x += moveDirection.x * speed;
        zombie.position.z += moveDirection.z * speed;
        
        // Face in the movement direction
        if (moveDirection.lengthSq() > 0.01) {
            const angle = Math.atan2(moveDirection.x, moveDirection.z);
            zombie.rotation.y = angle;
        }
        
        // Walking animation with chase speed
        this.updateZombieWalkingAnimation(zombie, zombie.userData.walkTime, zombie.userData.speed * deltaTime);
    }
    
    /**
     * Handle zombie in attack state
     * @param {THREE.Group} zombie - The zombie to update
     * @param {number} deltaTime - Time since last update
     * @param {Object} player - Player object
     * @param {THREE.Camera} camera - Player camera
     */
    handleAttackState(zombie, deltaTime, player, camera) {
        // Make zombie face the player
        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;
        if (dx !== 0 || dz !== 0) {
            const angle = Math.atan2(dx, dz);
            zombie.rotation.y = angle;
        }
        
        // Handle attack
        this.updateZombieAttack(zombie, deltaTime, player, camera);
    }
    
    /**
     * Update zombie walking animation
     * @param {THREE.Group} zombie - Zombie to animate
     * @param {number} walkTime - Current walk cycle time
     * @param {number} speedFactor - Speed factor for animation
     */
    updateZombieWalkingAnimation(zombie, walkTime, speedFactor) {
        // Basic body bobbing animation for walking
        const walkOffset = Math.sin(walkTime * 3.5) * 0.1;
        zombie.position.y = walkOffset;
        
        // Arm swing animation for walking
        if (zombie.userData.leftArm && zombie.userData.rightArm) {
            // Opposite arm swings with negated sine to swing forward correctly
            zombie.userData.leftArm.rotation.x = -Math.sin(walkTime * 3.5) * 0.4;
            zombie.userData.rightArm.rotation.x = -Math.sin(walkTime * 3.5 + Math.PI) * 0.4;
        }
        
        // Leg swing animation for walking
        if (zombie.userData.leftLeg && zombie.userData.rightLeg) {
            // Opposite leg swings
            zombie.userData.leftLeg.rotation.x = Math.sin(walkTime * 3.5) * 0.4;
            zombie.userData.rightLeg.rotation.x = Math.sin(walkTime * 3.5 + Math.PI) * 0.4;
        }
    }
    
    /**
     * Update zombie attack animation and logic
     * @param {THREE.Group} zombie - Zombie to animate
     * @param {number} deltaTime - Time since last update
     * @param {PlayerController} player - Player controller for damage
     * @param {THREE.Camera} camera - Player camera for position
     */
    updateZombieAttack(zombie, deltaTime, player, camera) {
        // Reset walking height
        zombie.position.y = 0;
        
        // Check if zombie can attack (cooldown finished)
        const currentTime = performance.now() / 1000; // Convert to seconds
        if (currentTime - zombie.userData.lastAttackTime >= zombie.userData.attackCooldown) {
            // Start attack animation
            zombie.userData.attackProgress = 0;
            zombie.userData.isCurrentlyAttacking = true;
            zombie.userData.lastAttackTime = currentTime;
            
            // Initialize attack sound if not already present
            if (!zombie.userData.attackSound) {
                zombie.userData.attackSound = this.audioManager.createZombieAttackSound();
            }
            
            // Get the attack pitch from the zombie's sound pitch settings
            const pitch = zombie.userData.soundPitch.attack;
            
            // Play the attack sound with attack pitch
            this.audioManager.playPositionedSound(
                zombie.userData.attackSound,
                zombie.position,
                camera.position,
                camera.quaternion,
                0.7,
                pitch // Pass the attack pitch value
            );
            
            // Damage player when attack connects
            player.takeDamage(zombie.userData.damage);
        }
        
        // Process attack animation
        if (zombie.userData.isCurrentlyAttacking) {
            zombie.userData.attackProgress += deltaTime * 5; // Control attack animation speed
            
            // Arms attack animation - both arms swing forward together
            if (zombie.userData.leftArm && zombie.userData.rightArm) {
                // Create a quick forward swing followed by slower return
                const attackPhase = Math.min(1, zombie.userData.attackProgress);
                // Negative value for forward swing (toward player)
                const swingForward = -Math.sin(attackPhase * Math.PI) * 1.2;
                
                // Apply the animation to both arms
                zombie.userData.leftArm.rotation.x = swingForward;
                zombie.userData.rightArm.rotation.x = swingForward;
            }
            
            // End attack animation after completion
            if (zombie.userData.attackProgress >= 1) {
                zombie.userData.isCurrentlyAttacking = false;
            }
        } else {
            // Idle pose between attacks - arms slightly raised and forward
            if (zombie.userData.leftArm && zombie.userData.rightArm) {
                zombie.userData.leftArm.rotation.x = -0.3; // Negative value for forward position
                zombie.userData.rightArm.rotation.x = -0.3; // Negative value for forward position
            }
        }
        
        // Reset leg position during attack
        if (zombie.userData.leftLeg && zombie.userData.rightLeg) {
            zombie.userData.leftLeg.rotation.x = 0;
            zombie.userData.rightLeg.rotation.x = 0;
        }
    }
    
    /**
     * Update zombie death animation
     * @param {THREE.Group} zombie - Zombie to animate
     * @param {number} deltaTime - Time since last update
     */
    updateZombieDeathAnimation(zombie, deltaTime) {
        // Progress the death animation
        zombie.userData.deathAnimationProgress += deltaTime / zombie.userData.deathAnimationDuration;
        const progress = Math.min(1.0, zombie.userData.deathAnimationProgress);
        
        // Calculate animation curves
        const fallCurve = Math.sin(progress * Math.PI / 2); // Starts fast, slows at end
        const rotationCurve = Math.sin(progress * Math.PI); // Smooth start and end
        
        // Fall to the ground - rotate the entire zombie
        zombie.rotation.x = fallCurve * Math.PI / 2; // Fall forward 90 degrees
        
        // Slight twist as it falls
        zombie.rotation.z = rotationCurve * 0.2;
        
        // Sink slightly into the ground at the end
        zombie.position.y = -fallCurve * 0.2;
        
        // Arms flail outward during death
        if (zombie.userData.leftArm && zombie.userData.rightArm) {
            zombie.userData.leftArm.rotation.x = -fallCurve * Math.PI / 2; // Arms spread out
            zombie.userData.rightArm.rotation.x = -fallCurve * Math.PI / 2;
        }
        
        // Legs collapse
        if (zombie.userData.leftLeg && zombie.userData.rightLeg) {
            zombie.userData.leftLeg.rotation.x = fallCurve * Math.PI / 4;  // Legs bend a bit
            zombie.userData.rightLeg.rotation.x = fallCurve * Math.PI / 4;
        }
    }
    
    /**
     * Play zombie sound
     * @param {THREE.Group} zombie - Zombie to play sound for
     * @param {THREE.Camera} camera - Player camera for position
     */
    playZombieSound(zombie, camera) {
        // Initialize sound if not already present
        if (!zombie.userData.sound) {
            zombie.userData.sound = this.audioManager.createZombieSound();
        }
        
        // Get the groan pitch from the zombie's sound pitch settings
        const pitch = zombie.userData.soundPitch.groan;
        
        // Play the sound at the zombie's position with the groan pitch
        this.audioManager.playPositionedSound(
            zombie.userData.sound,
            zombie.position,
            camera.position,
            camera.quaternion,
            0.5,
            pitch // Pass the groan pitch value
        );
    }
    
    /**
     * Remove dead zombies that have completed death animation
     */
    removeDeadZombies() {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            if (zombie.userData.isDead && zombie.userData.deathAnimationProgress >= 1.0) {
                // Get the scene and remove the zombie
                if (zombie.parent) {
                    zombie.parent.remove(zombie);
                }
                // Remove from zombies array
                this.zombies.splice(i, 1);
            }
        }
    }
    
    /**
     * Calculate movement direction with obstacle avoidance
     * @param {THREE.Group} zombie - The zombie to move
     * @param {THREE.Vector3} targetPos - Target position
     * @param {Array} obstacles - Array of obstacles to avoid
     * @param {number} deltaTime - Time since last update
     * @returns {THREE.Vector3} Direction to move
     */
    getAvoidanceDirection(zombie, targetPos, obstacles, deltaTime) {
        // If zombie is already avoiding an obstacle, continue in that direction for a bit
        if (zombie.userData.isAvoidingObstacle && zombie.userData.avoidanceTime > 0) {
            return zombie.userData.avoidanceDirection;
        }
        
        // Calculate base direction to target
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, zombie.position);
        direction.y = 0; // Keep movement flat on ground
        
        if (direction.lengthSq() === 0) {
            return direction;
        }
        
        // Normalize direction
        direction.normalize();
        
        // Use distance-based throttling for obstacle checks
        if (zombie.userData.pathfindCooldown > 0) {
            return direction;
        }
        
        // Set a cooldown to limit how often we check for obstacles
        zombie.userData.pathfindCooldown = 0.1; // Check 10 times per second
        
        // Check for obstacles in the path
        const obstacleDetectionRange = zombie.userData.obstacleDetectionRange;
        let closestObstacle = null;
        let closestDistance = obstacleDetectionRange;
        
        // Only check the closest few obstacles for performance
        let checkedCount = 0;
        
        for (const obstacle of obstacles) {
            // Skip if not an obstacle or missing position or radius
            if (!obstacle.position || !obstacle.userData || !obstacle.userData.radius) continue;
            
            // Calculate vector to obstacle
            const dx = obstacle.position.x - zombie.position.x;
            const dz = obstacle.position.z - zombie.position.z;
            const distSquared = dx * dx + dz * dz;
            
            // Skip if too far away
            if (distSquared > obstacleDetectionRange * obstacleDetectionRange) continue;
            
            // Get distance to obstacle
            const distance = Math.sqrt(distSquared);
            
            // Calculate direction to obstacle
            const toObstacle = new THREE.Vector3(dx, 0, dz).normalize();
            
            // Calculate dot product to see if obstacle is in front of zombie
            const dotProduct = direction.dot(toObstacle);
            
            // Skip if obstacle is behind or too far to sides (not in path)
            if (dotProduct < 0.5) continue;
            
            // Check if this is the closest obstacle in path
            if (distance < closestDistance) {
                closestDistance = distance;
                closestObstacle = obstacle;
            }
            
            // Limit the number of obstacles we check for performance
            checkedCount++;
            if (checkedCount >= 5) break;
        }
        
        // If no obstacles in path, return original direction
        if (!closestObstacle) {
            zombie.userData.isAvoidingObstacle = false;
            return direction;
        }
        
        // Calculate avoidance direction
        const avoidanceDir = new THREE.Vector3();
        
        // Vector from zombie to obstacle
        const toObstacle = new THREE.Vector3();
        toObstacle.subVectors(closestObstacle.position, zombie.position);
        toObstacle.y = 0;
        toObstacle.normalize();
        
        // Calculate perpendicular directions (left and right of obstacle)
        const perpLeft = new THREE.Vector3(-toObstacle.z, 0, toObstacle.x);
        const perpRight = new THREE.Vector3(toObstacle.z, 0, -toObstacle.x);
        
        // Choose the direction that's closer to our target
        const dotLeft = perpLeft.dot(direction);
        const dotRight = perpRight.dot(direction);
        
        // Use the better direction
        avoidanceDir.copy(dotLeft > dotRight ? perpLeft : perpRight);
        
        // Set avoidance state
        zombie.userData.isAvoidingObstacle = true;
        zombie.userData.avoidanceTime = 0.3 + Math.random() * 0.2; // Short avoidance time
        zombie.userData.avoidanceDirection.copy(avoidanceDir);
        
        return avoidanceDir;
    }
    
    /**
     * Add obstacles for pathfinding and line of sight detection
     * @param {Array} newObstacles - Array of obstacles to add
     */
    addObstacles(newObstacles) {
        if (Array.isArray(newObstacles)) {
            this.obstacles = [...this.obstacles, ...newObstacles];
        }
    }
    
    /**
     * Create a tank zombie (larger, tougher variant)
     * @param {number} x - X position
     * @param {number} z - Z position
     * @returns {THREE.Group} The created tank zombie
     */
    createTankZombie(x, z) {
        return this.createZombie(x, z, 'tank');
    }
}