window.addEventListener('load', () => {
    // Create the Phaser game instance
    const game = new Phaser.Game(gameConfig);
    
    // Add some global game state
    game.globals = {
        score: 0,
        gold: 200,
        lives: 20,
        currentWave: 0,
        gameOver: false,
        activeTowerType: null,
        placingTower: false
    };
});