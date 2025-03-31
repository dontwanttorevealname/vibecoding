import './style.css';
import * as THREE from 'three';
import { Howl } from 'howler';

// Game state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Game variables
const MOVEMENT_SPEED = 10;
const PLAYER_SIZE = 1;
const CAMERA_HEIGHT = 15;
const CAMERA_ZOOM = 150;

// Mouse position for aiming
const mouse = new THREE.Vector2();

// Store obstacles for collision detection
const obstacles = [];

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create camera with tighter zoom
const camera = new THREE.OrthographicCamera(
    window.innerWidth / -CAMERA_ZOOM,
    window.innerWidth / CAMERA_ZOOM,
    window.innerHeight / CAMERA_ZOOM,
    window.innerHeight / -CAMERA_ZOOM,
    1,
    1000
);
camera.position.set(0, CAMERA_HEIGHT, 0);
camera.lookAt(0, 0, 0);

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

// Create player group
const playerGroup = new THREE.Group();

// Create player body parts
function createPlayerCharacter() {
    // Create a holder for the body parts that will rotate
    const bodyRotationGroup = new THREE.Group();
    playerGroup.add(bodyRotationGroup);

    // Main body (oval/pill shape)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4b5320, // Olive drab
        metalness: 0.1,
        roughness: 0.9
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.x = 1.2; // Make it oval by scaling in X direction (shoulders)
    body.position.y = 0.3;
    bodyRotationGroup.add(body);

    // Baseball cap
    const capGroup = new THREE.Group();
    
    // Cap base (single-sided disc)
    const capBaseGeometry = new THREE.CircleGeometry(0.25, 16);
    const capMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a365d, // Dark blue
        metalness: 0.1,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const capBase = new THREE.Mesh(capBaseGeometry, capMaterial);
    capBase.rotation.x = -Math.PI / 2;
    capBase.position.y = 0.65;
    capGroup.add(capBase);

    // Cap bill (more pronounced beak)
    const billGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.25);
    const bill = new THREE.Mesh(billGeometry, capMaterial);
    bill.position.set(0, 0.64, 0.2);
    capGroup.add(bill);

    // Add side panels to the cap
    const sideGeometry = new THREE.BoxGeometry(0.02, 0.1, 0.2);
    const leftSide = new THREE.Mesh(sideGeometry, capMaterial);
    leftSide.position.set(0.24, 0.6, 0);
    capGroup.add(leftSide);

    const rightSide = leftSide.clone();
    rightSide.position.x = -0.24;
    capGroup.add(rightSide);

    bodyRotationGroup.add(capGroup);

    // Backpack (repositioned)
    const backpackGroup = new THREE.Group();
    
    // Main compartment
    const mainPackGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
    const backpackMaterial = new THREE.MeshStandardMaterial({
        color: 0x3e2723, // Dark brown
        metalness: 0.1,
        roughness: 0.9
    });
    const mainPack = new THREE.Mesh(mainPackGeometry, backpackMaterial);
    backpackGroup.add(mainPack);

    // Top flap
    const flapGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.22);
    const flap = new THREE.Mesh(flapGeometry, backpackMaterial);
    flap.position.y = 0.2;
    flap.rotation.x = Math.PI / 12;
    backpackGroup.add(flap);

    // Side pockets
    const pocketGeometry = new THREE.BoxGeometry(0.12, 0.2, 0.22);
    const leftPocket = new THREE.Mesh(pocketGeometry, backpackMaterial);
    leftPocket.position.x = 0.18;
    backpackGroup.add(leftPocket);

    const rightPocket = leftPocket.clone();
    rightPocket.position.x = -0.18;
    backpackGroup.add(rightPocket);

    // Position backpack to sit properly on the back
    backpackGroup.position.set(0, 0.3, -0.25);
    bodyRotationGroup.add(backpackGroup);

    // Add a darker outline
    const outlineGeometry = new THREE.RingGeometry(0.3, 0.32, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x2d3112, // Darker shade of olive drab
        side: THREE.DoubleSide
    });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.rotation.x = -Math.PI / 2;
    outline.scale.x = 1.2; // Match the oval body shape for shoulders
    outline.position.y = 0.01;
    bodyRotationGroup.add(outline);

    return bodyRotationGroup;
}

// Create detailed M9 bayonet
function createDetailedKnife() {
    const knifeGroup = new THREE.Group();

    // Main blade
    const bladeGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.7);
    const bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x222222
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    // Move blade forward from center
    blade.position.x = 0.4; // Offset to right side of player
    knifeGroup.add(blade);
    
    // Blade tip (triangle)
    const tipGeometry = new THREE.ConeGeometry(0.04, 0.2, 4);
    const tip = new THREE.Mesh(tipGeometry, bladeMaterial);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.45;
    tip.position.x = 0.4; // Match blade offset
    knifeGroup.add(tip);
    
    // Serrated edge (small cubes along one side)
    for(let i = 0; i < 8; i++) {
        const toothGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
        const tooth = new THREE.Mesh(toothGeometry, bladeMaterial);
        tooth.position.set(0.05, 0, -0.1 + i * 0.05);
        blade.add(tooth);
    }

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.3,
        roughness: 0.8
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.x = Math.PI / 2;
    handle.position.z = -0.2;
    handle.position.x = 0.4; // Match blade offset
    knifeGroup.add(handle);

    // Guard
    const guardGeometry = new THREE.BoxGeometry(0.2, 0.04, 0.04);
    const guardMaterial = bladeMaterial;
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.position.z = -0.05;
    guard.position.x = 0.4; // Match blade offset
    knifeGroup.add(guard);
    
    return knifeGroup;
}

