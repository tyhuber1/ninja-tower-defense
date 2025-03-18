class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, config) {
        super(scene, x, y, type);
        
        this.scene = scene;
        this.projectileType = type;
        
        // Apply config
        this.damage = config.damage || 20;
        this.speed = config.speed || 300;
        this.target = config.target || null;
        
        // Special abilities
        this.splash = config.splash || false;
        this.splashRadius = config.splashRadius || 0;
        this.effects = config.effects || null;
        
        // Initialize sprite
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics body
        this.body.setSize(16, 16);
        
        // Set projectile lifetime
        this.lifespan = 2000; // ms
        
        // Fire at target
        if (this.target) {
            this.fire();
        }
    }
    
    fire() {
        if (!this.target) {
            return;
        }
        
        // Rotate projectile towards target
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );
        
        this.rotation = angle;
        
        // Calculate velocity
        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
        
        // Set a maximum lifespan
        this.scene.time.delayedCall(this.lifespan, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }
    
    hit(enemy) {
        // Deal damage to the hit enemy
        enemy.takeDamage(this.damage);
        
        // Apply splash damage if enabled
        if (this.splash) {
            this.splashDamage(enemy);
        }
        
        // Apply effects if any
        if (this.effects) {
            this.applyEffects(enemy);
        }
        
        // Create impact effect
        this.createImpact();
        
        // Destroy projectile
        this.destroy();
    }
    
    splashDamage(targetEnemy) {
        // Get all enemies within splash radius
        const enemies = this.scene.enemies.getChildren().filter(enemy => {
            if (enemy === targetEnemy || !enemy.active) {
                return false;
            }
            
            const distance = Phaser.Math.Distance.Between(
                targetEnemy.x, targetEnemy.y,
                enemy.x, enemy.y
            );
            
            return distance <= this.splashRadius;
        });
        
        // Deal splash damage to all enemies in range
        for (const enemy of enemies) {
            // Splash damage is reduced based on distance
            const distance = Phaser.Math.Distance.Between(
                targetEnemy.x, targetEnemy.y,
                enemy.x, enemy.y
            );
            
            const damageMultiplier = 1 - (distance / this.splashRadius);
            const damage = Math.floor(this.damage * damageMultiplier);
            
            enemy.takeDamage(damage);
            
            // Apply effects if any
            if (this.effects) {
                this.applyEffects(enemy);
            }
        }
        
        // Create explosion effect for rocket projectiles
        if (this.projectileType === 'rocket') {
            this.scene.createExplosion(targetEnemy.x, targetEnemy.y);
        }
    }
    
    applyEffects(enemy) {
        // Apply slow effect
        if (this.effects && this.effects.slow) {
            enemy.applySlowEffect(this.effects.slow, this.effects.duration || 2000);
        }
    }
    
    createImpact() {
        // Create different impact effects based on projectile type
        switch (this.projectileType) {
            case 'arrow':
                // Simple particle effect
                const particles = this.scene.add.particles('arrow');
                const emitter = particles.createEmitter({
                    speed: 50,
                    scale: { start: 0.5, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 300,
                    blendMode: 'ADD'
                });
                
                emitter.explode(5, this.x, this.y);
                
                // Auto-destroy particles
                this.scene.time.delayedCall(300, () => {
                    particles.destroy();
                });
                break;
                
            case 'cannonball':
                // Small explosion
                const smokeBurst = this.scene.add.particles('explosion');
                const smokeEmitter = smokeBurst.createEmitter({
                    speed: 100,
                    scale: { start: 0.2, end: 0 },
                    alpha: { start: 0.5, end: 0 },
                    lifespan: 500,
                    blendMode: 'ADD'
                });
                
                smokeEmitter.explode(10, this.x, this.y);
                
                // Auto-destroy particles
                this.scene.time.delayedCall(500, () => {
                    smokeBurst.destroy();
                });
                break;
                
            case 'magic-orb':
                // Magical particle effect
                const magicParticles = this.scene.add.particles('magic-orb');
                const magicEmitter = magicParticles.createEmitter({
                    speed: 60,
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 0.8, end: 0 },
                    tint: { start: 0x8888ff, end: 0x0000ff },
                    lifespan: 400,
                    blendMode: 'ADD'
                });
                
                magicEmitter.explode(8, this.x, this.y);
                
                // Auto-destroy particles
                this.scene.time.delayedCall(400, () => {
                    magicParticles.destroy();
                });
                break;
                
            // Rocket explosions are handled in splashDamage
        }
    }
}