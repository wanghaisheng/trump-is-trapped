import Phaser from "phaser";

import { key } from "../data";

export const CAMERA_ZOOM = 2;

enum Animation {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

type Cursors = Record<"w" | "a" | "s" | "d" | "up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key>;

const Velocity = {
  Horizontal: 175,
  Vertical: 175,
} as const;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  // @ts-expect-error wip
  body!: Phaser.Physics.Arcade.Body;
  cursors: Cursors;

  constructor(scene: Phaser.Scene, x: number, y: number, texture = key.atlas.player, frame = "player-idle-south.000") {
    super(scene, x, y, texture, frame);

    // Add the sprite to the scene
    scene.add.existing(this);

    // Enable physics for the sprite
    scene.physics.world.enable(this);

    // The image has a bit of whitespace so use setSize and
    // setOffset to control the size of the player's body
    this.setSize(16, 16).setOffset(0, 16);

    this.setScale(2);

    // Collide the sprite body with the world boundary
    this.setCollideWorldBounds(true);

    // Set the camera to follow the game object
    // scene.cameras.main.startFollow(this);

    // print camera x and y
    // console.log(scene.cameras.main.scrollX, scene.cameras.main.scrollY);
    // 252 1141

    // set camera x and y to 252 1141
    // scene.cameras.main.scrollX = -48;
    // scene.cameras.main.scrollY = 916;

    // Add cursor keys
    this.cursors = this.createCursorKeys();

    // Create sprite animations
    this.createAnimations();
  }

  /**
   * Track the arrow keys & WASD.
   */
  private createCursorKeys() {
    return this.scene.input.keyboard!.addKeys("w,a,s,d,up,left,down,right") as Cursors;
  }

  private createAnimations() {
    const anims = this.scene.anims;

    // Create left animation
    if (!anims.exists(Animation.Left)) {
      anims.create({
        key: Animation.Left,
        frames: anims.generateFrameNames(key.atlas.player, {
          prefix: "player-walk-west.",
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Create right animation
    if (!anims.exists(Animation.Right)) {
      anims.create({
        key: Animation.Right,
        frames: anims.generateFrameNames(key.atlas.player, {
          prefix: "player-walk-east.",
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Create up animation
    if (!anims.exists(Animation.Up)) {
      anims.create({
        key: Animation.Up,
        frames: anims.generateFrameNames(key.atlas.player, {
          prefix: "player-walk-north.",
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // Create down animation
    if (!anims.exists(Animation.Down)) {
      anims.create({
        key: Animation.Down,
        frames: anims.generateFrameNames(key.atlas.player, {
          prefix: "player-walk-south.",
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  update() {
    const { anims, body, cursors } = this;
    const prevVelocity = body.velocity.clone();

    // Stop any previous movement from the last frame
    body.setVelocity(0);

    // Horizontal movement
    switch (true) {
      case cursors.left.isDown:
      case cursors.a.isDown:
        body.setVelocityX(-Velocity.Horizontal);
        break;

      case cursors.right.isDown:
      case cursors.d.isDown:
        body.setVelocityX(Velocity.Horizontal);
        break;
    }

    // Vertical movement
    switch (true) {
      case cursors.up.isDown:
      case cursors.w.isDown:
        body.setVelocityY(-Velocity.Vertical);
        break;

      case cursors.down.isDown:
      case cursors.s.isDown:
        body.setVelocityY(Velocity.Vertical);
        break;
    }

    // Normalize and scale the velocity so that player can't move faster along a diagonal
    body.velocity.normalize().scale(Velocity.Horizontal);

    // Update the animation last and give left/right animations precedence over up/down animations
    switch (true) {
      case cursors.left.isDown:
      case cursors.a.isDown:
        anims.play(Animation.Left, true);
        break;

      case cursors.right.isDown:
      case cursors.d.isDown:
        anims.play(Animation.Right, true);
        break;

      case cursors.up.isDown:
      case cursors.w.isDown:
        anims.play(Animation.Up, true);
        break;

      case cursors.down.isDown:
      case cursors.s.isDown:
        anims.play(Animation.Down, true);
        break;

      default:
        anims.stop();

        // If we were moving, pick an idle frame to use
        switch (true) {
          case prevVelocity.x < 0:
            this.setTexture(key.atlas.player, "player-walk-west.000");
            break;
          case prevVelocity.x > 0:
            this.setTexture(key.atlas.player, "player-walk-east.000");
            break;
          case prevVelocity.y < 0:
            this.setTexture(key.atlas.player, "player-walk-north.000");
            break;
          case prevVelocity.y > 0:
            this.setTexture(key.atlas.player, "player-walk-south.000");
            break;
        }
    }
  }
}
