import * as THREE from 'three';

/**
 * Weapon System
 * Handles weapon creation, switching, and combat mechanics
 */
export class WeaponSystem {
    constructor(audioManager, particleSystem) {
        this.audioManager = audioManager;
        this.particleSystem = particleSystem;
        
        // Weapon holder for first-person view
        this.weaponHolder = new THREE.Group();
        
        // Current weapon state
        this.currentWeapon = 'Combat Knife';
        this.knife = null;
        
        // Animation state
        this.isSlashing = false;
        this.slashProgress = 0;
        this.SLASH_DURATION = 0.2; // Faster, snappier for Minecraft style
        this.THRUST_DISTANCE = 0.15; // Shorter distance for smaller knife
        this.SWING_RADIUS = 0.25; // Adjusted swing radius
        
        // Create weapons
        this.createWeapons();
        
        // Setup event listeners for attacks
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
    }
    
    /**
     * Create all available weapons
     */
    createWeapons() {
        this.knife = this.createDetailedKnife();
        this.weaponHolder.add(this.knife);
    }
    
    /**
     * Create a detailed Minecraft-style knife
     * @returns {THREE.Group} Knife mesh group
     */
    createDetailedKnife() {
        const knifeGroup = new THREE.Group();
        
        // Skip loading attempts and directly create a geometry-based knife
        this.createGeometryBasedKnife(knifeGroup);
        
        return knifeGroup;
    }
    
    /**
     * Create a knife using primitive geometries
     * @param {THREE.Group} knifeGroup - Group to add knife parts to
     * @returns {THREE.Group} The updated knife group
     */
    createGeometryBasedKnife(knifeGroup) {
        console.log("Creating flat pixelated Minecraft-style knife");
        
        // Color palette for Minecraft style knife - using simple flat colors
        const bladeMetal = 0xaaaaaa; // Flat medium gray for blade
        const handleColor = 0x333333; // Dark gray for handle
        const guardColor = 0x111111; // Nearly black for guard/hilt

        // Create blade - more blocky and pixelated for Minecraft style
        const bladeGroup = new THREE.Group();
        
        // Create a smaller blade with shorter height (about half the size)
        const mainBladeGeometry = new THREE.BoxGeometry(0.03, 0.23, 0.06);
        const mainBladeMaterial = new THREE.MeshLambertMaterial({
            color: bladeMetal,
            // Completely flat, no shine or metalness
            emissive: 0x111111,
            emissiveIntensity: 0.05
        });
        const mainBlade = new THREE.Mesh(mainBladeGeometry, mainBladeMaterial);
        mainBlade.position.y = 0.115; // Position relative to blade group
        bladeGroup.add(mainBlade);
        
        // Blade tip - pixelated point
        const tipGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.06);
        const tipMaterial = new THREE.MeshLambertMaterial({
            color: bladeMetal,
            emissive: 0x111111,
            emissiveIntensity: 0.05
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.y = 0.245; // Position at top of blade
        bladeGroup.add(tip);
        
        // Blade tip point - smallest pixel at top
        const pointGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.04);
        const point = new THREE.Mesh(pointGeometry, tipMaterial);
        point.position.y = 0.27; // Position at very top
        bladeGroup.add(point);
        
        // Guard (crossguard) - smaller and more pixelated
        const guardGeometry = new THREE.BoxGeometry(0.09, 0.03, 0.09);
        const guardMaterial = new THREE.MeshLambertMaterial({
            color: guardColor
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = -0.02; // Position below blade
        bladeGroup.add(guard);
        
        // Handle - shortened and more pixelated
        const handleGeometry = new THREE.BoxGeometry(0.04, 0.2, 0.04);
        const handleMaterial = new THREE.MeshLambertMaterial({
            color: handleColor
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.125; // Position below guard
        bladeGroup.add(handle);
        
        // Handle pommel (end cap) - small pixel block
        const pommelGeometry = new THREE.BoxGeometry(0.06, 0.03, 0.06);
        const pommel = new THREE.Mesh(pommelGeometry, guardMaterial);
        pommel.position.y = -0.24; // Position at bottom of handle
        bladeGroup.add(pommel);
        
        // Add the blade group to the knife group
        knifeGroup.add(bladeGroup);
        
        // Position the entire knife group for first-person view - raised higher on screen
        knifeGroup.position.set(0.3, -0.15, -0.35);
        knifeGroup.rotation.set(-Math.PI / 12, Math.PI / 6, 0);
        
        return knifeGroup;
    }
    
    /**
     * Handle mouse down events for attacking
     */
    onMouseDown() {
        if (!this.isSlashing) {
            this.isSlashing = true;
            this.slashProgress = 0;
            this.audioManager.playSound('swoosh');
        }
    }
    
    /**
     * Attach weapon holder to camera
     * @param {THREE.Camera} camera - Camera to attach weapons to
     */
    attachToCamera(camera) {
        camera.add(this.weaponHolder);
    }
    
    /**
     * Update weapon animations and state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        this.updateKnifeAnimation(deltaTime);
    }
    
    /**
     * Update knife slash animation
     * @param {number} deltaTime - Time since last update
     */
    updateKnifeAnimation(deltaTime) {
        if (this.isSlashing) {
            this.slashProgress += deltaTime / this.SLASH_DURATION;
            
            if (this.slashProgress >= 1) {
                this.isSlashing = false;
                this.slashProgress = 0;
                // Reset position and rotation
                this.knife.position.set(0.3, -0.15, -0.35);
                this.knife.rotation.set(-Math.PI / 12, Math.PI / 6, 0);
            } else {
                // Create a more pixelated-style animation with snappier movements
                const swingPhase = this.slashProgress * Math.PI;
                const swingCurve = Math.sin(swingPhase);
                const swingOffset = 1 - Math.cos(swingPhase);
                
                // More blocky animation curve for Minecraft style
                const blockFactor = Math.floor(this.slashProgress * 4) / 4; // Creates stepped animation
                
                // Combine forward thrust with arcing motion - with Minecraft-style snap
                this.knife.position.z = -0.35 - (this.THRUST_DISTANCE * swingCurve);
                this.knife.position.y = -0.15 + (swingOffset * 0.1); // Reduced arc
                this.knife.position.x = 0.3 - (swingOffset * 0.1); // Reduced inward motion
                
                // Create a more exaggerated swinging rotation for Minecraft style
                this.knife.rotation.x = -Math.PI / 12 - (swingCurve * Math.PI / 4); // Reduced rotation
                this.knife.rotation.y = Math.PI / 6 + (swingOffset * Math.PI / 8); // Less twist
                this.knife.rotation.z = -(swingOffset * Math.PI / 10); // Less tilt
            }
        }
    }
    
    /**
     * Check if weapon is currently attacking
     * @returns {boolean} Whether weapon is attacking
     */
    isAttacking() {
        return this.isSlashing;
    }
    
    /**
     * Get the current weapon name
     * @returns {string} Current weapon name
     */
    getCurrentWeapon() {
        return this.currentWeapon;
    }
} 