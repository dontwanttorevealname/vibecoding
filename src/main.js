import './style.css';
import * as THREE from 'three';
import { GameState } from './js/core/GameState.js';
import { PlayerController } from './js/core/PlayerController.js';
import { ZombieManager } from './js/entities/ZombieManager.js';
import { WeaponSystem } from './js/core/WeaponSystem.js';
import { Environment } from './js/core/Environment.js';
import { AudioManager } from './js/audio/AudioManager.js';
import { UIManager } from './js/ui/UIManager.js';
import { ParticleSystem } from './js/core/ParticleSystem.js';
import { WaveManager } from './js/core/WaveManager.js';
import { HealthPackManager } from './js/entities/HealthPackManager.js';

// Initialize game systems
const gameState = new GameState();
const uiManager = new UIManager();
const audioManager = new AudioManager();
const environment = new Environment();
const particleSystem = new ParticleSystem();
const zombieManager = new ZombieManager(audioManager, particleSystem);
const weaponSystem = new WeaponSystem(audioManager, particleSystem);
const playerController = new PlayerController(gameState, audioManager, uiManager);
const waveManager = new WaveManager(zombieManager, audioManager, uiManager, gameState);
const healthPackManager = new HealthPackManager(audioManager);

// Create scene and renderer
const scene = environment.getScene();
const renderer = environment.getRenderer();
const camera = playerController.getCamera();

// Add weapon to camera
weaponSystem.attachToCamera(camera);

// Initialize player controls
playerController.setupPointerLock(renderer.domElement);
playerController.addObstacles(environment.getObstacles());

// The player will get zombie obstacles dynamically during updates
// We don't add them ahead of time since they'll be spawned by waves

// Set scene for wave manager to handle zombie spawning
waveManager.setScene(scene);

// Setup window resize handler
window.addEventListener('resize', () => {
    playerController.updateAspect(window.innerWidth / window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add everything to the scene
scene.add(camera);
zombieManager.addToScene(scene);
particleSystem.addToScene(scene);
healthPackManager.addToScene(scene);

// Remove initial zombies from the scene
const zombies = zombieManager.getZombies();
while (zombies.length > 0) {
    const zombie = zombies.pop();
    if (zombie.parent) {
        zombie.parent.remove(zombie);
    }
}

// Start the first wave after a short delay
setTimeout(() => {
    waveManager.startGame();
}, 1000);

// Game loop
const clock = new THREE.Clock();
let isAttacking = false;
let hasHitZombie = false;
let waveComplete = false;

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Update systems
    playerController.update(deltaTime);
    zombieManager.update(deltaTime, camera, playerController);
    
    // Check for zombies that should spawn health packs
    const zombies = zombieManager.getZombies();
    for (const zombie of zombies) {
        // Check if this zombie needs to drop a health pack
        if (zombie.userData && zombie.userData.shouldSpawnHealthPack === true) {
            // Spawn a health pack at the zombie's position
            const healthPack = healthPackManager.spawnHealthPackAtZombie(zombie, scene);
            
            // Mark as processed so we don't spawn multiple health packs
            zombie.userData.shouldSpawnHealthPack = false;
        }
    }
    
    // Update health packs and check for interaction
    healthPackManager.update(deltaTime);
    
    // Check if player is looking at a health pack
    healthPackManager.checkHealthPackLookAt(camera);
    const isLookingAtHealthPack = healthPackManager.getLookingAtHealthPack() !== null;
    
    // Handle health pack pickup when E is pressed
    if (playerController.isActionKeyPressed()) {
        console.log("Action key press detected in main loop");
        
        if (isLookingAtHealthPack) {
            // Try to use the health pack
            const used = healthPackManager.tryUseHealthPack(playerController, true);
            
            // Consume the action key press regardless of whether the health pack was used
            playerController.consumeActionKeyPress();
            
            if (used) {
                console.log("Successfully used health pack");
            }
        } else {
            // Consume the action key press if not used for health pack
            playerController.consumeActionKeyPress();
        }
    }
    
    // Keep player aware of zombies for collision
    playerController.setZombieObstacles(zombieManager.getZombies());
    
    weaponSystem.update(deltaTime);
    particleSystem.update(deltaTime);
    
    // Update UI
    uiManager.update(
        playerController.getHealth(), 
        weaponSystem.getCurrentWeapon(),
        gameState.getScore(),
        deltaTime,
        audioManager,
        playerController.getHealingInfo(),
        { isLookingAtHealthPack: isLookingAtHealthPack }
    );
    
    // Check for wave completion
    const isWaveCompleted = waveManager.update();
    if (isWaveCompleted && !waveComplete) {
        waveComplete = true;
        
        console.log("Wave completed, starting next wave");
        
        // Show wave complete screen with score
        uiManager.showWaveComplete(
            waveManager.getCurrentWave(), 
            gameState.getScore(),
            () => {
                waveComplete = false;
                waveManager.startNextWave();
            }
        );
    }
    
    // Check player attack
    // Track if weapon just started or stopped attacking
    const currentlyAttacking = weaponSystem.isAttacking();
    
    // If the weapon just started attacking, reset the hit flag
    if (currentlyAttacking && !isAttacking) {
        hasHitZombie = false;
    }
    
    // If attacking and haven't hit a zombie yet this attack
    if (currentlyAttacking && !hasHitZombie) {
        const hitZombie = zombieManager.checkZombieHit(camera);
        if (hitZombie) {
            zombieManager.damageZombie(hitZombie, 25, camera);
            hasHitZombie = true; // Mark that we've hit a zombie in this attack
        }
    }
    
    // Update attack state for next frame
    isAttacking = currentlyAttacking;
    
    // Render scene
    renderer.render(scene, camera);
}

animate();
