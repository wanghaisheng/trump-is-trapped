import Phaser from "phaser";

import { memo, useEffect } from "react";
import scenes from "./scenes";
import { HEIGHT_SCREEN, WIDTH_SCREEN } from "./scenes/Main";

const GameContainer = memo(({ onTileClick }: { onTileClick: (x: number, y: number) => void }) => {
  useEffect(() => {
    console.log("GameContainer");
    /**
     * https://photonstorm.github.io/phaser3-docs/Phaser.Types.Core.html#.GameConfig
     */

    const game = new Phaser.Game({
      width: WIDTH_SCREEN, // 1024
      height: HEIGHT_SCREEN, // 768
      parent: "phaser-game",
      title: "Phaser RPG",
      url: import.meta.env.VITE_APP_HOMEPAGE,
      version: import.meta.env.VITE_APP_VERSION,
      scene: scenes,
      physics: {
        default: "arcade",
        arcade: {
          // debug: import.meta.env.DEV,
        },
      },
      disableContextMenu: import.meta.env.PROD,
      backgroundColor: "#000",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: true,
    });

    game.registry.set("onTileClick", onTileClick);

    // @ts-expect-error wip
    window.game = game;

    return () => {
      game?.destroy(true);

      // @ts-expect-error wip
      window.game = null;
    };
  }, [onTileClick]);

  return (
    <div
      className="game-container"
      style={{
        width: `${WIDTH_SCREEN}px`,
        height: `${HEIGHT_SCREEN}px`,
      }}
    >
      <div id="phaser-game" />
    </div>
  );
});

export default GameContainer;
