class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load essential assets needed for the loading screen
        this.load.image('loading-background', 'assets/images/ui/loading-background.png');
        this.load.image('loading-bar', 'assets/images/ui/loading-bar.png');
    }

    create() {
        // Prepare any settings we need across the game
        this.scale.pageAlignHorizontally = true;
        
        // Start the preloader scene
        this.scene.start('PreloadScene');
    }
}