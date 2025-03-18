class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Add background color
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);
        
        // Add game title
        const title = this.add.text(width / 2, height / 4, 'NINJA TOWER DEFENSE', {
            font: '36px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 2, stroke: true, fill: true }
        });
        title.setOrigin(0.5);
        
        // Create start game button
        const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#1a6e35',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        });
        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });
        
        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.setStyle({ backgroundColor: '#2a9e45' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ backgroundColor: '#1a6e35' });
        });
        
        // Start game on button click
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
        
        // Add instructions
        const instructionsText = [
            'Left-click to move ninja',
            'Right-click to attack enemies',
            'Build towers to defend against waves of enemies'
        ];
        
        let y = height / 2 + 100;
        for (const line of instructionsText) {
            this.add.text(width / 2, y, line, {
                font: '18px Arial',
                fill: '#ffffff'
            }).setOrigin(0.5);
            y += 30;
        }
        
        // Add a footer credit
        this.add.text(width / 2, height - 50, '© 2025 Ninja Tower Defense', {
            font: '14px Arial',
            fill: '#888888'
        }).setOrigin(0.5);
    }
}