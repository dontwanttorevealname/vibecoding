import * as THREE from 'three';

/**
 * Environment class
 * Handles scene, renderer, lighting, and environment objects
 */
export class Environment {
    constructor() {
        this.obstacles = [];
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 0, 75);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#game'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Create ground
        this.createGround();
        
        // Add lighting
        this.createLighting();
        
        // Populate environment with objects
        this.populateEnvironment();
    }
    
    /**
     * Create ground plane
     */
    createGround() {
        const groundTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(200, 200);
        
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
        this.scene.add(ground);
    }
    
    /**
     * Create scene lighting
     */
    createLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }
    
    /**
     * Create a tree at the given position
     * @param {number} x - X position
     * @param {number} z - Z position
     * @returns {THREE.Group} The created tree
     */
    createTree(x, z) {
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
        this.obstacles.push(tree);
        
        return tree;
    }
    
    /**
     * Create a rock at the given position
     * @param {number} x - X position
     * @param {number} z - Z position
     * @returns {THREE.Mesh} The created rock
     */
    createRock(x, z) {
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
        this.obstacles.push(rock);
        
        return rock;
    }
    
    /**
     * Populate the environment with trees and rocks
     */
    populateEnvironment() {
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            if (Math.abs(x) > 10 || Math.abs(z) > 10) { // Keep center area clear
                if (Math.random() > 0.3) { // More trees than rocks
                    this.scene.add(this.createTree(x, z));
                } else {
                    this.scene.add(this.createRock(x, z));
                }
            }
        }
    }
    
    /**
     * Get the scene
     * @returns {THREE.Scene} The scene
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get the renderer
     * @returns {THREE.WebGLRenderer} The renderer
     */
    getRenderer() {
        return this.renderer;
    }
    
    /**
     * Get the obstacles
     * @returns {Array} Array of obstacles
     */
    getObstacles() {
        return this.obstacles;
    }
} 