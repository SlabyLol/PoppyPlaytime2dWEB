const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true, // AKTIVIERT DEN PIXEL-LOOK
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player;
let cursors;

function preload() {
    // Hier fügst du deine Bilder ein (Pixel-Art Sprites)
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png'); 
    this.load.image('bg', 'https://labs.phaser.io/assets/skies/space3.png'); // Ersetze dies mit Fabrik-Texturen
}

function create() {
    this.add.image(400, 300, 'bg');
    
    // Spieler (dein Charakter mit dem GrabPack)
    player = this.physics.add.sprite(400, 300, 'player');
    player.setCollideWorldBounds(true);

    // Steuerung
    cursors = this.input.keyboard.createCursor_keys();

    // Mobile Steuerung: Klick/Touch bewegt den Spieler dorthin
    this.input.on('pointerdown', (pointer) => {
        this.physics.moveToObject(player, pointer, 200);
    });
}

function update() {
    // PC Steuerung
    player.setVelocity(0);

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        player.setVelocityY(160);
    }
}
