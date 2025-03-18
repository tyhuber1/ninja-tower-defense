class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        
        this.map = null;
        this.tileset = null;
        this.groundLayer = null;
        this.pathLayer = null;
        this.obstacles = null;
        
        this.ninja = null;
        this.ninjaTarget = null;
        
        this.towers = null;
        this.enemies = null;
        this.projectiles = null;
        this.effects = null;
        
        this.path = [];
        this.waveConfig = null;
        this.waveTimer = null;
        this.enemySpawnTimer = null;
        this.enemiesLeft = 0;
    }

    create() {
        // Initialize game objects
        this.createMap();
        this.createGroups();
        this.createNinja();
        this.setupPathfinding();
        this.setupInput();
        this.setupWaves();
        this.setupCollisions();
        
        // Start background music
        this.sound.play('bgm', { loop: true, volume: 0.5 });
    }
    
    update(time, delta) {
        // Update ninja
        if (this.ninja) {
            this.ninja.update();
        }
        
        // Update towers
        if (this.towers) {
            this.towers.getChildren().forEach(tower => {
                tower.update(time, delta);
            });
        }
        
        // Update enemies
        if (this.enemies) {
            this.enemies.getChildren().forEach(enemy => {
                enemy.update();
            });
        }
    }
    
    createMap() {
        // Create tilemap
        this.map = this.make.tilemap({ key: 'map' });
        this.tileset = this.map.addTilesetImage('tileset', 'tileset');
        
        // Create layers
        this.groundLayer = this.map.createLayer('Ground', this.tileset, 0, 0);
        this.pathLayer = this.map.createLayer('Path', this.tileset, 0, 0);
        this.obstaclesLayer = this.map.createLayer('Obstacles', this.tileset, 0, 0);
        
        // Set collision for obstacles
        this.obstaclesLayer.setCollisionByProperty({ collides: true });
        
        // Get path points from object layer
        const pathPoints = [];
        const pathObjectLayer = this.map.getObjectLayer('PathPoints');
        
        if (pathObjectLayer && pathObjectLayer.objects) {
            // Sort path points by their name (which should be sequential)
            const sortedPoints = pathObjectLayer.objects.sort((a, b) => {
                return parseInt(a.name.replace('point', '')) - parseInt(b.name.replace('point', ''));
            });
            
            // Extract coordinates
            sortedPoints.forEach(point => {
                pathPoints.push({ x: point.x, y: point.y });
            });
            
            this.path = pathPoints;
        } else {
            // Fallback path if path object layer is missing
            this.path = [
                { x: 0, y: this.map.heightInPixels / 2 },
                { x: this.map.widthInPixels / 3, y: this.map.heightInPixels / 2 },
                { x: this.map.widthInPixels / 3, y: this.map.heightInPixels / 4 },
                { x: 2 * this.map.widthInPixels / 3, y: this.map.heightInPixels / 4 },
                { x: 2 * this.map.widthInPixels / 3, y: 3 * this.map.heightInPixels / 4 },
                { x: this.map.widthInPixels, y: 3 * this.map.heightInPixels / 4 }
            ];
        }
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
    
    createGroups() {
        this.towers = this.add.group();
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.effects = this.add.group();
    }
    
    createNinja() {
        // Create ninja sprite (will be replaced with Ninja class)
        this.ninja = new Ninja(
            this,
            this.map.widthInPixels / 2,
            this.map.heightInPixels / 2
        );
    }
    
    setupPathfinding() {
        // Simple grid-based pathfinding for the ninja
        // In a more complete implementation, use a library like EasyStar.js
        
        // Create a simple 2D grid to represent walkable areas
        const tileWidth = this.map.tileWidth;
        const tileHeight = this.map.tileHeight;
        
        this.grid = Array(Math.ceil(this.map.heightInPixels / tileHeight))
            .fill()
            .map(() => Array(Math.ceil(this.map.widthInPixels / tileWidth)).fill(1));
        
        // Mark obstacles on the grid (1 = walkable, 0 = obstacle)
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.obstaclesLayer.getTileAt(x, y);
                if (tile && tile.properties && tile.properties.collides) {
                    this.grid[y][x] = 0;
                }
            }
        }
    }
    
    setupInput() {
        // Left-click to move ninja
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                const targetX = pointer.worldX;
                const targetY = pointer.worldY;
                
                // Check if target is walkable
                const tileX = Math.floor(targetX / this.map.tileWidth);
                const tileY = Math.floor(targetY / this.map.tileHeight);
                
                // Simple bounds check
                if (tileX >= 0 && tileX < this.grid[0].length && 
                    tileY >= 0 && tileY < this.grid.length) {
                    
                    if (this.grid[tileY][tileX] === 1) {
                        // Set ninja target and move
                        this.ninja.moveToPosition(targetX, targetY);
                    }
                }
            } else if (pointer.rightButtonDown()) {
                // Right-click to attack
                this.ninja.attack(pointer.worldX, pointer.worldY);
            }
        });
        
        // Tower placement is handled by the UI Scene
        this.events.on('placeTower', (towerType, x, y) => {
            this.placeTower(towerType, x, y);
        });
    }
    
    setupWaves() {
        // Define wave configurations
        this.waveConfig = [
            // Wave 1: 10 basic enemies
            {
                enemies: [
                    { type: 'enemy-basic', count: 10, delay: 1500 }
                ],
                waveDelay: 5000
            },
            // Wave 2: 15 basic enemies, faster spawn
            {
                enemies: [
                    { type: 'enemy-basic', count: 15, delay: 1200 }
                ],
                waveDelay: 8000
            },
            // Wave 3: Basic + fast enemies
            {
                enemies: [
                    { type: 'enemy-basic', count: 10, delay: 1200 },
                    { type: 'enemy-fast', count: 5, delay: 2000 }
                ],
                waveDelay: 10000
            },
            // Wave 4: All enemy types
            {
                enemies: [
                    { type: 'enemy-basic', count: 15, delay: 1000 },
                    { type: 'enemy-fast', count: 8, delay: 1500 },
                    { type: 'enemy-tank', count: 3, delay: 3000 }
                ],
                waveDelay: 15000
            }
        ];
        
        // Start first wave after a short delay
        this.time.delayedCall(5000, () => {
            this.startWave(0);
        });
    }
    
    startWave(waveIndex) {
        // Check if all waves completed
        if (waveIndex >= this.waveConfig.length) {
            console.log('All waves completed!');
            // Victory condition
            this.events.emit('gameWin');
            return;
        }
        
        // Update wave counter
        this.game.globals.currentWave = waveIndex + 1;
        this.events.emit('waveStart', this.game.globals.currentWave);
        
        const wave = this.waveConfig[waveIndex];
        let totalEnemies = 0;
        
        // Count total enemies in this wave
        wave.enemies.forEach(enemyGroup => {
            totalEnemies += enemyGroup.count;
        });
        
        this.enemiesLeft = totalEnemies;
        
        // Spawn each enemy group
        wave.enemies.forEach(enemyGroup => {
            let spawned = 0;
            
            // Create timer to spawn enemies
            const spawnTimer = this.time.addEvent({
                delay: enemyGroup.delay,
                callback: () => {
                    this.spawnEnemy(enemyGroup.type);
                    spawned++;
                    
                    if (spawned >= enemyGroup.count) {
                        spawnTimer.remove();
                    }
                },
                callbackScope: this,
                repeat: enemyGroup.count - 1
            });
        });
        
        // Set timer for next wave
        this.waveTimer = this.time.delayedCall(wave.waveDelay + (wave.enemies[0].count * wave.enemies[0].delay), () => {
            if (this.enemiesLeft <= 0) {
                this.startWave(waveIndex + 1);
            } else {
                // Wait for remaining enemies to be defeated before starting next wave
                this.events.once('allEnemiesDefeated', () => {
                    this.startWave(waveIndex + 1);
                });
            }
        });
    }
    
    spawnEnemy(enemyType) {
        // Get first path point as spawn position
        const spawnPoint = this.path[0];
        
        // Create enemy based on type
        let enemy;
        switch (enemyType) {
            case 'enemy-basic':
                enemy = new Enemy(this, spawnPoint.x, spawnPoint.y, enemyType, this.path, {
                    speed: 50,
                    health: 100,
                    reward: 10
                });
                break;
            case 'enemy-fast':
                enemy = new Enemy(this, spawnPoint.x, spawnPoint.y, enemyType, this.path, {
                    speed: 80,
                    health: 60,
                    reward: 15
                });
                break;
            case 'enemy-tank':
                enemy = new Enemy(this, spawnPoint.x, spawnPoint.y, enemyType, this.path, {
                    speed: 30,
                    health: 300,
                    reward: 25
                });
                break;
        }
        
        // Add enemy to group
        if (enemy) {
            this.enemies.add(enemy);
            
            // Listen for enemy defeat
            enemy.on('defeated', this.onEnemyDefeated, this);
            
            // Listen for enemy reaching end of path
            enemy.on('reachedEnd', this.onEnemyReachedEnd, this);
        }
    }
    
    onEnemyDefeated(enemy) {
        // Award gold
        this.game.globals.gold += enemy.reward;
        this.events.emit('goldChanged', this.game.globals.gold);
        
        // Remove enemy
        enemy.destroy();
        
        // Update enemy counter
        this.enemiesLeft--;
        
        // Check if wave is cleared
        if (this.enemiesLeft <= 0) {
            this.events.emit('allEnemiesDefeated');
        }
    }
    
    onEnemyReachedEnd(enemy) {
        // Reduce player lives
        this.game.globals.lives--;
        this.events.emit('livesChanged', this.game.globals.lives);
        
        // Remove enemy
        enemy.destroy();
        
        // Update enemy counter
        this.enemiesLeft--;
        
        // Check if wave is cleared
        if (this.enemiesLeft <= 0) {
            this.events.emit('allEnemiesDefeated');
        }
        
        // Check game over condition
        if (this.game.globals.lives <= 0) {
            this.game.globals.gameOver = true;
            this.events.emit('gameOver');
        }
    }
    
    placeTower(towerType, x, y) {
        // Get tile position
        const tileX = Math.floor(x / this.map.tileWidth);
        const tileY = Math.floor(y / this.map.tileHeight);
        
        // Check if position is valid (not on path or obstacle)
        if (tileX >= 0 && tileX < this.grid[0].length && 
            tileY >= 0 && tileY < this.grid.length &&
            this.grid[tileY][tileX] === 1) {
            
            // Convert back to pixel position (centered on tile)
            const pixelX = (tileX * this.map.tileWidth) + (this.map.tileWidth / 2);
            const pixelY = (tileY * this.map.tileHeight) + (this.map.tileHeight / 2);
            
            // Check if tower already exists at this position
            const existingTower = this.towers.getChildren().find(tower => {
                return tower.x === pixelX && tower.y === pixelY;
            });
            
            if (existingTower) {
                console.log('Tower already exists at this position');
                return false;
            }
            
            // Create tower based on type
            let tower;
            let cost = 0;
            
            switch (towerType) {
                case 'crossbow':
                    tower = new Tower(this, pixelX, pixelY, 'tower-crossbow', {
                        range: 150,
                        fireRate: 1000,
                        damage: 20,
                        projectileType: 'arrow',
                        projectileSpeed: 300
                    });
                    cost = 100;
                    break;
                case 'cannon':
                    tower = new Tower(this, pixelX, pixelY, 'tower-cannon', {
                        range: 120,
                        fireRate: 2000,
                        damage: 40,
                        projectileType: 'cannonball',
                        projectileSpeed: 200,
                        splash: true,
                        splashRadius: 50
                    });
                    cost = 150;
                    break;
                case 'magic':
                    tower = new Tower(this, pixelX, pixelY, 'tower-magic', {
                        range: 180,
                        fireRate: 1500,
                        damage: 30,
                        projectileType: 'magic-orb',
                        projectileSpeed: 250,
                        effects: { slow: 0.5, duration: 2000 }
                    });
                    cost = 200;
                    break;
                case 'rocket':
                    tower = new Tower(this, pixelX, pixelY, 'tower-rocket', {
                        range: 200,
                        fireRate: 3000,
                        damage: 80,
                        projectileType: 'rocket',
                        projectileSpeed: 150,
                        splash: true,
                        splashRadius: 80
                    });
                    cost = 250;
                    break;
            }
            
            // Check if player has enough gold
            if (this.game.globals.gold < cost) {
                console.log('Not enough gold');
                return false;
            }
            
            // Deduct gold
            this.game.globals.gold -= cost;
            this.events.emit('goldChanged', this.game.globals.gold);
            
            // Add tower to group
            if (tower) {
                this.towers.add(tower);
                
                // Mark tile as occupied (0 = obstacle)
                this.grid[tileY][tileX] = 0;
                
                // Play tower placement sound
                this.sound.play('tower-place');
                
                return true;
            }
        }
        
        return false;
    }
    
    setupCollisions() {
        // Ninja collision with obstacles
        this.physics.add.collider(this.ninja, this.obstaclesLayer);
        
        // Projectile collision with enemies
        this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
            // Handle projectile hit
            projectile.hit(enemy);
        });
        
        // Ninja attack collision with enemies
        this.events.on('ninjaAttack', (attackBox) => {
            this.physics.add.overlap(attackBox, this.enemies, (attack, enemy) => {
                // Handle ninja attack hit
                this.sound.play('enemy-hit');
                
                // Damage enemy
                enemy.takeDamage(50);
                
                // Only hit each enemy once per attack
                attack.enemiesHit.push(enemy.id);
            }, (attack, enemy) => {
                // Custom process callback to ensure each enemy is only hit once per attack
                return !attack.enemiesHit.includes(enemy.id);
            });
        });
    }
    
    createExplosion(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion');
        explosion.play('explosion-anim');
        this.sound.play('explosion-sound');
        
        explosion.once('animationcomplete', () => {
            explosion.destroy();
        });
    }
}