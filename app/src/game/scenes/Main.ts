import Phaser from "phaser";

import { key } from "../data";
import { Player } from "../sprites";
import { CAMERA_ZOOM } from "../sprites/Player";

export const WIDTH_SCREEN = 512;
export const HEIGHT_SCREEN = 512;

export default class Main extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private tiles: Phaser.GameObjects.Rectangle[] = [];
  private selectedTile: Phaser.GameObjects.Rectangle | null = null;
  private mouth!: Phaser.GameObjects.Rectangle;
  private isTalking: boolean = false;

  constructor() {
    super(key.scene.main);
  }

  create() {
    const map = this.make.tilemap({ key: key.tilemap.main });

    const tilesetInteriors = map.addTilesetImage("interiors", key.image.interiors)!;
    const tilesetRooms = map.addTilesetImage("rooms", key.image.rooms)!;
    const allTilesets = [tilesetInteriors, tilesetRooms];

    const layers = ["World"];
    const allLayers = layers.map((layer) => map.createLayer(layer, allTilesets, 0, 0)!);

    allLayers.forEach((layer) => {
      layer.setCollisionByProperty({ collides: true });
    });

    const [worldLayer] = allLayers;
    this.physics.world.bounds.width = worldLayer.width;
    this.physics.world.bounds.height = worldLayer.height;

    this.cameras.main.setZoom(CAMERA_ZOOM);

    const width = WIDTH_SCREEN / CAMERA_ZOOM;
    const height = HEIGHT_SCREEN / CAMERA_ZOOM;
    this.player = new Player(this, width / 2, height / 2);

    this.cameras.main.scrollX = -width / 2;
    this.cameras.main.scrollY = -height / 2;

    allLayers.forEach((layer) => {
      this.physics.add.collider(this.player, layer);
    });

    this.mouth = this.add.rectangle(width / 2, height / 2 + 12, 2, 2, 0x333333);
    this.mouth.setVisible(false);

    const platforms = this.physics.add.staticGroup();
    this.physics.add.collider(this.player, platforms);

    this.events.on("add-base64-image", (base64: string) => {
      console.log("received base64 image", base64);
      const key = Date.now().toString();
      this.addBase64Image(base64, key);
    });

    this.events.on("cancel-add-object", () => {
      this.tiles.forEach((tile) => {
        tile.setFillStyle(0xffffff, 0);
      });

      this.selectedTile = null;
    });

    this.events.on("toggle-talking", () => {
      this.isTalking = !this.isTalking;
      if (this.isTalking) {
        this.mouth.setVisible(true);
        this.animateMouth();
      } else {
        this.tweens.killTweensOf(this.mouth); // Stop the animation
        this.mouth.setVisible(false);
      }
    });

    // this.events.on("player-says", (message: string) => {
    //   if (this.lastMessage === message) {
    //     return;
    //   }

    //   if (this.currentText) {
    //     this.currentText.destroy();
    //     this.currentText = null;
    //   }

    //   this.lastMessage = message;

    //   const fontFamily = '"Press Start 2P", monospace';
    //   const playerY = this.player.y;
    //   const textX = 10;
    //   const textY = playerY - 50;
    //   this.currentText = this.add.text(textX, textY, message, {
    //     fontFamily,
    //     fontSize: "8px",
    //     color: "#000",
    //     padding: {
    //       left: 10,
    //       right: 10,
    //       top: 10,
    //       bottom: 10,
    //     },
    //   });
    // });

    this.textures.on("addtexture", (textureKey: string) => {
      console.log(`Texture added with key: ${textureKey}, now creating sprite.`);
      const x = this.selectedTile?.x || this.player.x;
      const y = this.selectedTile?.y || this.player.y;
      const dynamicImage = this.physics.add.image(x, y, textureKey);
      this.physics.add.collider(dynamicImage, this.platforms);

      if (dynamicImage) {
        console.log(`Sprite created successfully with key: ${textureKey}`, dynamicImage);
      } else {
        console.log(`Failed to create sprite with key: ${textureKey}`);
      }

      this.resetTileHighlights();
      this.selectedTile = null;
    });

    this.createTiles();
  }

  animateMouth() {
    let state = 0;
    // const initialY = this.mouth.y;
    const createEvent = () => {
      this.time.addEvent({
        delay: Phaser.Math.Between(100, 400),
        callback: () => {
          if (!this.isTalking) {
            return;
          }
          state = (state + 1) % 3;
          switch (state) {
            case 0:
              this.mouth.setVisible(true);
              this.mouth.setScale(1, 1);
              // this.mouth.setY(initialY);
              break;
            case 1:
              this.mouth.setVisible(true);
              this.mouth.setScale(2, 1);
              // this.mouth.setY(initialY);
              break;
            case 2:
              this.mouth.setVisible(true);
              this.mouth.setScale(2, 2);
              // this.mouth.setY(initialY + 1);
              break;
          }
          createEvent();
        },
        callbackScope: this,
      });
    };
    createEvent();
  }

  createTiles() {
    const tileSize = 32;
    const stepSize = tileSize / 2;

    const tiles = [];

    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        const tile = this.add
          .rectangle(
            x * stepSize * CAMERA_ZOOM + (tileSize / 2) * CAMERA_ZOOM, // Center point x
            y * stepSize * CAMERA_ZOOM + (tileSize / 2) * CAMERA_ZOOM, // Center point y
            tileSize * CAMERA_ZOOM,
            tileSize * CAMERA_ZOOM,
            0xffffff,
            0
          )
          .setInteractive();

        tile.on("pointerover", () => {
          if (this.selectedTile) {
            return;
          }

          tile.setFillStyle(0xffffff, 0.2);
        });

        tile.on("pointerout", () => {
          if (this.selectedTile !== tile) {
            tile.setFillStyle(0xffffff, 0);
          }
        });

        tile.on("pointerdown", () => {
          this.resetTileHighlights();

          const onTileClick = this.game.registry.get("onTileClick");
          if (onTileClick) {
            onTileClick(x, y); // Invoke the callback with the tile coordinates

            this.selectedTile = tile;
            tile.setFillStyle(0xddddff, 0.4);
          }
        });

        tiles.push(tile);
      }
    }

    this.tiles = tiles;
  }

  update() {
    this.player.update();
  }

  addBase64Image(base64: string, key: string) {
    console.log(`Attempting to add image with key: ${key}`);

    // Create a new Image object
    const image = new Image();
    image.onload = () => {
      if (this.selectedTile) {
        this.player.jumpAwayFrom(this.selectedTile);
      }

      console.log(`Image loaded, adding to textures with key: ${key}`);
      // Add the image as a base64 texture
      this.textures.addImage(key, image);
      // const x = this.selectedTile?.x || this.player.x;
      // const y = this.selectedTile?.y || this.player.y;
      // this.add.sprite(x, y, key);

      setTimeout(() => {
        const base64Image = this.exportCanvasAsBase64();
        const onCanvasUpdate = this.game.registry.get("onCanvasUpdate");
        if (onCanvasUpdate) {
          console.log("onCanvasUpdate");
          onCanvasUpdate(base64Image);
        }
      }, 500);
    };
    image.onerror = (error) => {
      console.error(`Error loading image with key: ${key}`, error);
    };
    // Set the source of the image object to trigger the loading process
    image.src = base64;
  }

  resetTileHighlights() {
    this.selectedTile?.setFillStyle(0xffffff, 0);
    this.selectedTile = null;
    this.tiles.forEach((tile) => {
      if (tile !== this.selectedTile) {
        tile.setFillStyle(0xffffff, 0);
      }
    });
  }

  exportCanvasAsBase64() {
    // Assuming 'this' is a reference to your Phaser scene
    const canvas = this.game.canvas;

    // Convert the canvas content to a base64 string (PNG format by default)
    const base64Image = canvas.toDataURL();

    return base64Image;
  }
}
