import * as THREE from 'three';

/**
 * Player controller
 * Handles player movement, camera controls, and collision detection
 */
export class PlayerController {
    constructor(gameState, audioManager) {
        this.gameState = gameState;
        this.audioManager = audioManager;
        
        // Movement constants
        this.MOVEMENT_SPEED = 5;
        this.PLAYER_HEIGHT = 1.7;
        this.MOUSE_SENSITIVITY = 0.0015;
        
        // Create player camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, this.PLAYER_HEIGHT, 0);
        
        // Player state
        this.health = 100;
        this.yaw = 0;
        this.pitch = 0;
        this.obstacles = [];
        
        // Headbob animation state
        this.camera.userData = {
            headbobTime: 0,
            lastStepTime: 0,
            originalHeight: this.camera.position.y,
        };
    }
    
    /**
     * Setup pointer lock for mouse controls
     * @param {HTMLElement} element - Element to request pointer lock on
     */
    setupPointerLock(element) {
        element.addEventListener('click', () => {
            element.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === element) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });
    }
    
    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse movement event
     */
    onMouseMove(event) {
        this.yaw -= event.movementX * this.MOUSE_SENSITIVITY;
        this.pitch -= event.movementY * this.MOUSE_SENSITIVITY;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        
        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    /**
     * Add obstacles for collision detection
     * @param {Array} newObstacles - Array of obstacles to add
     */
    addObstacles(newObstacles) {
        if (Array.isArray(newObstacles)) {
            this.obstacles = [...this.obstacles, ...newObstacles];
        }
    }
    
    /**
     * Set zombie obstacles for collision detection - replaces any previous zombie obstacles
     * @param {Array} zombies - Array of zombie obstacles
     */
    setZombieObstacles(zombies) {
        // Filter out existing zombie obstacles
        this.obstacles = this.obstacles.filter(obstacle => 
            !obstacle.userData || obstacle.userData.type !== 'zombie'
        );
        
        // Add the current zombies
        if (Array.isArray(zombies)) {
            this.obstacles = [...this.obstacles, ...zombies];
        }
    }
    
    /**
     * Check collision with obstacles
     * @param {number} newX - New X position
     * @param {number} newZ - New Z position
     * @returns {boolean} Whether a collision would occur
     */
    checkCollision(newX, newZ) {
        const playerRadius = 0.3;
        
        for (const obstacle of this.obstacles) {
            // Skip if no userData or radius
            if (!obstacle.userData || !obstacle.userData.radius) continue;
            
            const dx = newX - obstacle.position.x;
            const dz = newZ - obstacle.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < (playerRadius + obstacle.userData.radius)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Update player state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        const keys = this.gameState.getKeys();
        const speed = this.MOVEMENT_SPEED * deltaTime;
        const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        
        // Track if player is moving for headbob
        const isMoving = moveX !== 0 || moveZ !== 0;
        
        // Update headbob animation
        this.updateHeadbob(deltaTime, isMoving);

        if (moveX !== 0 || moveZ !== 0) {
            // Get camera's forward and right vectors
            const forward = new THREE.Vector3(0, 0, -1);
            const right = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(this.camera.quaternion);
            right.applyQuaternion(this.camera.quaternion);
            
            // Zero out Y component to keep movement horizontal
            forward.y = 0;
            right.y = 0;
            forward.normalize();
            right.normalize();
            
            // Calculate movement direction
            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, -moveZ); // Forward/backward
            moveDirection.addScaledVector(right, moveX);    // Strafe left/right
            
            // Normalize for consistent speed in all directions
            if (moveDirection.lengthSq() > 0) {
                moveDirection.normalize();
                
                // Calculate new position
                const newX = this.camera.position.x + moveDirection.x * speed;
                const newZ = this.camera.position.z + moveDirection.z * speed;
                
                // Update position if no collision
                if (!this.checkCollision(newX, newZ)) {
                    this.camera.position.x = newX;
                    this.camera.position.z = newZ;
                }
            }
        }
    }
    
    /**
     * Update headbob animation
     * @param {number} deltaTime - Time since last update
     * @param {boolean} isMoving - Whether the player is moving
     */
    updateHeadbob(deltaTime, isMoving) {
        if (isMoving) {
            // Calculate step frequency based on movement speed
            const stepFrequency = 8; // Higher value means faster/more frequent steps
            
            // Increment headbob time when moving
            this.camera.userData.headbobTime += deltaTime * stepFrequency;
            
            // Apply headbob effect
            const bobAmount = 0.02; // Vertical bob amount
            const swayAmount = 0.008; // Horizontal sway amount
            
            // Vertical bobbing
            const verticalBob = Math.sin(this.camera.userData.headbobTime) * bobAmount;
            this.camera.position.y = this.camera.userData.originalHeight + verticalBob;
            
            // Slight camera roll (left/right tilt) based on stepping
            const horizontalBob = Math.cos(this.camera.userData.headbobTime * 2) * swayAmount;
            this.camera.rotation.z = horizontalBob;
            
            // Check for step sounds
            const prevSine = Math.sin(this.camera.userData.headbobTime - deltaTime * stepFrequency);
            const currSine = Math.sin(this.camera.userData.headbobTime);
            const currentTime = performance.now() / 1000;
            
            if (prevSine > 0 && currSine <= 0) {
                this.audioManager.playStepSound(0.9 + Math.random() * 0.2);
            } 
            else if (prevSine < 0 && currSine >= 0) {
                this.audioManager.playStepSound(0.85 + Math.random() * 0.2);
            }
        } else {
            // Reset to original height when not moving
            this.camera.position.y = this.camera.userData.originalHeight;
            this.camera.rotation.z = 0;
        }
    }
    
    /**
     * Get the player's camera
     * @returns {THREE.PerspectiveCamera} Player camera
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Update camera aspect ratio
     * @param {number} aspect - New aspect ratio
     */
    updateAspect(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * Apply damage to the player
     * @param {number} amount - Amount of damage to apply
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }
    
    /**
     * Get player's current health
     * @returns {number} Current health
     */
    getHealth() {
        return this.health;
    }
    
    /**
     * Check if player is dead
     * @returns {boolean} Whether player is dead
     */
    isDead() {
        return this.health <= 0;
    }
    
    /**
     * Get the obstacles array
     * @returns {Array} Array of obstacles
     */
    getObstacles() {
        return this.obstacles;
    }
} 