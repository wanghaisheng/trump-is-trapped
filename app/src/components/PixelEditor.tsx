import { Dotting, DottingRef, PixelModifyItem, useBrush, useData, useDotting } from "dotting";
import { Button } from "nes-ui-react";
import { useEffect, useRef } from "react";

export default function PixelEditor({
  onAddObject,
  onCancel,
  isEditing,
}: {
  onAddObject: (base64: string) => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor, brushColor } = useBrush(ref);

  const { setData } = useDotting(ref);
  const { dataArray } = useData(ref);

  const gridSquareLength = 12;

  useEffect(() => {
    setTimeout(() => {
      reset(setData);
    }, 100);
  }, [setData]);

  function convert(data: Array<Array<PixelModifyItem>>): Promise<string> {
    return new Promise((resolve, reject) => {
      const size = data.length;
      const pixelSize = 2;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D context"));
        return;
      }

      canvas.width = size * pixelSize;
      canvas.height = size * pixelSize;

      data.forEach((row) => {
        row.forEach((cell) => {
          const isWhite = cell.color.toLowerCase() === "#ffffff";
          ctx.fillStyle = isWhite || !cell.color ? "rgba(0, 0, 0, 0)" : cell.color;
          ctx.fillRect(cell.columnIndex * pixelSize, cell.rowIndex * pixelSize, pixelSize, pixelSize);
        });
      });

      canvas.toBlob((blob) => {
        const reader = new FileReader();
        if (!reader || !blob) throw new Error("Could not create FileReader or blob");

        reader.onloadend = () => {
          if (!reader.result) throw new Error("Could not read result");

          if (typeof reader.result !== "string") {
            throw new Error("Result is not a string");
          }

          resolve("data:image/png;base64," + reader.result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
  }

  return (
    <div
      style={{
        visibility: isEditing ? "visible" : "hidden",
      }}
    >
      <div className="dotting-container">
        <div className="dotting-canvas">
          <Dotting ref={ref} width="100%" height="100%" isGridFixed gridSquareLength={gridSquareLength}></Dotting>
        </div>

        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 10,
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 13, paddingBottom: 5 }}>Brush Color</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            {[
              "#FF0000",
              "#0000FF",
              "#00FF00",
              "#FF00FF",
              "#00FFFF",
              "#FFFF00",
              "#7c4700",
              "#101010",
              "#666666",
              "#FFFFFF",
            ].map((color) => (
              <div
                key={color}
                style={{
                  flexShrink: 0,
                  display: "inline-block",
                  padding: 3,
                  paddingBottom: 1,
                  border: brushColor === color ? "2px solid white" : "2px solid black",
                }}
              >
                <div
                  onClick={changeBrushColor.bind(null, color)}
                  style={{
                    width: 25,
                    height: 25,
                    border: "2px solid white",
                    backgroundColor: color,
                    cursor: "var(--cursor-click-url),pointer",
                    display: "inline-block",
                    lineHeight: "20px",
                  }}
                />
              </div>
            ))}
          </div>
        </>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button
            color="primary"
            size="large"
            onClick={async () => {
              const image = await convert(dataArray);
              onAddObject(image);
              reset(setData);
            }}
          >
            Add object
          </Button>
          <Button
            size="large"
            onClick={() => {
              reset(setData);
            }}
          >
            Clear
          </Button>
        </div>
        <Button
          size="large"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

async function reset(setData: (data: Array<Array<PixelModifyItem>>) => void) {
  const gridHeight = 32;
  const gridWidth = 32;

  const data: Array<Array<PixelModifyItem>> = [];
  for (let i = 0; i < gridHeight; i++) {
    const row: Array<PixelModifyItem> = [];
    for (let j = 0; j < gridWidth; j++) {
      row.push({ rowIndex: i, columnIndex: j, color: "" });
    }
    data.push(row);
  }

  setData(data);
}
