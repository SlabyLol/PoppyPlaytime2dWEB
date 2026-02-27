const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MenuScene, PlayScene, GameOverScene]
};

const game = new Phaser.Game(config);

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(400, 200, 'POPPY PLAYTIME', { fontSize: '80px', fill: '#00f', fontFamily: 'VT323' }).setOrigin(0.5);
        let startBtn = this.add.text(400, 400, 'START', { fontSize: '40px', fill: '#fff', backgroundColor: '#333', padding: 10 }).setOrigin(0.5).setInteractive();
        startBtn.on('pointerdown', () => this.scene.start('PlayScene'));
    }
}

class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    preload() {
        // 1. FABRIKBODEN (Gitter-Muster)
        let b = this.textures.createCanvas('floor', 64, 64);
        b.context.fillStyle = '#222'; b.context.fillRect(0, 0, 64, 64);
        b.context.strokeStyle = '#333'; b.context.strokeRect(0, 0, 64, 64);
        b.refresh();

        // 2. SPIELER (Gelb)
        let p = this.textures.createCanvas('player', 32, 32);
        p.context.fillStyle = '#ffcc00'; p.context.fillRect(4, 4, 24, 24);
        p.refresh();

        // 3. HUGGY (Blau)
        let h = this.textures.createCanvas('huggy', 40, 60);
        h.context.fillStyle = '#0000aa'; h.context.fillRect(0, 0, 40, 60);
        h.context.fillStyle = '#fff'; h.context.fillRect(10, 10, 5, 5); h.context.fillRect(25, 10, 5, 5);
        h.refresh();

        // 4. LICHT-MASKE (Taschenlampe)
        let m = this.textures.createCanvas('mask', 300, 300);
        let grad = m.context.createRadialGradient(150, 150, 0, 150, 150, 150);
        grad.addColorStop(0, 'rgba(255,255,255,1)'); // Zentrum hell
        grad.addColorStop(1, 'rgba(255,255,255,0)'); // Rand dunkel
        m.context.fillStyle = grad;
        m.context.fillRect(0, 0, 300, 300);
        m.refresh();
    }

    create() {
        // Welt-Größe
        const worldWidth = 1600;
        const worldHeight = 1200;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Boden-Kacheln erstellen (Damit man sieht, dass man sich bewegt!)
        this.add.tileSprite(worldWidth/2, worldHeight/2, worldWidth, worldHeight, 'floor');

        // Huggy & Spieler
        this.huggy = this.physics.add.sprite(800, 800, 'huggy');
        this.player = this.physics.add.sprite(200, 200, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Kamera folgt dem Spieler
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // --- TASCHENLAMPEN-SYSTEM ---
        // Eine schwarze Ebene über das ganze Spiel legen
        this.darkness = this.add.graphics();
        this.darkness.fillStyle(0x000000, 0.95); // 95% Dunkelheit
        this.darkness.fillRect(0, 0, worldWidth, worldHeight);
        this.darkness.setDepth(100);

        // Das Licht-Bild, das die Dunkelheit "löscht"
        this.lightCircle = this.add.image(this.player.x, this.player.y, 'mask');
        this.lightCircle.setDepth(101);
        this.lightCircle.setVisible(false); // Wir nutzen es nur als Maske

        // Maske aktivieren
        this.darkness.mask = new Phaser.Display.Masks.BitmapMask(this, this.lightCircle);
        this.darkness.mask.invertAlpha = true;

        // Steuerung
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Touch/Mobile
        this.target = null;
        this.input.on('pointerdown', (p) => { this.target = {x: p.worldX, y: p.worldY}; });

        // Kollision
        this.physics.add.overlap(this.player, this.huggy, () => this.scene.start('GameOverScene'));
    }

    update() {
        let speed = 250;
        this.player.setVelocity(0);

        // Bewegung
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        // Mobile
        if (this.target) {
            this.physics.moveTo(this.player, this.target.x, this.target.y, speed);
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 10) this.target = null;
        }

        // LICHT FOLGT SPIELER
        this.lightCircle.x = this.player.x;
        this.lightCircle.y = this.player.y;

        // Huggy verfolgt dich
        this.physics.moveToObject(this.huggy, this.player, 140);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create() {
        this.add.text(400, 300, 'ERWISCHT!', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
