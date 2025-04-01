import './style.css';
import * as THREE from 'three';
import { Howl } from 'howler';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

// Game state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Player state
let playerHealth = 100;
let currentWeapon = 'Combat Knife';

// HUD elements
const healthFill = document.querySelector('.health-fill');
const healthText = document.querySelector('.health-text');
const weaponName = document.querySelector('.weapon-name');

// Function to update HUD
function updateHUD() {
    // Update health display
    const healthPercent = Math.max(0, Math.min(100, playerHealth));
    healthFill.style.width = `${healthPercent}%`;
    healthText.textContent = Math.round(healthPercent);

    // Update weapon display
    weaponName.textContent = currentWeapon;
}

// Game variables
const MOVEMENT_SPEED = 5;
const PLAYER_HEIGHT = 1.7;
const MOUSE_SENSITIVITY = 0.002;

// Player state
let yaw = 0;
let pitch = 0;

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 0, 75);

// Create camera (first-person perspective)
const camera = new THREE.PerspectiveCamera(
    75, // FOV
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, PLAYER_HEIGHT, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create ground texture
const groundTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(200, 200);

// Create ground plane
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ 
        color: 0x1a472a,
        roughness: 0.8,
        metalness: 0.2,
        map: groundTexture
    })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Store obstacles for collision detection
const obstacles = [];

// Create weapon holder for first-person view
const weaponHolder = new THREE.Group();
camera.add(weaponHolder);
scene.add(camera);

// Create detailed knife using loaded model
function createDetailedKnife() {
    const knifeGroup = new THREE.Group();
    
    // Skip loading attempts and directly create a geometry-based knife
    // as it's more reliable and will look good with proper geometry
    createGeometryBasedKnife(knifeGroup);
    
    return knifeGroup;
}

// Implement createGeometryBasedKnife as a fallback
function createGeometryBasedKnife(knifeGroup) {
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

// Create weapon and add to camera
const knife = createDetailedKnife();
weaponHolder.add(knife);

// Create environmental objects (trees and rocks)
function createTree(x, z) {
    const tree = new THREE.Group();
    
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f1b });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    tree.add(trunk);
    
    const topGeometry = new THREE.ConeGeometry(1.2, 3, 6);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x0f4d1a });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 2.5;
    tree.add(top);
    
    tree.position.set(x, 0, z);
    
    // Add obstacle data for collision detection
    tree.userData = {
        type: 'tree',
        isObstacle: true,
        radius: 1.0 // Collision radius
    };
    obstacles.push(tree);
    
    return tree;
}

function createRock(x, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(0.8);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.2
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.4, z);
    rock.rotation.y = Math.random() * Math.PI * 2;
    rock.scale.y = 0.5;
    
    // Add collision data
    rock.userData = {
        type: 'rock',
        isObstacle: true,
        radius: 0.8 // Collision radius
    };
    obstacles.push(rock);
    
    return rock;
}

// Add more random trees and rocks
for (let i = 0; i < 300; i++) { // Increased from 100 to 300
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x) > 10 || Math.abs(z) > 10) { // Keep center area clear
        if (Math.random() > 0.3) { // Increased tree probability
            scene.add(createTree(x, z));
        } else {
            scene.add(createRock(x, z));
        }
    }
}

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Create blood particle system for hit effects
const particleCount = 40; // Increased from 30 to ensure enough particles
const bloodParticles = new THREE.Group();
scene.add(bloodParticles);

// Function to create a simple blood particle system
function createBloodParticleSystem() {
    const particleSystem = new THREE.Group();
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        // MUCH LARGER blood chunk particles - increased by several times
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

// Create a global blood particle system pool
const bloodParticlePool = createBloodParticleSystem();
scene.add(bloodParticlePool);

// Create damage overlay for player screen flash
const damageOverlay = document.createElement('div');
damageOverlay.style.position = 'absolute';
damageOverlay.style.top = '0';
damageOverlay.style.left = '0';
damageOverlay.style.width = '100%';
damageOverlay.style.height = '100%';
damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
damageOverlay.style.pointerEvents = 'none'; // Don't block mouse events
damageOverlay.style.transition = 'background-color 0.1s ease-out'; // Shortened from 0.2s
damageOverlay.style.zIndex = '1000';
document.body.appendChild(damageOverlay);

// Control variables for screen flash
let isScreenFlashing = false;
let screenFlashStartTime = 0;
const SCREEN_FLASH_DURATION = 0.1; // Shortened from 0.5 seconds to 0.25 seconds

// Function to flash screen red when player is hit
function flashScreenRed() {
    damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
    isScreenFlashing = true;
    screenFlashStartTime = performance.now() / 1000;
    
    // Schedule the removal of the flash effect
    setTimeout(() => {
        damageOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0)';
        isScreenFlashing = false;
    }, SCREEN_FLASH_DURATION * 1000);
}

