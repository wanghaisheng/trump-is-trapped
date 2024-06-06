import { Soul } from "@opensouls/engine";
import { Text } from "nes-ui-react";
import { useCallback, useEffect, useRef, useState } from "react";
import tokens from "./.tokens.json";
import "./App.css";
import PixelEditor from "./components/PixelEditor";
import GameContainer from "./game/GameContainer";

function App() {
  const [tileBeingEdited, setTileBeingEdited] = useState<{ x: number; y: number } | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);

  const [soul, setSoul] = useState<Soul | null>(null);

  useEffect(() => {
    if (soul) {
      return;
    }

    const connectSoul = async () => {
      const soul = new Soul({
        organization: tokens.soulEngineOrganization,
        blueprint: "milton",
        soulId: "dev-001",
        token: tokens.soulEngineApiKey,
        debug: tokens.soulEngineDebug === "true",
      });

      await soul.connect();

      soul.on("says", async (event) => {
        const content = await event.content();

        setMessages((messages) => {
          if (!messages) {
            return [content];
          }

          const newMessages = [...messages, content];
          return newMessages.filter((message, index) => newMessages.indexOf(message) === index);
        });

        setTimeout(() => {
          if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
          }
        }, 100);
      });

      setSoul(soul);

      return () => {
        soul.disconnect();
      };
    };

    connectSoul();
  }, [soul]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "z") {
        emitGameEvent("toggle-talking", null);
      }
    };

    window.addEventListener("keyup", handleKeyPress);

    return () => {
      window.removeEventListener("keyup", handleKeyPress);
    };
  }, []);

  const handleTileClick = useCallback((x: number, y: number) => {
    console.log("Tile clicked", x, y);
    setTileBeingEdited({ x, y });
  }, []);

  const handleCancel = useCallback(() => {
    setTileBeingEdited(null);
    emitGameEvent("cancel-add-object", null);
  }, []);

  const handleAddedObject = useCallback(() => {
    setTileBeingEdited(null);
  }, []);

  const handleCanvasUpdate = useCallback(
    async (base64: string) => {
      // setMessages([]);

      soul?.dispatch({
        action: "addObject",
        content: `(image - ${base64.length} bytes)`,
        _metadata: {
          image: base64,
        },
      });
    },
    [soul]
  );

  return (
    <>
      <Text size="large">Milton is trapped in a room</Text>
      <div style={{ display: "flex", gap: 20 }}>
        <div className="app-content">
          <UiContainer tileBeingEdited={tileBeingEdited} onCancel={handleCancel} onAddedObject={handleAddedObject} />
          <GameContainer
            onTileClick={handleTileClick}
            onCanvasUpdate={handleCanvasUpdate}
            isInteractive={!tileBeingEdited}
          />
        </div>
        <div style={{ width: 512, height: 512, overflowY: "scroll", color: "#deb887" }} ref={messagesRef}>
          {messages.map((message, index) => (
            <Text key={index} size="large" style={{ marginBottom: "3rem" }}>
              {message}
            </Text>
          ))}
        </div>
      </div>
      {/* <Text size="large">{message}</Text> */}
    </>
  );
}

function UiContainer({
  tileBeingEdited,
  onAddedObject,
  onCancel,
}: {
  tileBeingEdited: { x: number; y: number } | null;
  onAddedObject: () => void;
  onCancel: () => void;
}) {
  const handleAddObject = (base64: string) => {
    emitGameEvent("add-base64-image", base64);
    onAddedObject();
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
