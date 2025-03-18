class Ninja extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ninja');
        
        this.scene = scene;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 150;
        this.attackCooldown = 0;
        this.attackCooldownTime = 600; // ms between attacks
        
        // Initialize sprite
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics body
        this.body.setSize(24, 24);
        this.setCollideWorldBounds(true);
        
        // Initialize targeting
        this.targetX = x;
        this.targetY = y;
        this.moving = false;
        this.attackDirection = 'down'; // down, up, left, right
        
        // Start idle animation
        this.play('ninja-idle');
        
        // Create attack hitbox (invisible sprite used for collision detection)
        this.attackBox = scene.physics.add.sprite(x, y, null);
        this.attackBox.setVisible(false);
        this.attackBox.body.setSize(32, 32);
        this.attackBox.enemiesHit = []; // Track enemies hit by this attack
    }
    
    update() {
        // Update cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= this.scene.game.loop.delta;
        }
        
        // Handle movement
        if (this.moving) {
            // Calculate distance to target
            const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
            
            if (distance < 5) {
                // Reached destination
                this.moving = false;
                this.setVelocity(0, 0);
                this.play('ninja-idle', true);
            } else {
                // Move towards target
                this.scene.physics.moveTo(this, this.targetX, this.targetY, this.speed);
                
                // Update facing direction
                this.updateDirection();
                
                // Play animation if not already playing
                if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'ninja-run') {
                    this.play('ninja-run', true);
                }
            }
        }
    }
    
    moveToPosition(x, y) {
        // Set new target position
        this.targetX = x;
        this.targetY = y;
        this.moving = true;
        
        // Update facing direction
        this.updateDirection();
    }
    
    updateDirection() {
        // Calculate direction to target
        const dirX = this.targetX - this.x;
        const dirY = this.targetY - this.y;
        
        // Determine primary direction (horizontal or vertical)
        if (Math.abs(dirX) > Math.abs(dirY)) {
            // Horizontal movement is dominant
            if (dirX > 0) {
                this.attackDirection = 'right';
                this.setFlipX(false);
            } else {
                this.attackDirection = 'left';
                this.setFlipX(true);
            }
        } else {
            // Vertical movement is dominant
            if (dirY > 0) {
                this.attackDirection = 'down';
                this.setFlipX(false);
            } else {
                this.attackDirection = 'up';
                this.setFlipX(false);
            }
        }
    }
    
    attack(targetX, targetY) {
        // Check cooldown
        if (this.attackCooldown > 0) {
            return;
        }
        
        // Update attack direction based on target
        const dirX = targetX - this.x;
        const dirY = targetY - this.y;
        
        // Determine primary direction (horizontal or vertical)
        if (Math.abs(dirX) > Math.abs(dirY)) {
            // Horizontal attack
            if (dirX > 0) {
                this.attackDirection = 'right';
                this.setFlipX(false);
            } else {
                this.attackDirection = 'left';
                this.setFlipX(true);
            }
        } else {
            // Vertical attack
            if (dirY > 0) {
                this.attackDirection = 'down';
                this.setFlipX(false);
            } else {
                this.attackDirection = 'up';
                this.setFlipX(false);
            }
        }
        
        // Play attack animation
        this.play('ninja-attack', true);
        
        // Reset attack collisions
        this.attackBox.enemiesHit = [];
        
        // Position attack hitbox based on direction
        switch (this.attackDirection) {
            case 'right':
                this.attackBox.setPosition(this.x + 32, this.y);
                break;
            case 'left':
                this.attackBox.setPosition(this.x - 32, this.y);
                break;
            case 'down':
                this.attackBox.setPosition(this.x, this.y + 32);
                break;
            case 'up':
                this.attackBox.setPosition(this.x, this.y - 32);
                break;
        }
        
        // Create attack effect
        this.createAttackEffect();
        
        // Trigger attack collision detection
        this.scene.events.emit('ninjaAttack', this.attackBox);
        
        // Set cooldown
        this.attackCooldown = this.attackCooldownTime;
        
        // Play sound
        this.scene.sound.play('sword-slash');
    }
    
    createAttackEffect() {
        // Create slash effect at attack position
        const slash = this.scene.add.sprite(this.attackBox.x, this.attackBox.y, 'slash');
        
        // Set rotation based on attack direction
        switch (this.attackDirection) {
            case 'right':
                slash.setRotation(0);
                break;
            case 'left':
                slash.setRotation(Math.PI); // 180 degrees
                break;
            case 'down':
                slash.setRotation(Math.PI / 2); // 90 degrees
                break;
            case 'up':
                slash.setRotation(-Math.PI / 2); // -90 degrees
                break;
        }
        
        // Play animation
        slash.play('slash-anim');
        
        // Destroy when animation completes
        slash.once('animationcomplete', () => {
            slash.destroy();
        });
    }
    
    takeDamage(amount) {
        // Reduce health
        this.health = Math.max(0, this.health - amount);
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // Handle ninja death
        this.scene.game.globals.gameOver = true;
        this.scene.events.emit('gameOver');
    }
}