// Function to update blood particles
function updateBloodParticles(deltaTime) {
    for (const particle of bloodParticlePool.children) {
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

// Function to spawn blood particles at a position with a direction
function spawnBloodParticles(position, direction) {
    // Get the count of particles to spawn (use all available particles)
    const particlesToSpawn = Math.min(20, particleCount); // Reduce count slightly as they're bigger
    let spawnedCount = 0;
    
    // Find inactive particles and activate them
    for (const particle of bloodParticlePool.children) {
        if (!particle.userData.active && spawnedCount < particlesToSpawn) {
            // Reset properties
            particle.userData.active = true;
            particle.userData.lifespan = 0;
            particle.visible = true;
            
            // Set position slightly elevated from hit point
            particle.position.copy(position);
            particle.position.y += 1.0; // Position at center of zombie
            
            // CHANGED: Direction now TOWARDS player instead of away
            // Invert the direction vector to fly towards player instead of away
            const playerDirection = direction.clone().normalize().multiplyScalar(-1);
            
            // Set random velocity based on direction - flying toward player with some spread
            const speed = 2 + Math.random() * 5; // Increased speed for better visibility and dramatic effect
            
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

// Sound effects
const sounds = {
    swoosh: new Howl({
        src: ['/sounds/swoosh.mp3'],
        volume: 0.6
    }),
    // Keep a global zombie groan sound for fallback
    zombieGroan: new Howl({
        src: ['/sounds/zombie_groan.mp3'],
        volume: 0.4,
        rate: 0.8
    }),
    // Add zombie attack sound
    zombieAttack: new Howl({
        src: ['/sounds/zombie_attack.mp3'],
        volume: 0.5,
        rate: 0.6 // Deeper pitch (lower rate value)
    }),
    // Add zombie death sound
    zombieDeath: new Howl({
        src: ['/sounds/zombie_death.mp3'],
        volume: 0.6,
        rate: 0.5 // Much deeper pitch for death sound
    }),
    // Add step sound
    step: new Howl({
        src: ['/sounds/step.mp3'],
        volume: 0.3,
        rate: 1.0
    }),
    // Add zombie pain sound
    zombiePain: new Howl({
        src: ['/sounds/zombie_pain.mp3'],
        volume: 0.5,
        rate: 0.4
    })
};

// Maximum distance at which zombie sounds can be heard
const MAX_ZOMBIE_SOUND_DISTANCE = 30;

// Function to create a zombie sound
function createZombieSound() {
    return new Howl({
        src: ['/sounds/zombie_groan.mp3'],
        volume: 0.0, // Start with zero volume, will be adjusted based on distance
        rate: 0.8 + Math.random() * 0.6, // Random pitch for variety
        loop: false
    });
}

// Function to create a zombie attack sound with pitch variation
function createZombieAttackSound() {
    return new Howl({
        src: ['/sounds/zombie_attack.mp3'],
        volume: 0.0, // Start with zero volume, will be adjusted based on distance
        rate: 0.3 + Math.random() * 0.3, // Random deeper pitch (between 0.5 and 0.8)
        loop: false
    });
}

// Function to create a zombie death sound with pitch variation
function createZombieDeathSound() {
    return new Howl({
        src: ['/sounds/zombie_death.mp3'],
        volume: 0.0, // Start with zero volume, will be adjusted based on distance
        rate: 0.3 + Math.random() * 0.3, // Even deeper pitch (between 0.4 and 0.7)
        loop: false
    });
}

// Function to create a step sound with position
function createStepSound() {
    return new Howl({
        src: ['/sounds/step.mp3'],
        volume: 0.0, // Start with zero volume, will be adjusted based on distance
        rate: 0.9 + Math.random() * 0.2, // Slight pitch variation
        loop: false
    });
}

// Function to play a positioned sound
function playPositionedSound(sound, position, volume = 0.3) {
    // Calculate distance between sound source and player
    const dx = camera.position.x - position.x;
    const dy = camera.position.y - position.y;
    const dz = camera.position.z - position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Only play if within hearing range
    if (distance <= MAX_ZOMBIE_SOUND_DISTANCE) {
        // Calculate volume based on distance (1.0 when close, fading to 0 at max distance)
        const adjustedVolume = Math.max(0, volume * (1 - (distance / MAX_ZOMBIE_SOUND_DISTANCE)));
        
        // Set volume based on distance
        sound.volume(adjustedVolume);
        
        // Pan sound based on direction (stereo effect)
        // Calculate angle between player forward vector and direction to sound
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const toSound = new THREE.Vector3(dx, 0, dz).normalize();
        const dot = forward.dot(toSound);
        const cross = forward.cross(toSound).y;
        
        // Convert to stereo pan value (-1 to 1)
        const pan = Math.sign(cross) * Math.min(1, 1 - Math.abs(dot));
        
        // Apply stereo panning
        sound.stereo(pan);
        
        // Play the sound - clone it to allow overlapping
        sound.play();
    }
}

// Zombies array to manage all zombie instances
const zombies = [];

// Function to play zombie sound with distance-based volume adjustment
function playZombieSound(zombie, camera) {
    // Use global sound if no zombie-specific sound exists yet
    if (!zombie.userData.sound) {
        zombie.userData.sound = createZombieSound();
    }
    
    // Play the sound at the zombie's position
    playPositionedSound(zombie.userData.sound, zombie.position, 0.5);
}

// Create a basic Minecraft-style zombie
function createZombie(x, z) {
    const zombie = new THREE.Group();
    
    // Zombie color palette - green tint for zombie appearance
    const zombieSkinColor = 0x82a55d; // Zombie green
    const zombieEyeColor = 0xff0000; // Red eyes
    const zombieClothesColor = 0x3b312e; // Dark brown for tattered clothes
    const zombieDamageColor = 0xff0000; // Red color for damage feedback
    
    // Store original colors for flashing effect
    zombie.userData.originalColors = {
        skin: zombieSkinColor,
        clothes: zombieClothesColor,
        eyes: zombieEyeColor,
        mouth: 0x000000
    };
    
    // Head (slightly rectangular for Minecraft style)
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: zombieSkinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8; // Position head on top of body
    zombie.add(head);
    
    // Store material references for damage flash effect
    zombie.userData.materials = {
        head: headMaterial
    };
    
    // Create face group and attach it to the head instead of directly to the zombie
    const face = new THREE.Group();
    head.add(face);
    
    // Eyes - now positioned relative to the face group
    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: zombieEyeColor, emissive: zombieEyeColor, emissiveIntensity: 0.5 });
    
    // Left eye - positioned relative to the face
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0, 0.45);
    face.add(leftEye);
    
    // Right eye - positioned relative to the face
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0, 0.45);
    face.add(rightEye);
    
    // Store eye materials
    zombie.userData.materials.leftEye = eyeMaterial;
    zombie.userData.materials.rightEye = eyeMaterial.clone();
    rightEye.material = zombie.userData.materials.rightEye;
    
    // Mouth - positioned relative to the face
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
    
    // Arms - Create arm containers for proper positioning
    // Left arm container
    const leftArmContainer = new THREE.Group();
    leftArmContainer.position.set(-0.65, 1.5, 0); // Position at shoulder height
    zombie.add(leftArmContainer);
    
    // Left arm mesh
    const armGeometry = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({ color: zombieSkinColor });
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
    const legMaterial = new THREE.MeshStandardMaterial({ color: zombieClothesColor });
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
    
    // Set zombie position
    zombie.position.set(x, 0, z);
    
    // Add zombie data for game logic
    zombie.userData = {
        ...zombie.userData, // Preserve existing references to limbs and materials
        type: 'zombie',
        health: 100,
        speed: 2.5, // Increased from 1 to 2.5 for faster movement
        damage: 10,
        isWalking: true, // Default to walking
        walkTime: Math.random() * Math.PI * 2, // Randomize starting walk phase
        walkSpeed: 3.5 + Math.random() * 0.5, // Increased walk animation speed to match actual movement
        radius: 0.5, // Collision radius
        attackRange: 1.2, // Attack range
        hitRange: 2.5, // Slightly larger than attack range
        attackCooldown: 1, // Time between attacks
        lastAttackTime: 0,
        lastSoundTime: 0, // Track when the zombie last made a sound
        soundCooldown: 5 + Math.random() * 10, // Random cooldown between sounds (5-15 seconds)
        sound: null, // Will be initialized when first needed
        attackSound: null, // Will be initialized when first needed
        painSound: null, // Will be initialized when first needed
        deathSound: null, // Will be initialized when first needed
        leftStepSound: null, // Will be initialized when first needed
        rightStepSound: null, // Will be initialized when first needed
        isHit: false, // Track if zombie is currently displaying hit flash
        hitFlashDuration: 0.2, // Duration of hit flash in seconds
        hitFlashTime: 0, // Timer for hit flash effect
        isDead: false, // Track if zombie is dead
        deathAnimationProgress: 0, // Progress of death animation (0-1)
        deathAnimationDuration: 1.5 // Duration of death animation in seconds
    };
    
    // Add collision data for zombie
    obstacles.push(zombie);
    
    // Add the zombie to our tracking array
    zombies.push(zombie);
    
    return zombie;
}

// Function to get random position that doesn't collide with obstacles
function getRandomSpawnPosition(minDistance, maxDistance) {
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
    
        // Check if position is valid (not too close to other obstacles)
        let isValid = true;
        
        for (const obstacle of obstacles) {
            const dx = x - obstacle.position.x;
            const dz = z - obstacle.position.z;
            const distToObstacle = Math.sqrt(dx * dx + dz * dz);
            
            // Keep a minimum distance from other obstacles (3 units + obstacle radius)
            if (distToObstacle < 3 + obstacle.userData.radius) {
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

// Spawn initial zombies
function spawnInitialZombies(count) {
    for (let i = 0; i < count; i++) {
        const position = getRandomSpawnPosition(50, 80); // Spawn 50-80 units away
        const zombie = createZombie(position.x, position.z);
    scene.add(zombie);
    }
}

// Call the function to spawn initial zombies
spawnInitialZombies(12); // Spawn 12 zombies initially

// Animation state
let isSlashing = false;
let slashProgress = 0;
const SLASH_DURATION = 0.2; // Faster, snappier for Minecraft style
const THRUST_DISTANCE = 0.15; // Shorter distance for smaller knife
const SWING_RADIUS = 0.25; // Adjusted swing radius

// Pointer lock setup
function setupPointerLock() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
            document.addEventListener('mousemove', onMouseMove);
        } else {
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
}

function onMouseMove(event) {
    yaw -= event.movementX * MOUSE_SENSITIVITY;
    pitch -= event.movementY * MOUSE_SENSITIVITY;
    
    // Clamp pitch to prevent over-rotation
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
    
    // Update camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// Event listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

window.addEventListener('mousedown', () => {
    if (!isSlashing) {
        isSlashing = true;
        slashProgress = 0;
        sounds.swoosh.play();
        
        // Check for zombie hits when slashing begins
        const hitZombie = checkZombieHit();
        if (hitZombie && !hitZombie.userData.isDead) { // Only hit living zombies
            // Apply damage to the zombie
            const damage = 25; // 25 points of damage per hit
            damageZombie(hitZombie, damage);
        }
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize pointer lock
setupPointerLock();

// Check collisions
function checkCollision(newX, newZ) {
    const playerRadius = 0.3;
    
    for (const obstacle of obstacles) {
        const dx = newX - obstacle.position.x;
        const dz = newZ - obstacle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < (playerRadius + obstacle.userData.radius)) {
            return true;
        }
    }
    return false;
}

// Update player movement
function updatePlayer(deltaTime) {
    const speed = MOVEMENT_SPEED * deltaTime;
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    
    // Track if player is moving for headbob
    const isMoving = moveX !== 0 || moveZ !== 0;
    
    // Update headbob animation
    if (!camera.userData) camera.userData = {};
    if (!camera.userData.headbobTime) camera.userData.headbobTime = 0;
    if (!camera.userData.lastStepTime) camera.userData.lastStepTime = 0;
    if (!camera.userData.originalHeight) camera.userData.originalHeight = camera.position.y;
    
    if (isMoving) {
        // Calculate step frequency based on movement speed - increased for more frequent steps
        const stepFrequency = 8; // Higher value means faster/more frequent steps (increased from 5)
        
        // Increment headbob time when moving - adjusted to match step frequency
        camera.userData.headbobTime += deltaTime * stepFrequency;
        
        // Apply headbob effect - FIXED: Reduced bobbing intensity
        const bobAmount = 0.02; // Vertical bob amount (reduced from 0.05)
        const swayAmount = 0.008; // Horizontal sway amount (reduced from 0.02)
        
        // Vertical bobbing
        const verticalBob = Math.sin(camera.userData.headbobTime) * bobAmount;
        camera.position.y = camera.userData.originalHeight + verticalBob;
        
        // Slight camera roll (left/right tilt) based on stepping
        const horizontalBob = Math.cos(camera.userData.headbobTime * 2) * swayAmount;
        camera.rotation.z = horizontalBob;
        
        // Play step sound on each "downstep" of the headbob cycle - once per complete cycle
        // For better timing: check when the sine wave crosses from positive to negative (downward step)
        const prevSine = Math.sin(camera.userData.headbobTime - deltaTime * stepFrequency);
        const currSine = Math.sin(camera.userData.headbobTime);
        
        // Check if enough time has passed since last step (prevents sounds from triggering too rapidly)
        const currentTime = performance.now() / 1000;
        const minStepInterval = 0.2; // Minimum time between steps in seconds
        
        if (prevSine > 0 && currSine <= 0) {
            // Create a new instance for each step to allow overlapping
            const rightStepSound = new Howl({
                src: ['/sounds/step.mp3'],
                volume: 0.3,
                rate: 0.9 + Math.random() * 0.2 // Slight pitch variation
            });
            rightStepSound.play();
        } 
        // Add a second step sound for left foot (half cycle later)
        else if (prevSine < 0 && currSine >= 0) {
            // Create a new instance for each step to allow overlapping
            const leftStepSound = new Howl({
                src: ['/sounds/step.mp3'],
                volume: 0.3,
                rate: 0.85 + Math.random() * 0.2 // Slightly different pitch range
            });
            leftStepSound.play();
        }
    } else {
        // Reset to original height when not moving
        camera.position.y = camera.userData.originalHeight;
        camera.rotation.z = 0;
    }

    if (moveX !== 0 || moveZ !== 0) {
        // Get camera's forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(camera.quaternion);
        right.applyQuaternion(camera.quaternion);
        
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
            const newX = camera.position.x + moveDirection.x * speed;
            const newZ = camera.position.z + moveDirection.z * speed;
            
            // Update position if no collision
            if (!checkCollision(newX, newZ)) {
                camera.position.x = newX;
                camera.position.z = newZ;
            }
        }
    }
}

// Function to create a zombie pain sound with pitch variation
function createZombiePainSound() {
    return new Howl({
        src: ['/sounds/zombie_pain.mp3'],
        volume: 0.0, // Start with zero volume, will be adjusted based on distance
        rate: 0.3 + Math.random() * 0.3, // Random pitch (between 0.6 and 0.9)
        loop: false
    });
}

// Update zombies
function updateZombies(deltaTime) {
    // For each zombie, implement pathfinding and movement logic
    for (const zombie of zombies) {
        // Handle death animation if zombie is dead
        if (zombie.userData.isDead) {
            updateZombieDeathAnimation(zombie, deltaTime);
            continue; // Skip regular updates for dead zombies
        }
        
        // Skip updates if zombie is hit/stunned
        if (zombie.userData.isHit) continue;
        
        // Update animation timers
        zombie.userData.walkTime += deltaTime;
        const walkTime = zombie.userData.walkTime;
        const walkSpeed = zombie.userData.walkSpeed;
        
        // Calculate distance to player
        const dx = camera.position.x - zombie.position.x;
        const dz = camera.position.z - zombie.position.z;
        const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
        
        // Determine if zombie is in attack range
        const isInAttackRange = distanceToPlayer <= zombie.userData.attackRange;
        
        // Set zombie state (attacking or walking)
        zombie.userData.isAttacking = isInAttackRange;
        zombie.userData.isWalking = !isInAttackRange;
        
        // Make zombie face the player
        if (dx !== 0 || dz !== 0) {
            const angle = Math.atan2(dx, dz);
            zombie.rotation.y = angle;
        }
        
        // Move zombie toward player if not in attack range
        if (!isInAttackRange) {
            // Calculate a path toward the player that avoids obstacles
            let targetX = camera.position.x;
            let targetZ = camera.position.z;
            
            // Check for obstacles in direct path and adjust course if needed
            const directLine = new THREE.Vector3(dx, 0, dz).normalize();
            let needsDetour = false;
            let avoidanceVector = new THREE.Vector3();
            
            // Check nearby obstacles
            for (const obstacle of obstacles) {
                // Skip checking against self
                if (obstacle === zombie) continue;
                
                // Skip checking against other zombies (just avoid static obstacles)
                if (obstacle.userData && obstacle.userData.type === 'zombie') continue;
                
                // TEMPORARILY DISABLE TREE AND ROCK COLLISIONS TO PREVENT STUCK ZOMBIES
                // Only avoid other types of obstacles for now
                if (obstacle.userData && (obstacle.userData.type === 'tree' || obstacle.userData.type === 'rock')) {
                    continue;
                }
                
                const obstacleX = obstacle.position.x;
                const obstacleZ = obstacle.position.z;
                const obsDx = obstacleX - zombie.position.x;
                const obsDz = obstacleZ - zombie.position.z;
                const obsDistance = Math.sqrt(obsDx * obsDx + obsDz * obsDz);
                
                // IMPROVED: Better obstacle detection - use larger detection radius
                const avoidanceRadius = obstacle.userData.radius + zombie.userData.radius + 3;
                
                // If obstacle is close and in path
                if (obsDistance < avoidanceRadius) {
                    // Calculate if obstacle is in front of zombie
                    const toObstacle = new THREE.Vector3(obsDx, 0, obsDz).normalize();
                    const dotProduct = directLine.dot(toObstacle);
                    
                    // IMPROVED: Use a wider angle for obstacle detection
                    // If obstacle is in front or somewhat to the side (in our path)
                    if (dotProduct > 0.5) { // Reduced from 0.6 to detect more obstacles
                        needsDetour = true;
                        
                        // IMPROVED: Stronger avoidance for trees
                        let obstacleWeight = 1.0;
                        if (obstacle.userData.type === 'tree') {
                            obstacleWeight = 2.0; // Trees are harder to navigate around
                        }
                        
                        // Calculate avoidance vector (perpendicular to line to obstacle)
                        // IMPROVED: Make sure perpendicular is pointing away from obstacle
                        const perpendicularDir = new THREE.Vector3(-obsDz, 0, obsDx);
                        
                        // Decide which side to go around based on player position
                        const crossProduct = directLine.x * obsDz - directLine.z * obsDx;
                        if (crossProduct < 0) {
                            perpendicularDir.multiplyScalar(-1); // Go around the other way
                        }
                        
                        perpendicularDir.normalize();
                        
                        // Weight it by inverse distance and obstacle type (closer obstacles have more influence)
                        const weight = obstacleWeight / Math.max(obsDistance, 0.1);
                        avoidanceVector.add(perpendicularDir.multiplyScalar(weight));
                    }
                }
            }
            
            // Calculate direction vector
            let dirX, dirZ;
            
            if (needsDetour) {
                // Normalize avoidance vector
                if (avoidanceVector.lengthSq() > 0) {
                    avoidanceVector.normalize();
                    
                    // IMPROVED: Better blending based on obstacle proximity
                    // Blend between direct path and avoidance (50% direct, 50% avoidance - increased from 30%)
                    dirX = directLine.x * 0.5 + avoidanceVector.x * 0.5;
                    dirZ = directLine.z * 0.5 + avoidanceVector.z * 0.5;
                    
                    // Renormalize
                    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
                    if (length > 0) {
                        dirX /= length;
                        dirZ /= length;
                    }
                } else {
                    // Fallback if avoidance vector is zero
                    dirX = directLine.x;
                    dirZ = directLine.z;
                }
            } else {
                // Direct path to player
                dirX = dx / distanceToPlayer;
                dirZ = dz / distanceToPlayer;
            }
            
            // Calculate new position with speed adjustment
            const speed = zombie.userData.speed * deltaTime;
            const newX = zombie.position.x + dirX * speed;
            const newZ = zombie.position.z + dirZ * speed;
            
            // Check for collisions with other zombies
            let canMove = true;
            for (const obstacle of obstacles) {
                // Skip checking against self
                if (obstacle === zombie) continue;
                
                // Calculate distance between new position and obstacle
                const obstacleX = obstacle.position.x;
                const obstacleZ = obstacle.position.z;
                const obsDx = newX - obstacleX;
                const obsDz = newZ - obstacleZ;
                const obsDistance = Math.sqrt(obsDx * obsDx + obsDz * obsDz);
                
                // Check if collision would occur
                if (obsDistance < (zombie.userData.radius + obstacle.userData.radius)) {
                    canMove = false;
                    break;
                }
            }
            
            // Update position if no collision
            if (canMove) {
                zombie.position.x = newX;
                zombie.position.z = newZ;
            }
            
            // Calculate animation speed based on actual movement speed
            // This ensures animation matches the zombie's movement rate
            const animationSpeed = zombie.userData.speed * 1.4; // Scale animation with movement speed
            
            // Basic body bobbing animation for walking - faster to match movement
            const walkOffset = Math.sin(walkTime * animationSpeed) * 0.1;
        zombie.position.y = walkOffset;
        
            // Arm swing animation for walking - faster to match movement
        if (zombie.userData.leftArm && zombie.userData.rightArm) {
                // Opposite arm swings with negated sine to swing forward correctly
                zombie.userData.leftArm.rotation.x = -Math.sin(walkTime * animationSpeed) * 0.4;
                zombie.userData.rightArm.rotation.x = -Math.sin(walkTime * animationSpeed + Math.PI) * 0.4;
            }
            
            // Leg swing animation for walking - faster to match movement
        if (zombie.userData.leftLeg && zombie.userData.rightLeg) {
            // Opposite leg swings
                zombie.userData.leftLeg.rotation.x = Math.sin(walkTime * animationSpeed) * 0.4;
                zombie.userData.rightLeg.rotation.x = Math.sin(walkTime * animationSpeed + Math.PI) * 0.4;
                
                // Play step sound when each foot hits the ground - timed to match faster animation
                // Left foot hits ground when sine wave crosses from negative to positive
                const leftLegPrevSine = Math.sin((walkTime - deltaTime) * animationSpeed);
                const leftLegCurrSine = Math.sin(walkTime * animationSpeed);
                
                if (leftLegPrevSine < 0 && leftLegCurrSine >= 0) {
                    // Create a new step sound each time to allow overlapping
                    const leftStepSound = new Howl({
                        src: ['/sounds/step.mp3'],
                        volume: 0.0, // Will be adjusted by positioned sound
                        rate: 1.1 + Math.random() * 0.2
                    });
                    playPositionedSound(leftStepSound, zombie.position, 0.2);
                }
                
                // Right foot hits ground when sine wave crosses from negative to positive (with phase offset)
                const rightLegPrevSine = Math.sin((walkTime - deltaTime) * animationSpeed + Math.PI);
                const rightLegCurrSine = Math.sin(walkTime * animationSpeed + Math.PI);
                
                if (rightLegPrevSine < 0 && rightLegCurrSine >= 0) {
                    // Create a new step sound each time to allow overlapping
                    const rightStepSound = new Howl({
                        src: ['/sounds/step.mp3'],
                        volume: 0.0, // Will be adjusted by positioned sound
                        rate: 1.1 + Math.random() * 0.2
                    });
                    playPositionedSound(rightStepSound, zombie.position, 0.2);
                }
            }
        } else {
            // Zombie is in attack range - perform attack animation and logic
            
            // Reset walking height
            zombie.position.y = 0;
            
            // Check if zombie can attack (cooldown finished)
            const currentTime = performance.now() / 1000; // Convert to seconds
            if (currentTime - zombie.userData.lastAttackTime >= zombie.userData.attackCooldown) {
                // Start attack animation
                zombie.userData.attackProgress = 0;
                zombie.userData.isCurrentlyAttacking = true;
                zombie.userData.lastAttackTime = currentTime;
                
                // Create and play attack sound with pitch variation
                // Initialize attack sound if not already present
                if (!zombie.userData.attackSound) {
                    zombie.userData.attackSound = createZombieAttackSound();
                }
                
                // Play the attack sound
                playPositionedSound(zombie.userData.attackSound, zombie.position, 0.7);
                
                // Damage player when attack connects
                playerHealth -= zombie.userData.damage;
                playerHealth = Math.max(0, playerHealth); // Prevent negative health
                
                // Flash the screen red when player takes damage
                flashScreenRed();
            }
            
            // Process attack animation if currently attacking
            if (zombie.userData.isCurrentlyAttacking) {
                zombie.userData.attackProgress += deltaTime * 5; // Control attack animation speed
                
                // Attack animation for arms - both arms swing forward together
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
        
        // Head slow rotation (looking around) - continues regardless of state
        if (zombie.userData.head) {
            zombie.userData.head.rotation.y = Math.sin(walkTime * 0.5) * 0.2; // slower, smaller head rotation
        }
        
        // Update sound timer
        zombie.userData.lastSoundTime += deltaTime;
        
        // Randomly play zombie sounds based on cooldown
        if (zombie.userData.lastSoundTime >= zombie.userData.soundCooldown) {
            // Reset timer with a random cooldown 
            zombie.userData.lastSoundTime = 0;
            zombie.userData.soundCooldown = 5 + Math.random() * 10; // 5-15 seconds
            
            // Play sound with distance-based volume
            playZombieSound(zombie, camera);
        }
    }
}

// Function to check if a zombie is in front of the player and in hit range
function checkZombieHit() {
    // Get player's forward direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    
    // Normalize to get a unit vector
    forward.normalize();
    
    let hitZombie = null;
    let closestDistance = Infinity;
    
    // Check each zombie
    for (const zombie of zombies) {
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

// Function to damage a zombie and apply hit effects
function damageZombie(zombie, damage) {
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
    
    // Debug output - log direction and positions
    console.log(`Hitting zombie at position: ${zombie.position.x.toFixed(2)}, ${zombie.position.y.toFixed(2)}, ${zombie.position.z.toFixed(2)}`);
    console.log(`Direction vector: ${hitDirection.x.toFixed(2)}, ${hitDirection.y.toFixed(2)}, ${hitDirection.z.toFixed(2)}`);
    
    // Spawn blood particles at zombie position with direction towards player
    spawnBloodParticles(zombie.position, hitDirection);
    
    // Handle death
    if (zombie.userData.health <= 0) {
        // Set death state
        zombie.userData.isDead = true;
        zombie.userData.deathAnimationProgress = 0;
        
        // Initialize death sound if not already present
        if (!zombie.userData.deathSound) {
            zombie.userData.deathSound = createZombieDeathSound();
        }
        
        // Play the death sound at zombie position
        playPositionedSound(zombie.userData.deathSound, zombie.position, 0.8);
        
        // Remove from obstacles for collision detection (but keep in zombies array for animation)
        const obstacleIndex = obstacles.indexOf(zombie);
        if (obstacleIndex !== -1) {
            obstacles.splice(obstacleIndex, 1);
        }
    } else {
        // Play a pain sound instead of attack sound for hit reaction
        if (!zombie.userData.painSound) {
            zombie.userData.painSound = createZombiePainSound();
        }
        
        // Play hit reaction sound - FIXED: Explicitly play the pain sound
        playPositionedSound(zombie.userData.painSound, zombie.position, 0.6);
    }
    
    // Return true if zombie is killed
    return zombie.userData.health <= 0;
}

// Function to update hit flashing effect and restore original colors
function updateZombieHitEffects(deltaTime) {
    for (const zombie of zombies) {
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

// Function to update zombie death animation
function updateZombieDeathAnimation(zombie, deltaTime) {
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
    
    // Remove the zombie from the scene when animation is complete
    if (progress >= 1.0) {
        // Schedule removal on next frame to avoid modifying the array during iteration
        setTimeout(() => {
            const zombieIndex = zombies.indexOf(zombie);
            if (zombieIndex !== -1) {
                zombies.splice(zombieIndex, 1);
                scene.remove(zombie);
            }
        }, 0);
    }
}

// Game loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    updatePlayer(deltaTime);
    updateZombies(deltaTime);
    updateZombieHitEffects(deltaTime);
    updateBloodParticles(deltaTime); // Update blood particles
    updateHUD();
    
    // Update knife thrust animation
    if (isSlashing) {
        slashProgress += deltaTime / SLASH_DURATION;
        
        if (slashProgress >= 1) {
            isSlashing = false;
            slashProgress = 0;
            // Reset position and rotation
            knife.position.set(0.3, -0.15, -0.35);
            knife.rotation.set(-Math.PI / 12, Math.PI / 6, 0);
        } else {
            // Create a more pixelated-style animation with snappier movements
            const swingPhase = slashProgress * Math.PI;
            const swingCurve = Math.sin(swingPhase);
            const swingOffset = 1 - Math.cos(swingPhase);
            
            // More blocky animation curve for Minecraft style
            const blockFactor = Math.floor(slashProgress * 4) / 4; // Creates stepped animation
            
            // Combine forward thrust with arcing motion - with Minecraft-style snap
            knife.position.z = -0.35 - (THRUST_DISTANCE * swingCurve);
            knife.position.y = -0.15 + (swingOffset * 0.1); // Reduced arc
            knife.position.x = 0.3 - (swingOffset * 0.1); // Reduced inward motion
            
            // Create a more exaggerated swinging rotation for Minecraft style
            knife.rotation.x = -Math.PI / 12 - (swingCurve * Math.PI / 4); // Reduced rotation
            knife.rotation.y = Math.PI / 6 + (swingOffset * Math.PI / 8); // Less twist
            knife.rotation.z = -(swingOffset * Math.PI / 10); // Less tilt
        }
    }

    // Render scene
    renderer.render(scene, camera);
}

animate();
