// --- KONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true, // WICHTIG: Erhält den Pixel-Look
    backgroundColor: '#000000', // Absolute Dunkelheit
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, PlayScene, GameOverScene]
};

const game = new Phaser.Game(config);

// --- GLOBAL VARIABLES ---
let hasBattery = false;

// --- SZENE: LADE-BILDSCHIRM ---
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    preload() {
        this.load.add_text('loadText', 400, 300, 'Lade Fabrik...', { font: '30px VT323', fill: '#fff' }).setOrigin(0.5);
        
        // --- DEINE ASSETS (Hier eigene Bilder hochladen!) ---
        // Wenn du keine Bilder hast, nutzt Phaser Standard-Ersatz.
        
        // Spieler (Pixel Sprite)
        this.load.spritesheet('player', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
        
        // Huggy Wuggy (Pixel Sprite)
        this.load.image('huggy', 'https://via.placeholder.com/64x96/0000ff/ff0000?text=HUGGY'); 
        
        // Items & Umgebung
        this.load.image('tiles', 'https://labs.phaser.io/assets/tilemaps/tiles/factory.png');
        this.load.image('battery', 'https://via.placeholder.com/32x32/ffff00/000000?text=BAT');
        this.load.image('door', 'https://via.placeholder.com/64x96/555555/000000?text=EXIT');
        this.load.image('hand_blue', 'https://via.placeholder.com/20x20/0000ff/ffffff?text=H');

        // Shader für Taschenlampe (Das macht es geil gruselig!)
        this.load.image('mask', 'https://labs.phaser.io/assets/tests/cameras/mask1.png');

        // SOUNDS (Optional: lade eigene .mp3 hoch)
        // this.load.audio('jumpscare', 'assets/jumpscare.mp3');
    }
    create() { this.scene.start('MenuScene'); }
}

// --- SZENE: HAUPTMENÜ ---
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(400, 200, 'POPPY 2D', { font: '90px VT323', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(400, 300, 'PIXEL ESCAPE', { font: '40px VT323', fill: '#fff' }).setOrigin(0.5);
        
        let playBtn = this.add.text(400, 450, '[ START ]', { font: '50px VT323', fill: '#ffff00' })
            .setOrigin(0.5)
            .setInteractive();

        playBtn.on('pointerdown', () => this.scene.start('PlayScene'));
        playBtn.on('pointerover', () => playBtn.setStyle({ fill: '#fff'}));
        playBtn.on('pointerout', () => playBtn.setStyle({ fill: '#ffff00'}));
    }
}

// --- SZENE: DAS SPIEL ---
class PlayScene extends Phaser.Scene {
    constructor() { super('PlayScene'); }

    create() {
        hasBattery = false; // Reset
        this.grabPackActive = false;

        // 1. Karte / Grenzen (Einfache Fabrik)
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // 2. SPIELER
        this.player = this.physics.add.sprite(200, 200, 'player').setScale(1.5).setOrigin(0.5);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10); // Immer oben

        // 3. HUGGY WUGGY (KI)
        this.huggy = this.physics.add.sprite(1400, 1000, 'huggy').setScale(1.2).setOrigin(0.5);
        this.huggy.setCollideWorldBounds(true);
        this.huggy.setDepth(9);

        // 4. ITEMS & OBJEKTE
        this.battery = this.physics.add.sprite(1500, 100, 'battery').setInteractive();
        this.door = this.physics.add.sprite(800, 50, 'door').setImmovable(true);
        this.blueHand = this.add.image(0, 0, 'hand_blue').setVisible(false).setDepth(11);

        // 5. STEUERUNG
        this.cursors = this.input.keyboard.createCursor_keys();
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // 6. TASCHENLAMPEN EFFEKT (Das atmosphärische Highlight)
        this.lightMask = this.make.image({
            x: this.player.x,
            y: this.player.y,
            key: 'mask',
            add: false
        }).setScale(0.5); // Größe des Lichtkegels

        // Dunkle Ebene über alles legen, außer was die Maske zeigt
        this.cameras.main.setMask(new Phaser.Display.Masks.BitmapMask(this, this.lightMask));
        
        // 7. INTERAKTIONEN
        // Batterie aufheben
        this.physics.add.overlap(this.player, this.battery, (p, b) => {
            b.destroy();
            hasBattery = true;
            this.tweens.add({ targets: this.blueHand, alpha: 0, duration: 200 }); // Effekt
            // this.sound.play('pickup'); // Sound
            alert("Batterie gefunden! Finde den Ausgang!");
        });

        // Tür erreichen
        this.physics.add.collider(this.player, this.door, (p, d) => {
            if (hasBattery) {
                this.scene.start('MenuScene');
                alert("ENTKOMMEN!");
            } else {
                this.add.text(this.door.x, this.door.y - 50, "Benötigt Batterie!", {font: '20px VT323', fill: '#f00'}).setOrigin(0.5);
            }
        });

        // Von Huggy erwischt werden (Jumpscare/Over)
        this.physics.add.overlap(this.player, this.huggy, () => {
            // this.sound.play('jumpscare'); // Sound
            this.scene.start('GameOverScene');
        });

        // 8. MOBILE STEUERUNG (Touch-Ziel)
        this.targetPoint = null;
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < 100 && pointer.y > 500) { // Ein einfacher "GrabPack"-Button Bereich
                this.activateGrabPack();
            } else {
                this.targetPoint = pointer.position;
            }
        });
    }

    update() {
        this.player.setVelocity(0);
        let speed = 250;

        // --- SCHRITT 1: STEUERUNG ---
        // PC (Keyboard)
        if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(speed);
        
        if (this.cursors.up.isDown) this.player.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(speed);

        // Mobile (Touch moveTo)
        if (this.targetPoint) {
            this.physics.moveToObject(this.player, this.targetPoint, speed);
            let dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.targetPoint.x, this.targetPoint.y);
            if (dist < 15) { this.player.body.reset(this.targetPoint.x, this.targetPoint.y); this.targetPoint = null; }
        }

        // --- SCHRITT 2: ATMOSPHÄRE UPDATE ---
        // Taschenlampe folgt Spieler
        this.lightMask.x = this.player.x;
        this.lightMask.y = this.player.y;

        // GrabPack Visualisierung
        if (this.grabPackActive) {
            this.blueHand.setPosition(this.player.x + 30, this.player.y);
        }

        // --- SCHRITT 3: HUGGY KI ---
        // Huggy verfolgt den Spieler unerbittlich
        this.physics.moveToObject(this.huggy, this.player, 120); // Huggy ist langsamer als du, aber stetig.
    }

    activateGrabPack() {
        this.grabPackActive = true;
        this.blueHand.setVisible(true).setAlpha(1);
        this.time.delayedCall(500, () => {
            this.grabPackActive = false;
            this.blueHand.setVisible(false);
        });
    }
}

// --- SZENE: GAME OVER (Jumpscare Ersatz) ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#500'); // Roter Hintergrund
        this.add.text(400, 300, 'HUGGY HAT DICH!', { font: '70px VT323', fill: '#000' }).setOrigin(0.5);
        
        let retryBtn = this.add.text(400, 450, '[ NOCHMAL ]', { font: '40px VT323', fill: '#fff' })
            .setOrigin(0.5)
            .setInteractive();
        retryBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
