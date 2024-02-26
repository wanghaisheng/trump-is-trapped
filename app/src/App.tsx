import { Text } from "nes-ui-react";
import { useCallback, useEffect, useState } from "react";
import { Soul } from "soul-engine/soul";
import tokens from "./.tokens.json";
import "./App.css";
import PixelEditor from "./components/PixelEditor";
import GameContainer from "./game/GameContainer";

function App() {
  const [tileBeingEdited, setTileBeingEdited] = useState<{ x: number; y: number } | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  // const [message, setMessage] = useState<string | null>(null);

  const [soul, setSoul] = useState<Soul | null>(null);

  useEffect(() => {
    if (soul) {
      return;
    }

    const connectSoul = async () => {
      const soul = new Soul({
        organization: "dooart",
        blueprint: "milton",
        soulId: tokens.soulId,
        token: tokens.soulEngineApiKey,
        debug: true,
      });

      await soul.connect();

      soul.on("says", async (event) => {
        const content = await event.content();
        console.log(123123, content);
        // emitGameEvent("player-says", content);
        // setMessage(content);

        setMessages((messages) => {
          if (!messages) {
            return [content];
          }

          const newMessages = [...messages, content];
          return newMessages.filter((message, index) => newMessages.indexOf(message) === index);
        });
      });

      setSoul(soul);

      return () => {
        soul.disconnect();
      };
    };

    connectSoul();
  }, [soul]);

  const handleTileClick = useCallback((x: number, y: number) => {
    setTileBeingEdited({ x, y });
  }, []);

  const handleCancel = useCallback(() => {
    setTileBeingEdited(null);
    emitGameEvent("cancel-add-object", null);
  }, []);

  const handleCanvasUpdate = useCallback(
    async (base64: string) => {
      setMessages([]);

      const content = await fetchGptVisionPreview(base64);
      console.log(content);

      soul?.dispatch({
        action: "describeObject",
        name: "Room",
        content: content,
        _metadata: {
          description: content,
        },
      });

      // soul?.dispatch({
      //   action: "addObject",
      //   content: base64.slice(0, 30),
      //   _metadata: {
      //     image: base64,
      //   },
      // });
    },
    [soul]
  );

  return (
    <>
      <div className="app-content">
        <GameContainer onTileClick={handleTileClick} onCanvasUpdate={handleCanvasUpdate} />
        <UiContainer tileBeingEdited={tileBeingEdited} onCancel={handleCancel} />
      </div>
      {messages.map((message, index) => (
        <Text key={index} size="large">
          {message}
        </Text>
      ))}
      {/* <Text size="large">{message}</Text> */}
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
    onCancel();
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

const fetchGptVisionPreview = async (base64Image: string) => {
  //   const content = `
  // - The human is positioned in the center of the image, facing downward.
  // - To the bottom right corner, there is a tennis racket.
  // `.trim();
  //   return content;

  const prompt = `
describe this pixel art image
- don't say it's pixel art
- ignore the gray floor and the beige wall
- ignore shadows
- there's a human in the image, just say where he is, don't describe him. refer to him like this "the human is..."
- use bulleted list, one item per object
`.trim();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.openAi}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  console.log(data);
  return data.choices[0].message.content;
};

export default App;
