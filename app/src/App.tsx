import { Text } from "nes-ui-react";
import { useCallback, useState } from "react";
import "./App.css";
import PixelEditor from "./components/PixelEditor";
import GameContainer from "./game/GameContainer";

function App() {
  const [tileBeingEdited, setTileBeingEdited] = useState<{ x: number; y: number } | null>(null);

  const handleTileClick = useCallback((x: number, y: number) => {
    setTileBeingEdited({ x, y });
  }, []);

  const handleCancel = useCallback(() => {
    setTileBeingEdited(null);
    emitGameEvent("cancel-add-object", null);
  }, []);

  return (
    <>
      <Text>test</Text>
      <div className="app-content">
        <GameContainer onTileClick={handleTileClick} />
        <UiContainer tileBeingEdited={tileBeingEdited} onCancel={handleCancel} />
      </div>
    </>
  );
}

function UiContainer({
  tileBeingEdited,
  onCancel,
}: {
  tileBeingEdited: { x: number; y: number } | null;
  onCancel: () => void;
}) {
  const handleAddObject = (base64: string) => {
    emitGameEvent("add-base64-image", base64);
  };

  return <PixelEditor onAddObject={handleAddObject} onCancel={onCancel} isEditing={!!tileBeingEdited} />;
}

function emitGameEvent(event: string, data: unknown) {
  // @ts-expect-error wip
  const game = window.game as Phaser.Game;

  if (game.scene.scenes.length > 1) {
    const mainScene = game.scene.scenes[1]; // Adjust based on your scene structure
    mainScene.events.emit(event, data);
  }
}

export default App;
