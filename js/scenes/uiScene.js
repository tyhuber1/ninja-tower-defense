class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        
        this.scoreText = null;
        this.goldText = null;
        this.livesText = null;
        this.waveText = null;
        
        this.towerButtons = [];
        this.selectedTower = null;
        this.towerPreview = null;
    }

    create() {
        // Get game scene reference
        this.gameScene = this.scene.get('GameScene');
        
        // Create UI containers
        this.createTopBar();
        this.createTowerPanel();
        
        // Listen for game events
        this.setupEventListeners();
        
        // Setup input
        this.setupInput();
    }
    
    update() {
        // Update tower preview position
        if (this.towerPreview && this.towerPreview.visible) {
            const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
            
            // Snap to grid
            const tileWidth = this.gameScene.map.tileWidth;
            const tileHeight = this.gameScene.map.tileHeight;
            
            const tileX = Math.floor(worldPoint.x / tileWidth);
            const tileY = Math.floor(worldPoint.y / tileHeight);
            
            const pixelX = (tileX * tileWidth) + (tileWidth / 2);
            const pixelY = (tileY * tileHeight) + (tileHeight / 2);
            
            this.towerPreview.x = pixelX;
            this.towerPreview.y = pixelY;
            
            // Check if placement is valid
            if (tileX >= 0 && tileX < this.gameScene.grid[0].length && 
                tileY >= 0 && tileY < this.gameScene.grid.length) {
                
                if (this.gameScene.grid[tileY][tileX] === 1) {
                    this.towerPreview.setTint(0x00ff00); // Green tint for valid
                } else {
                    this.towerPreview.setTint(0xff0000); // Red tint for invalid
                }
            } else {
                this.towerPreview.setTint(0xff0000);
            }
        }
    }
    
    createTopBar() {
        const width = this.cameras.main.width;
        
        // Create panel background
        const topPanel = this.add.rectangle(0, 0, width, 40, 0x000000, 0.7).setOrigin(0, 0);
        
        // Add game stats text
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            font: '16px Arial',
            fill: '#ffffff'
        });
        
        this.goldText = this.add.text(160, 10, 'Gold: ' + this.game.globals.gold, {
            font: '16px Arial',
            fill: '#ffff00'
        });
        
        this.livesText = this.add.text(width - 160, 10, 'Lives: ' + this.game.globals.lives, {
            font: '16px Arial',
            fill: '#ff0000'
        });
        
        this.waveText = this.add.text(width - 280, 10, 'Wave: ' + this.game.globals.currentWave, {
            font: '16px Arial',
            fill: '#ffffff'
        });
    }
    
    createTowerPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create panel background
        const bottomPanel = this.add.rectangle(0, height - 80, width, 80, 0x000000, 0.7).setOrigin(0, 0);
        
        // Define tower types
        const towerTypes = [
            { type: 'crossbow', name: 'Crossbow', cost: 100, description: 'Basic tower: Fast attack, low damage' },
            { type: 'cannon', name: 'Cannon', cost: 150, description: 'Splash damage to nearby enemies' },
            { type: 'magic', name: 'Magic', cost: 200, description: 'Slows enemies that it hits' },
            { type: 'rocket', name: 'Rocket', cost: 250, description: 'High damage with large splash' }
        ];
        
        // Create tower buttons
        const buttonWidth = 100;
        const buttonSpacing = 20;
        const totalWidth = (buttonWidth * towerTypes.length) + (buttonSpacing * (towerTypes.length - 1));
        let startX = (width - totalWidth) / 2;
        
        towerTypes.forEach((tower, index) => {
            const x = startX + (index * (buttonWidth + buttonSpacing));
            const y = height - 50;
            
            // Button background
            const button = this.add.rectangle(x, y, buttonWidth, 60, 0x333333, 1).setInteractive();
            
            // Tower icon
            const icon = this.add.image(x, y - 15, tower.type === 'crossbow' ? 'tower-crossbow' : 
                                           tower.type === 'cannon' ? 'tower-cannon' :
                                           tower.type === 'magic' ? 'tower-magic' : 'tower-rocket');
            icon.setScale(0.8);
            
            // Tower name
            const nameText = this.add.text(x, y + 10, tower.name, {
                font: '12px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            // Tower cost
            const costText = this.add.text(x, y + 25, tower.cost + ' G', {
                font: '10px Arial',
                fill: '#ffff00'
            }).setOrigin(0.5);
            
            // Group button elements
            const buttonGroup = { button, icon, nameText, costText, type: tower.type, cost: tower.cost };
            this.towerButtons.push(buttonGroup);
            
            // Button hover effect
            button.on('pointerover', () => {
                button.setFillStyle(0x555555);
                this.showTowerTooltip(x, y - 70, tower.description);
            });
            
            button.on('pointerout', () => {
                if (this.selectedTower !== tower.type) {
                    button.setFillStyle(0x333333);
                }
                this.hideTowerTooltip();
            });
            
            // Button click
            button.on('pointerdown', () => {
                this.selectTower(tower.type);
            });
        });
        
        // Create tower preview (initially hidden)
        this.towerPreview = this.add.image(0, 0, 'tower-base').setVisible(false).setAlpha(0.7);
        
        // Create cancel button
        const cancelButton = this.add.rectangle(width - 60, height - 30, 80, 30, 0x880000, 1).setInteractive();
        this.add.text(width - 60, height - 30, 'Cancel', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        cancelButton.on('pointerover', () => {
            cancelButton.setFillStyle(0xaa0000);
        });
        
        cancelButton.on('pointerout', () => {
            cancelButton.setFillStyle(0x880000);
        });
        
        cancelButton.on('pointerdown', () => {
            this.cancelTowerPlacement();
        });
    }
    
    showTowerTooltip(x, y, text) {
        // Remove any existing tooltip
        this.hideTowerTooltip();
        
        // Create tooltip background
        this.tooltip = this.add.rectangle(x, y, 180, 40, 0x000000, 0.8).setOrigin(0.5);
        
        // Create tooltip text
        this.tooltipText = this.add.text(x, y, text, {
            font: '12px Arial',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 170 }
        }).setOrigin(0.5);
    }
    
    hideTowerTooltip() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
        
        if (this.tooltipText) {
            this.tooltipText.destroy();
            this.tooltipText = null;
        }
    }
    
    selectTower(towerType) {
        // Reset previously selected button
        if (this.selectedTower) {
            this.towerButtons.forEach(button => {
                if (button.type === this.selectedTower) {
                    button.button.setFillStyle(0x333333);
                }
            });
        }
        
        // Set new selected tower
        this.selectedTower = towerType;
        
        // Highlight selected button
        this.towerButtons.forEach(button => {
            if (button.type === towerType) {
                button.button.setFillStyle(0x0a8f6a);
            }
        });
        
        // Show tower preview
        this.towerPreview.setTexture(
            towerType === 'crossbow' ? 'tower-crossbow' :
            towerType === 'cannon' ? 'tower-cannon' :
            towerType === 'magic' ? 'tower-magic' : 'tower-rocket'
        );
        this.towerPreview.setVisible(true);
        
        // Update game globals
        this.game.globals.placingTower = true;
        this.game.globals.activeTowerType = towerType;
    }
    
    cancelTowerPlacement() {
        // Reset selected tower
        if (this.selectedTower) {
            this.towerButtons.forEach(button => {
                if (button.type === this.selectedTower) {
                    button.button.setFillStyle(0x333333);
                }
            });
        }
        
        this.selectedTower = null;
        this.towerPreview.setVisible(false);
        
        // Update game globals
        this.game.globals.placingTower = false;
        this.game.globals.activeTowerType = null;
    }
    
    setupInput() {
        // Place tower on click
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.selectedTower) {
                const worldPoint = pointer.positionToCamera(this.cameras.main);
                
                // Try to place tower
                const success = this.gameScene.placeTower(this.selectedTower, worldPoint.x, worldPoint.y);
                
                if (success) {
                    // Tower was placed, reset selection
                    this.cancelTowerPlacement();
                }
            }
        });
    }
    
    setupEventListeners() {
        // Listen for game stats changes
        this.gameScene.events.on('scoreChanged', (score) => {
            this.scoreText.setText('Score: ' + score);
        });
        
        this.gameScene.events.on('goldChanged', (gold) => {
            this.goldText.setText('Gold: ' + gold);
            
            // Update button availability based on gold
            this.towerButtons.forEach(button => {
                if (gold < button.cost) {
                    button.button.setFillStyle(0x222222);
                    button.nameText.setTint(0x888888);
                    button.costText.setTint(0x888888);
                    button.button.disableInteractive();
                } else {
                    button.button.setFillStyle(0x333333);
                    button.nameText.setTint(0xffffff);
                    button.costText.setTint(0xffff00);
                    button.button.setInteractive();
                }
            });
        });
        
        this.gameScene.events.on('livesChanged', (lives) => {
            this.livesText.setText('Lives: ' + lives);
        });
        
        this.gameScene.events.on('waveStart', (wave) => {
            this.waveText.setText('Wave: ' + wave);
            
            // Show wave notification
            const width = this.cameras.main.width;
            const waveNotification = this.add.text(width / 2, 100, 'WAVE ' + wave + ' INCOMING!', {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setAlpha(0);
            
            // Animation for wave notification
            this.tweens.add({
                targets: waveNotification,
                alpha: 1,
                y: 150,
                duration: 1000,
                ease: 'Power2',
                yoyo: true,
                hold: 1000,
                onComplete: () => {
                    waveNotification.destroy();
                }
            });
        });
        
        // Game over events
        this.gameScene.events.on('gameOver', () => {
            this.showGameOver();
        });
        
        this.gameScene.events.on('gameWin', () => {
            this.showGameWin();
        });
    }
    
    showGameOver() {
        // Create semi-transparent background
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);
        
        // Game over text
        const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
            font: '48px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Final score
        const scoreText = this.add.text(width / 2, height / 2, 'Final Score: ' + this.game.globals.score, {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.rectangle(width / 2, height * 2/3, 200, 50, 0x1a6e35, 1).setInteractive();
        this.add.text(width / 2, height * 2/3, 'RESTART', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Button effects
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x2a9e45);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x1a6e35);
        });
        
        // Restart game
        restartButton.on('pointerdown', () => {
            // Reset game globals
            this.game.globals.score = 0;
            this.game.globals.gold = 200;
            this.game.globals.lives = 20;
            this.game.globals.currentWave = 0;
            this.game.globals.gameOver = false;
            this.game.globals.activeTowerType = null;
            this.game.globals.placingTower = false;
            
            // Restart scenes
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('MainMenuScene');
        });
    }
    
    showGameWin() {
        // Create semi-transparent background
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);
        
        // Victory text
        const victoryText = this.add.text(width / 2, height / 3, 'VICTORY!', {
            font: '48px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Final score
        const scoreText = this.add.text(width / 2, height / 2, 'Final Score: ' + this.game.globals.score, {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.rectangle(width / 2, height * 2/3, 200, 50, 0x1a6e35, 1).setInteractive();
        this.add.text(width / 2, height * 2/3, 'PLAY AGAIN', {
            font: '24px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Button effects
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x2a9e45);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x1a6e35);
        });
        
        // Restart game
        restartButton.on('pointerdown', () => {
            // Reset game globals
            this.game.globals.score = 0;
            this.game.globals.gold = 200;
            this.game.globals.lives = 20;
            this.game.globals.currentWave = 0;
            this.game.globals.gameOver = false;
            this.game.globals.activeTowerType = null;
            this.game.globals.placingTower = false;
            
            // Restart scenes
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('MainMenuScene');
        });
    }
}