class Tower extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, config) {
        super(scene, x, y, key);
        
        this.scene = scene;
        this.towerType = key;
        
        // Tower properties
        this.range = config.range || 150;
        this.fireRate = config.fireRate || 1000;
        this.damage = config.damage || 20;
        this.projectileType = config.projectileType || 'arrow';
        this.projectileSpeed = config.projectileSpeed || 300;
        
        // Special abilities
        this.splash = config.splash || false;
        this.splashRadius = config.splashRadius || 0;
        this.effects = config.effects || null;
        
        // Targeting
        this.target = null;
        this.lastFired = 0;
        
        // Initialize sprite
        scene.add.existing(this);
        
        // Add range indicator (circle)
        this.rangeIndicator = scene.add.circle(x, y, this.range, 0xffffff, 0.1);
        this.rangeIndicator.setVisible(false);
        
        // Add base
        this.base = scene.add.image(x, y, 'tower-base');
        this.base.setDepth(1);
        this.setDepth(2);
        
        // Show range indicator on hover
        this.setInteractive();
        this.on('pointerover', () => {
            this.rangeIndicator.setVisible(true);
        });
        
        this.on('pointerout', () => {
            this.rangeIndicator.setVisible(false);
        });
        
        // Initialize upgrade level
        this.level = 1;
        this.maxLevel = 3;
    }
    
    update(time, delta) {
        // Find target if none exists or current target is dead
        if (!this.target || !this.target.active) {
            this.findTarget();
        } else {
            // Check if target is still in range
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            if (distance > this.range) {
                this.target = null;
                this.findTarget();
            }
        }
        
        // Fire at target if available
        if (this.target && time > this.lastFired) {
            this.fire();
            this.lastFired = time + this.fireRate;
        }
        
        // Rotate tower to face target
        if (this.target) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            this.rotation = angle;
        }
    }
    
    findTarget() {
        // Get all active enemies
        const enemies = this.scene.enemies.getChildren().filter(enemy => enemy.active);
        
        // Find closest enemy in range
        let closestDistance = Infinity;
        let closestEnemy = null;
        
        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                enemy.x, enemy.y
            );
            
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        this.target = closestEnemy;
    }
    
    fire() {
        // Create projectile
        const projectile = new Projectile(
            this.scene,
            this.x,
            this.y,
            this.projectileType,
            {
                damage: this.damage,
                speed: this.projectileSpeed,
                target: this.target,
                splash: this.splash,
                splashRadius: this.splashRadius,
                effects: this.effects
            }
        );
        
        // Add to group
        this.scene.projectiles.add(projectile);
    }
    
    upgrade() {
        // Check if max level reached
        if (this.level >= this.maxLevel) {
            return false;
        }
        
        // Upgrade costs
        const upgradeCosts = [0, 50, 100]; // Level 1->2, 2->3
        const cost = upgradeCosts[this.level];
        
        // Check if player has enough gold
        if (this.scene.game.globals.gold < cost) {
            return false;
        }
        
        // Apply upgrade
        this.level++;
        
        // Upgrade stats based on tower type
        switch (this.towerType) {
            case 'tower-crossbow':
                this.damage *= 1.2;
                this.fireRate *= 0.9; // 10% faster firing
                break;
            case 'tower-cannon':
                this.damage *= 1.3;
                this.splashRadius *= 1.2;
                break;
            case 'tower-magic':
                this.damage *= 1.2;
                if (this.effects && this.effects.slow) {
                    this.effects.slow -= 0.1; // Stronger slow effect
                }
                break;
            case 'tower-rocket':
                this.damage *= 1.4;
                this.splashRadius *= 1.3;
                break;
        }
        
        // Visual upgrade indication
        this.setScale(1 + (this.level - 1) * 0.1);
        
        // Deduct gold
        this.scene.game.globals.gold -= cost;
        this.scene.events.emit('goldChanged', this.scene.game.globals.gold);
        
        return true;
    }
}