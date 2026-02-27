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

// --- SZENE: MENÜ ---
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(400, 200, 'POPPY PLAYTIME', { fontSize: '80px', fill: '#00f', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(400, 280, '2D PIXEL EDITION', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
        
        let startBtn = this.add.text(400, 450, 'ÜBERLEBEN STARTEN', { fontSize: '30px', fill: '#ffff00', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5).setInteractive();

        startBtn.on('pointerdown', () => this.scene.start('PlayScene'));
    }
}

// --- SZENE: GAMEPLAY ---
class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    preload() {
        // HIER GENERIEREN WIR ECHTE PIXEL-GRAFIKEN PER CODE
        // Spieler (Gelbes GrabPack)
        let p = this.textures.createCanvas('player', 32, 32);
        p.context.fillStyle = '#ffcc00'; p.context.fillRect(8, 8, 16, 24); // Körper
        p.context.fillStyle = '#00f'; p.context.fillRect(0, 12, 8, 8);   // Blaue Hand links
        p.context.fillStyle = '#f00'; p.context.fillRect(24, 12, 8, 8);  // Rote Hand rechts
        p.refresh();

        // Huggy Wuggy (Blau, Gruselig)
        let h = this.textures.createCanvas('huggy', 40, 80);
        h.context.fillStyle = '#0000aa'; h.context.fillRect(5, 0, 30, 80); // Langer Körper
        h.context.fillStyle = '#ffff00'; h.context.fillRect(5, 70, 10, 10); h.context.fillRect(25, 70, 10, 10); // Füße
        h.context.fillStyle = '#ff0000'; h.context.fillRect(10, 10, 20, 15); // Mund
        h.context.fillStyle = '#fff'; h.context.fillRect(12, 12, 5, 5); h.context.fillRect(23, 12, 5, 5); // Augen
        h.refresh();
        
        // Licht-Maske für Taschenlampe
        let m = this.textures.createCanvas('mask', 400, 400);
        let grad = m.context.createRadialGradient(200, 200, 0, 200, 200, 200);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        m.context.fillStyle = grad;
        m.context.fillRect(0, 0, 400, 400);
        m.refresh();
    }

    create() {
        // Dunkle Atmosphäre
        this.cameras.main.setBackgroundColor('#0a0a0a');
        this.physics.world.setBounds(0, 0, 1200, 1200);

        // Huggy Wuggy
        this.huggy = this.physics.add.sprite(1000, 1000, 'huggy');
        
        // Spieler
        this.player = this.physics.add.sprite(200, 200, 'player');
        this.player.setCollideWorldBounds(true);
        this.cameras.main.startFollow(this.player);

        // TASCHENLAMPE (Der "geile" Effekt)
        this.light = this.add.image(0, 0, 'mask').setOrigin(0.5);
        this.light.setBlendMode(Phaser.BlendModes.ERASE);

        const container = this.add.container(0, 0, [this.light]);
        const mask = new Phaser.Display.Masks.BitmapMask(this, container);
        mask.invertAlpha = true;
        this.cameras.main.setMask(mask);

        // Steuerung
        this.cursors = this.input.keyboard.createCursorKeys();

        // Game Over Event
        this.physics.add.overlap(this.player, this.huggy, () => {
            this.scene.start('GameOverScene');
        });
        
        // Touch Steuerung für Mobile
        this.target = null;
        this.input.on('pointerdown', (p) => { this.target = {x: p.worldX, y: p.worldY}; });
    }

    update() {
        let speed = 250;
        this.player.setVelocity(0);

        // Tastatur
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        // Mobile Move
        if (this.target) {
            this.physics.moveTo(this.player, this.target.x, this.target.y, speed);
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.target.x, this.target.y) < 10) this.target = null;
        }

        // Licht folgt Spieler
        this.light.x = this.player.x;
        this.light.y = this.player.y;

        // HUGGY KI (Er schleicht hinterher)
        this.physics.moveToObject(this.huggy, this.player, 160);
    }
}

// --- SZENE: GAME OVER ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#300');
        this.add.text(400, 300, 'HUGGY HAT DICH!', { fontSize: '60px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(400, 400, 'KLICKEN ZUM NEUSTART', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
