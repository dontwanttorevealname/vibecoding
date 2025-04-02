import * as THREE from 'three';
import { Howl } from 'howler';

/**
 * Audio Manager
 * Handles all game sound effects and music
 */
export class AudioManager {
    constructor() {
        // Maximum distance at which zombie sounds can be heard
        this.MAX_ZOMBIE_SOUND_DISTANCE = 30;
        
        // Sound library
        this.sounds = {
            swoosh: new Howl({
                src: ['/sounds/swoosh.mp3'],
                volume: 0.6
            }),
            zombieGroan: new Howl({
                src: ['/sounds/zombie_groan.mp3'],
                volume: 0.4,
                rate: 0.8
            }),
            zombieAttack: new Howl({
                src: ['/sounds/zombie_attack.mp3'],
                volume: 0.5,
                rate: 0.6
            }),
            zombieDeath: new Howl({
                src: ['/sounds/zombie_death.mp3'],
                volume: 0.6,
                rate: 0.5
            }),
            step: new Howl({
                src: ['/sounds/step.mp3'],
                volume: 0.3,
                rate: 1.0
            }),
            zombiePain: new Howl({
                src: ['/sounds/zombie_pain.mp3'],
                volume: 0.5,
                rate: 0.4
            }),
            round_start: new Howl({
                src: ['/sounds/round_start.mp3'],
                volume: 0.7,
                rate: 1.0
            }),
            heartbeat: new Howl({
                src: ['/sounds/heartbeat.mp3'],
                volume: 0.7,
                rate: 1.0,
                loop: true
            }),
            medkit: new Howl({
                src: ['/sounds/medkit.mp3'],
                volume: 0.7,
                rate: 1.0,
                duration: 2.5 // Match the healing duration
            })
        };
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     * @param {number} volume - Volume to play at (0-1)
     * @param {boolean} loop - Whether to loop the sound
     * @returns {Howl} The sound object
     */
    playSound(soundName, volume = null, loop = false) {
        if (this.sounds[soundName]) {
            // Set volume if provided
            if (volume !== null) {
                this.sounds[soundName].volume(volume);
            }
            
            // Set loop if needed
            this.sounds[soundName].loop(loop);
            
            // Play the sound
            this.sounds[soundName].play();
            return this.sounds[soundName];
        }
        return null;
    }
    
    /**
     * Stop a playing sound
     * @param {string} soundName - Name of the sound to stop
     */
    stopSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].stop();
        }
    }
    
    /**
     * Create a looping sound instance
     * @param {string} soundName - Name of the sound to create
     * @returns {Howl} Sound object
     */
    createLoopingSound(soundName) {
        if (this.sounds[soundName]) {
            return this.sounds[soundName];
        }
        return null;
    }
    
    /**
     * Play a step sound effect
     * @param {number} rate - Playback rate (pitch) for variation
     */
    playStepSound(rate = 1.0) {
        const stepSound = new Howl({
            src: ['/sounds/step.mp3'],
            volume: 0.3,
            rate: rate
        });
        stepSound.play();
    }
    
    /**
     * Create a zombie groan sound
     * @returns {Howl} Zombie groan sound
     */
    createZombieSound() {
        return new Howl({
            src: ['/sounds/zombie_groan.mp3'],
            volume: 0.0, // Start with zero volume, will be adjusted based on distance
            rate: 1.0, // Default pitch, will be adjusted when played
            loop: false
        });
    }
    
    /**
     * Create a zombie attack sound
     * @returns {Howl} Zombie attack sound
     */
    createZombieAttackSound() {
        return new Howl({
            src: ['/sounds/zombie_attack.mp3'],
            volume: 0.0, // Start with zero volume, will be adjusted based on distance
            rate: 1.0, // Default pitch, will be adjusted when played
            loop: false
        });
    }
    
    /**
     * Create a zombie death sound
     * @returns {Howl} Zombie death sound
     */
    createZombieDeathSound() {
        return new Howl({
            src: ['/sounds/zombie_death.mp3'],
            volume: 0.0, // Start with zero volume, will be adjusted based on distance
            rate: 1.0, // Default pitch, will be adjusted when played
            loop: false
        });
    }
    
    /**
     * Create a zombie pain sound
     * @returns {Howl} Zombie pain sound
     */
    createZombiePainSound() {
        return new Howl({
            src: ['/sounds/zombie_pain.mp3'],
            volume: 0.0, // Start with zero volume, will be adjusted based on distance
            rate: 1.0, // Default pitch, will be adjusted when played
            loop: false
        });
    }
    
    /**
     * Play a sound at a position in 3D space
     * @param {Howl} sound - Sound to play
     * @param {THREE.Vector3} position - Position to play sound at
     * @param {THREE.Vector3} listenerPosition - Listener position (player)
     * @param {THREE.Quaternion} listenerQuaternion - Listener orientation
     * @param {number} volume - Base volume for the sound
     * @param {number} pitch - Pitch for the sound (rate parameter)
     */
    playPositionedSound(sound, position, listenerPosition, listenerQuaternion, volume = 0.3, pitch = 1.0) {
        // Calculate distance between sound source and player
        const dx = listenerPosition.x - position.x;
        const dy = listenerPosition.y - position.y;
        const dz = listenerPosition.z - position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Only play if within hearing range
        if (distance <= this.MAX_ZOMBIE_SOUND_DISTANCE) {
            // Calculate volume based on distance
            const adjustedVolume = Math.max(0, volume * (1 - (distance / this.MAX_ZOMBIE_SOUND_DISTANCE)));
            
            // Set volume based on distance
            sound.volume(adjustedVolume);
            
            // Set the pitch (rate)
            sound.rate(pitch);
            
            // Pan sound based on direction (stereo effect)
            // Calculate angle between player forward vector and direction to sound
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(listenerQuaternion);
            const toSound = new THREE.Vector3(dx, 0, dz).normalize();
            const dot = forward.dot(toSound);
            const cross = forward.cross(toSound).y;
            
            // Convert to stereo pan value (-1 to 1)
            const pan = Math.sign(cross) * Math.min(1, 1 - Math.abs(dot));
            
            // Apply stereo panning
            sound.stereo(pan);
            
            // Play the sound
            sound.play();
        }
    }
} 