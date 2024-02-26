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

  constructor() {
    super(key.scene.main);
  }

  create() {
    const map = this.make.tilemap({ key: key.tilemap.main });

    const tilesetInteriors = map.addTilesetImage("interiors", key.image.interiors)!;
    const tilesetRooms = map.addTilesetImage("rooms", key.image.rooms)!;
    const allTilesets = [tilesetInteriors, tilesetRooms];

    const layers = ["World"]; //, "World2", "Things", "Things2"];
    // const layers = ["World", "World2", "Things", "Things2"];
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
    });

    this.textures.on("addtexture", (textureKey: string) => {
      console.log(`Texture added with key: ${textureKey}, now creating sprite.`);
      // Create the sprite now that the texture is available
      const dynamicImage = this.physics.add.image(this.player.x, this.player.y, textureKey);
      this.physics.add.collider(dynamicImage, this.platforms);

      if (dynamicImage) {
        console.log(`Sprite created successfully with key: ${key}`, dynamicImage);
      } else {
        console.log(`Failed to create sprite with key: ${key}`);
      }
    });

    this.createTiles();
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
      console.log(`Image loaded, adding to textures with key: ${key}`);
      // Add the image as a base64 texture
      this.textures.addImage(key, image);
      this.add.sprite(400, 300, key);
    };
    image.onerror = (error) => {
      console.error(`Error loading image with key: ${key}`, error);
    };
    // Set the source of the image object to trigger the loading process
    image.src = base64;
  }
}