// Create player and weapon
createPlayerCharacter();

// Create weapon holder
const weaponHolder = new THREE.Group();
weaponHolder.position.y = 0.4; // Height of weapon
const knife = createDetailedKnife();
weaponHolder.add(knife);
playerGroup.add(weaponHolder);

// Add player group to scene
playerGroup.position.y = 0.5;
scene.add(playerGroup);

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
    rock.userData.isObstacle = true;
    rock.userData.radius = 0.8; // Collision radius
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

// Sound effects
const sounds = {
    swoosh: new Howl({
        src: ['src/sounds/swoosh.mp3'],
        volume: 0.5
    })
};

// Animation state
let isThrusting = false;
let thrustProgress = 0;
const THRUST_DURATION = 0.2; // seconds
const THRUST_DISTANCE = 0.5; // units forward

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

window.addEventListener('mousemove', (e) => {
    // Get mouse position relative to screen center
    mouse.x = (e.clientX - window.innerWidth / 2);
    mouse.y = -(e.clientY - window.innerHeight / 2);
});

window.addEventListener('resize', () => {
    camera.left = window.innerWidth / -CAMERA_ZOOM;
    camera.right = window.innerWidth / CAMERA_ZOOM;
    camera.top = window.innerHeight / CAMERA_ZOOM;
    camera.bottom = window.innerHeight / -CAMERA_ZOOM;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Add mouse click handling after the other event listeners
window.addEventListener('mousedown', () => {
    if (!isThrusting) {
        isThrusting = true;
        thrustProgress = 0;
        sounds.swoosh.play();
    }
});

// Game loop
const clock = new THREE.Clock();

function checkCollision(newX, newZ) {
    const playerRadius = 0.45; // Adjusted for oval shape
    
    for (const obstacle of obstacles) {
        const dx = newX - obstacle.position.x;
        const dz = newZ - obstacle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < (playerRadius + obstacle.userData.radius)) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function updatePlayer(deltaTime) {
    // Screen-space movement (cardinal directions)
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    // Apply movement in screen space
    const speed = MOVEMENT_SPEED * deltaTime;
    if (moveX !== 0 || moveZ !== 0) {
        // Calculate new position
        let newX = playerGroup.position.x;
        let newZ = playerGroup.position.z;
        
        if (moveX !== 0 && moveZ !== 0) {
            // Normalize diagonal movement
            newX += moveX * speed / Math.sqrt(2);
            newZ += moveZ * speed / Math.sqrt(2);
        } else {
            newX += moveX * speed;
            newZ += moveZ * speed;
        }
        
        // Only update position if there's no collision
        if (!checkCollision(newX, newZ)) {
            playerGroup.position.x = newX;
            playerGroup.position.z = newZ;
        }
    }

    // Convert screen mouse position to world coordinates
    const mouseX = (mouse.x / window.innerWidth) * (camera.right - camera.left) + playerGroup.position.x;
    const mouseZ = (-mouse.y / window.innerHeight) * (camera.top - camera.bottom) + playerGroup.position.z;
    
    // Calculate angle between player and mouse position
    const dx = mouseX - playerGroup.position.x;
    const dz = mouseZ - playerGroup.position.z;
    const angleToMouse = Math.atan2(dx, dz);
    
    // Update both weapon and body rotation
    weaponHolder.rotation.y = angleToMouse;
    playerGroup.children[0].rotation.y = angleToMouse; // Rotate the body group

    // Update camera to follow player
    camera.position.x = playerGroup.position.x;
    camera.position.z = playerGroup.position.z;
    camera.lookAt(playerGroup.position.x, 0, playerGroup.position.z);
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    // Update player movement and rotation
    updatePlayer(deltaTime);

    // Update knife thrust animation
    if (isThrusting) {
        thrustProgress += deltaTime / THRUST_DURATION;
        
        if (thrustProgress >= 1) {
            isThrusting = false;
            thrustProgress = 0;
            // Reset all knife parts to original positions
            knife.children.forEach(part => {
                if (part.userData.originalZ !== undefined) {
                    part.position.z = part.userData.originalZ;
                }
            });
        } else {
            // Thrust forward using sine curve
            const thrustCurve = Math.sin(thrustProgress * Math.PI);
            // Move each knife part forward
            knife.children.forEach(part => {
                // Store original Z position if not already stored
                if (part.userData.originalZ === undefined) {
                    part.userData.originalZ = part.position.z;
                }
                // Thrust forward along local Z axis
                part.position.z = part.userData.originalZ + (THRUST_DISTANCE * thrustCurve);
            });
        }
    }

    // Render scene
    renderer.render(scene, camera);
}

animate();
