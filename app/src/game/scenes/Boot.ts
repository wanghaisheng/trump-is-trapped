import { Scene } from "phaser";

import * as assets from "../assets";
import { key } from "../data";

export default class Boot extends Scene {
  constructor() {
    super(key.scene.boot);
  }

  preload() {
    this.load.image(key.image.interiors, assets.tilesets.interiors);
    this.load.image(key.image.rooms, assets.tilesets.rooms);
    this.load.tilemapTiledJSON(key.tilemap.main, assets.tilemaps.main);
    this.load.atlas(key.atlas.player, assets.atlas.image, assets.atlas.data);

    this.textures.on("addtexture", function (key: string) {
      console.log("Texture added globally:", key);
    });
  }

  create() {
    this.scene.start(key.scene.main);
  }
}
