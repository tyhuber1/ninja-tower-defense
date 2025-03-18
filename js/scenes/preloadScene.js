class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // Show loading screen
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Add loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // Loading text
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Percent text
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        // Loading events
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // Load game assets
        // Map tiles
        this.load.image('tileset', 'assets/images/environment/tileset.png');
        this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
        
        // Character sprites
        this.load.spritesheet('ninja', 'assets/images/characters/ninja.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        // Enemy sprites
        this.load.spritesheet('enemy-basic', 'assets/images/enemies/enemy-basic.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        this.load.spritesheet('enemy-fast', 'assets/images/enemies/enemy-fast.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        this.load.spritesheet('enemy-tank', 'assets/images/enemies/enemy-tank.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        // Tower sprites
        this.load.image('tower-base', 'assets/images/towers/tower-base.png');
        this.load.image('tower-crossbow', 'assets/images/towers/tower-crossbow.png');
        this.load.image('tower-cannon', 'assets/images/towers/tower-cannon.png');
        this.load.image('tower-magic', 'assets/images/towers/tower-magic.png');
        this.load.image('tower-rocket', 'assets/images/towers/tower-rocket.png');
        
        // Projectile sprites
        this.load.image('arrow', 'assets/images/projectiles/arrow.png');
        this.load.image('cannonball', 'assets/images/projectiles/cannonball.png');
        this.load.image('magic-orb', 'assets/images/projectiles/magic-orb.png');
        this.load.image('rocket', 'assets/images/projectiles/rocket.png');
        
        // Effects
        this.load.spritesheet('explosion', 'assets/images/effects/explosion.png', { 
            frameWidth: 48, 
            frameHeight: 48 
        });
        this.load.spritesheet('slash', 'assets/images/effects/slash.png', { 
            frameWidth: 32, 
            frameHeight: 32 
        });
        
        // UI elements
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('button-pressed', 'assets/images/ui/button-pressed.png');
        this.load.image('panel', 'assets/images/ui/panel.png');
        this.load.image('gold-icon', 'assets/images/ui/gold-icon.png');
        this.load.image('heart-icon', 'assets/images/ui/heart-icon.png');
        
        // Audio
        this.load.audio('bgm', ['assets/audio/bgm.mp3']);
        this.load.audio('sword-slash', ['assets/audio/sword-slash.mp3']);
        this.load.audio('tower-place', ['assets/audio/tower-place.mp3']);
        this.load.audio('enemy-hit', ['assets/audio/enemy-hit.mp3']);
        this.load.audio('enemy-die', ['assets/audio/enemy-die.mp3']);
        this.load.audio('explosion-sound', ['assets/audio/explosion.mp3']);
    }

    create() {
        // Create animations
        this.createAnimations();
        
        // Proceed to main menu
        this.scene.start('MainMenuScene');
    }
    
    createAnimations() {
        // Ninja animations
        this.anims.create({
            key: 'ninja-idle',
            frames: this.anims.generateFrameNumbers('ninja', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'ninja-run',
            frames: this.anims.generateFrameNumbers('ninja', { start: 4, end: 11 }),
            frameRate: 12,
            repeat: -1
        });
        
        this.anims.create({
            key: 'ninja-attack',
            frames: this.anims.generateFrameNumbers('ninja', { start: 12, end: 15 }),
            frameRate: 15,
            repeat: 0
        });
        
        // Enemy animations
        this.anims.create({
            key: 'enemy-basic-walk',
            frames: this.anims.generateFrameNumbers('enemy-basic', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-fast-walk',
            frames: this.anims.generateFrameNumbers('enemy-fast', { start: 0, end: 5 }),
            frameRate: 15,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-tank-walk',
            frames: this.anims.generateFrameNumbers('enemy-tank', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        
        // Effect animations
        this.anims.create({
            key: 'explosion-anim',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: 0
        });
        
        this.anims.create({
            key: 'slash-anim',
            frames: this.anims.generateFrameNumbers('slash', { start: 0, end: 5 }),
            frameRate: 20,
            repeat: 0
        });
    }
}