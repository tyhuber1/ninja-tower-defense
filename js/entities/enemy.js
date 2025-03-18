class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, path, config) {
        super(scene, x, y, type);
        
        this.scene = scene;
        this.type = type;
        this.path = path;
        
        // Generate unique ID for this enemy
        this.id = Date.now() + Math.floor(Math.random() * 1000);
        
        // Apply config
        this.speed = config.speed || 50;
        this.health = config.health || 100;
        this.maxHealth = this.health;
        this.reward = config.reward || 10;
        
        // Path following
        this.pathIndex = 0;
        this.nextPathPoint = this.path[this.pathIndex + 1];
        
        // Status effects
        this.slowTimer = 0;
        this.slowFactor = 1;
        
        // Initialize sprite
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics body
        this.body.setSize(24, 24);
        
        // Create health bar
        this.createHealthBar();
        
        // Start walking animation
        switch (this.type) {
            case 'enemy-basic':
                this.play('enemy-basic-walk');
                break;
            case 'enemy-fast':
                this.play('enemy-fast-walk');
                break;
            case 'enemy-tank':
                this.play('enemy-tank-walk');
                break;
        }
    }
    
    update() {
        // Update status effects
        this.updateStatusEffects();
        
        // Skip if no next path point
        if (!this.nextPathPoint) {
            return;
        }
        
        // Calculate distance to next path point
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.nextPathPoint.x, this.nextPathPoint.y
        );
        
        if (distance < 5) {
            // Reached this path point, move to next
            this.pathIndex++;
            
            // Check if we've reached the end of the path
            if (this.pathIndex >= this.path.length - 1) {
                // Reached the end of the path
                this.emit('reachedEnd', this);
                return;
            }
            
            // Set next target
            this.nextPathPoint = this.path[this.pathIndex + 1];
        }
        
        // Move towards next point
        const effectiveSpeed = this.speed * this.slowFactor;
        this.scene.physics.moveTo(this, this.nextPathPoint.x, this.nextPathPoint.y, effectiveSpeed);
        
        // Update facing direction (flip sprite based on movement)
        if (this.body.velocity.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }
        
        // Update health bar position
        this.updateHealthBar();
    }
    
    createHealthBar() {
        const width = 32;
        const height = 4;
        
        // Background (red)
        this.healthBarBackground = this.scene.add.rectangle(
            this.x, this.y - 20,
            width, height,
            0xff0000
        );
        
        // Foreground (green)
        this.healthBar = this.scene.add.rectangle(
            this.x, this.y - 20,
            width, height,
            0x00ff00
        );
        
        // Set origin for positioning
        this.healthBarBackground.setOrigin(0.5, 0.5);
        this.healthBar.setOrigin(0, 0.5);
        this.healthBar.x -= width / 2; // Adjust for origin
    }
    
    updateHealthBar() {
        // Update position
        this.healthBarBackground.x = this.x;
        this.healthBarBackground.y = this.y - 20;
        
        // Calculate width based on health percentage
        const width = 32;
        const healthPercentage = this.health / this.maxHealth;
        const healthWidth = width * healthPercentage;
        
        this.healthBar.width = healthWidth;
        this.healthBar.x = this.x - (width / 2);
        this.healthBar.y = this.y - 20;
    }
    
    updateStatusEffects() {
        // Update slow effect
        if (this.slowTimer > 0) {
            this.slowTimer -= this.scene.game.loop.delta;
            
            if (this.slowTimer <= 0) {
                // Remove slow effect
                this.slowFactor = 1;
                this.clearTint();
            }
        }
    }
    
    takeDamage(amount) {
        // Reduce health
        this.health = Math.max(0, this.health - amount);
        
        // Update health bar
        this.updateHealthBar();
        
        // Play hit effect
        this.scene.sound.play('enemy-hit');
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Play death sound
        this.scene.sound.play('enemy-die');
        
        // Update score
        this.scene.game.globals.score += this.reward;
        this.scene.events.emit('scoreChanged', this.scene.game.globals.score);
        
        // Signal that this enemy was defeated
        this.emit('defeated', this);
        
        // Cleanup health bar
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
        }
    }
    
    applySlowEffect(factor, duration) {
        // Apply slow effect
        this.slowFactor = factor;
        this.slowTimer = duration;
        
        // Visual indication
        this.setTint(0x8888ff);
    }
    
    destroy() {
        // Clean up health bar
        if (this.healthBar) {
            this.healthBar.destroy();
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
        }
        
        // Call parent destroy
        super.destroy();
    }
}