import {createFileRoute} from "@tanstack/react-router";
import {Canvas, FabricImage} from "fabric";
import * as React from "react";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  // TODO: HARDCODED FOR NOW
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: 500,
        height: 500,
      });

      const handleKeyDown = (event) => {
        if ((event.key === "Backspace" || event.key === "Delete") && initCanvas) {
          const activeObject = initCanvas.getActiveObject();
          if (activeObject) {
            initCanvas.remove(activeObject);
            initCanvas.discardActiveObject();
            initCanvas.renderAll();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      initCanvas.backgroundColor = "#ddd";
      initCanvas.renderAll();
      setCanvas(initCanvas);
      return () => {
        initCanvas.dispose();
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  const handleExportImage = () => {
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0,
    });

    const link = document.createElement("a");
    link.download = "canvas-image.png";
    link.href = dataURL;
    link.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const imgSrc = e.target.result;
      let imageElement = document.createElement("img");
      imageElement.src = imgSrc;
      imageElement.onload = function () {
        let image = new FabricImage(imageElement);

        if (image.width > 700) {
          const scaleFactor = 700 / image.width;
          image.scale(scaleFactor);
        }

        canvas.setWidth(Math.min(image.width, 700));
        canvas.setHeight(image.height * (canvas.width / image.width));

        // Make image non-movable
        image.set({
          lockMovementX: true,
          lockMovementY: true,
          hasControls: false,
          hasBorders: false,
        });

        canvas.add(image);
        canvas.centerObject(image);
        canvas.renderAll();
      };
    };
  };

  const handleAddHat = (hatUrl) => {
    if (!canvas) return;
    let imageElement = document.createElement("img");
    imageElement.src = hatUrl;

    imageElement.onload = function () {
      let image = new FabricImage(imageElement);
      canvas.add(image);
      canvas.centerObject(image);
      canvas.renderAll();
    };
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex space-x-2">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="" />
        <button onClick={handleExportImage} className="">
          Export Image
        </button>
      </div>

      <canvas ref={canvasRef}></canvas>
      <div className="flex mt-4 space-x-2">
        {HATS.map((hat, i) => (
          <img key={i} src={hat} alt={`Hat ${i + 1}`} className="h-20 cursor-pointer hover:opacity-70" onClick={() => handleAddHat(hat)} />
        ))}
      </div>
    </div>
  );
}

export default RouteComponent;
