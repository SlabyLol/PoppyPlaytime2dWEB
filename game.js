const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MenuScene, PlayScene, GameOverScene]
};

const game = new Phaser.Game(config);

// --- SZENE: MENÜ ---
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(400, 200, 'POPPY PLAYTIME 2D', { fontSize: '64px', fill: '#f00', fontFFamily: 'VT323' }).setOrigin(0.5);
        let btn = this.add.text(400, 400, 'START EXPERIMENT', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        
        btn.on('pointerdown', () => this.scene.start('PlayScene'));
    }
}

// --- SZENE: GAMEPLAY ---
class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    preload() {
        // WIR ERSTELLEN UNSERE EIGENEN SPRITES (Kein Weltraum-Mann mehr!)
        // Spieler-Grafik (Gelb für GrabPack-Hände)
        let canvas = this.textures.createCanvas('player_sprite', 32, 32);
        canvas.context.fillStyle = '#ffcc00';
        canvas.context.fillRect(0, 0, 32, 32);
        canvas.refresh();

        // Huggy Wuggy Grafik (Blau & Gruselig)
        let huggyCanvas = this.textures.createCanvas('huggy_sprite', 40, 60);
        huggyCanvas.context.fillStyle = '#0000ff'; // Blau
        huggyCanvas.context.fillRect(0, 0, 40, 60);
        huggyCanvas.context.fillStyle = '#ff0000'; // Rote Lippen
        huggyCanvas.context.fillRect(5, 45, 30, 10);
        huggyCanvas.refresh();

        // Batterie Grafik
        let batCanvas = this.textures.createCanvas('bat_sprite', 20, 20);
        batCanvas.context.fillStyle = '#00ff00';
        batCanvas.context.fillRect(0, 0, 20, 20);
        batCanvas.refresh();
    }

    create() {
        this.cameras.main.setBackgroundColor('#050505');
        this.hasBattery = false;

        // Spieler
        this.player = this.physics.add.sprite(100, 300, 'player_sprite');
        this.player.setCollideWorldBounds(true);

        // Huggy Wuggy
        this.huggy = this.physics.add.sprite(700, 300, 'huggy_sprite');
        
        // Batterie
        this.battery = this.physics.add.sprite(400, 100, 'bat_sprite');

        // Text-Anzeige
        this.infoText = this.add.text(20, 20, 'Finde die grüne Batterie!', { fontSize: '20px', fill: '#fff' });

        // Steuerung
        this.cursors = this.input.keyboard.createCursorKeys();

        // Kollisionen
        this.physics.add.overlap(this.player, this.battery, () => {
            this.battery.destroy();
            this.hasBattery = true;
            this.infoText.setText('Batterie gefunden! Entkomme Huggy!');
        });

        this.physics.add.overlap(this.player, this.huggy, () => {
            this.scene.start('GameOverScene');
        });

        // Mobile Steuerung
        this.input.on('pointerdown', (p) => {
            this.targetX = p.x;
            this.targetY = p.y;
        });
    }

    update() {
        this.player.setVelocity(0);
        let speed = 200;

        // PC Bewegung
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        // Mobile Bewegung
        if (this.targetX) {
            this.physics.moveTo(this.player, this.targetX, this.targetY, speed);
            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetX, this.targetY);
            if (dist < 10) { this.player.body.reset(this.targetX, this.targetY); this.targetX = null; }
        }

        // HUGGY KI: Er verfolgt dich!
        this.physics.moveToObject(this.huggy, this.player, 130);
    }
}

// --- SZENE: GAME OVER ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create() {
        this.add.text(400, 300, 'HUGGY HAT DICH GEFRESSEN', { fontSize: '40px', fill: '#f00' }).setOrigin(0.5);
        this.add.text(400, 400, 'Klicke zum Neustarten', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
