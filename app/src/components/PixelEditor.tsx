import { Dotting, DottingRef, PixelModifyItem, useData, useDotting } from "dotting";
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
          ctx.fillStyle = cell.color || "rgba(0, 0, 0, 0)";
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
      <div className="dotting-canvas">
        <Dotting ref={ref} width="100%" height="100%" isGridFixed gridSquareLength={gridSquareLength}></Dotting>
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
