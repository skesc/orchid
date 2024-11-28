import {createFileRoute} from "@tanstack/react-router";
import {Canvas, FabricImage, Group, Rect} from "fabric";
import {Crop, ImageDown, Store, Upload, X} from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function Market({handleAddHat}) {
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  return (
    <div className="fixed right-0 h-screen w-[30rem] top-0 bg-gray-900 transform z-10 flex-wrap gap-4 p-4 flex space-x-2">
      {HATS.map((hat, i) => (
        <img key={i} src={hat} alt={`Hat ${i + 1}`} className="h-20 z-10 cursor-pointer hover:opacity-70" onClick={() => handleAddHat(hat)} />
      ))}
    </div>
  );
}

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const [market, setMarket] = React.useState(true);
  const [isCropping, setIsCropping] = React.useState(false);
  const cropRectRef = React.useRef(null);

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#02061700",
        allowTouchScrolling: true,
        preserveObjectStacking: true,
      });

      // Add event listener for mouse down to handle group selection
      initCanvas.on("mouse:down", (opt) => {
        const evt = opt.e;
        if (evt.ctrlKey) {
          const target = opt.target;
          if (target && target.group) {
            initCanvas.setActiveObject(target.group);
            initCanvas.renderAll();
          }
        }
      });

      // Modify the selection behavior
      initCanvas.on("selection:created", (opt) => {
        const activeObj = opt.target;
        if (activeObj && activeObj.type === "group") {
          activeObj.subTargetCheck = !opt.e.ctrlKey;
          initCanvas.renderAll();
        }
      });

      // Update group interaction based on ctrl key
      initCanvas.on("mouse:move", (opt) => {
        const activeObj = initCanvas.getActiveObject();
        if (activeObj && activeObj.type === "group") {
          activeObj.subTargetCheck = !opt.e.ctrlKey;
        }
      });

      const handleResize = () => {
        initCanvas.setWidth(window.innerWidth);
        initCanvas.setHeight(window.innerHeight);
        initCanvas.renderAll();
      };
      window.addEventListener("resize", handleResize);

      // Key event handlers
      const handleKeyDown = (event) => {
        // Delete selected object (including groups)
        if ((event.key === "Backspace" || event.key === "Delete") && initCanvas) {
          const activeObject = initCanvas.getActiveObject();
          if (activeObject) {
            const parentGroup = activeObject.group;

            if (parentGroup) {
              parentGroup.remove(activeObject);

              if (parentGroup.getObjects().length === 0) {
                initCanvas.remove(parentGroup);
              }
            } else {
              initCanvas.remove(activeObject);
            }

            initCanvas.discardActiveObject();
            initCanvas.renderAll();
          }
        }

        // Group objects with Ctrl + G
        if (event.ctrlKey && event.key === "g") {
          event.preventDefault();
          const selectedObjects = initCanvas.getActiveObjects();
          if (selectedObjects.length > 1) {
            const group = new Group(selectedObjects, {
              interactive: true,
              subTargetCheck: true,
              backgroundColor: "#f00f0022",
            });

            selectedObjects.forEach((obj) => initCanvas.remove(obj));
            initCanvas.add(group);
            initCanvas.setActiveObject(group);
            initCanvas.renderAll();
          }
        }

        // Ungroup with Ctrl + U
        if (event.ctrlKey && event.key === "u") {
          event.preventDefault();
          const activeObject = initCanvas.getActiveObject();

          if (activeObject && activeObject.type === "group") {
            const items = activeObject.getObjects();
            initCanvas.remove(activeObject);

            items.forEach((item) => {
              initCanvas.add(item);
            });

            initCanvas.discardActiveObject();
            const sel = new fabric.ActiveSelection(items, {
              canvas: initCanvas,
            });
            initCanvas.setActiveObject(sel);
            initCanvas.renderAll();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      setCanvas(initCanvas);
      initCanvas.renderAll();

      return () => {
        initCanvas.dispose();
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  const handleExportImage = () => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const dataURL = activeObject.toDataURL({
        format: "png",
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = "selected-object.png";
      link.href = dataURL;
      link.click();
    } else {
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
    }
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

        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;

        if (image.width > maxWidth || image.height > maxHeight) {
          const scaleFactorWidth = maxWidth / image.width;
          const scaleFactorHeight = maxHeight / image.height;
          const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
          image.scale(scaleFactor);
        }

        image.set({
          selectable: true,
          hasControls: true,
          hoverCursor: "default",
          lockMovementX: false,
          lockMovementY: false,
          evented: true,
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

  const startCropping = () => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      alert("Please select an image to crop");
      return;
    }

    setIsCropping(true);

    canvas.imageToClip = activeObject;

    // create crop rectangle
    const bounds = activeObject.getBoundingRect();
    const cropRect = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: "rgba(0,0,0,0.3)",
      stroke: "#fff",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: "white",
      cornerStrokeColor: "black",
      cornerSize: 10,
      transparentCorners: false,
    });

    cropRectRef.current = cropRect;
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();
  };

  const applyCrop = () => {
    if (!canvas || !cropRectRef.current || !canvas.imageToClip) return;

    const imageObject = canvas.imageToClip;
    const cropRect = cropRectRef.current;

    // store the current image properties
    const currentScaleX = imageObject.scaleX || 1;
    const currentScaleY = imageObject.scaleY || 1;
    const currentLeft = imageObject.left;
    const currentTop = imageObject.top;

    const rect = cropRect.getBoundingRect();
    const imageRect = imageObject.getBoundingRect();

    const relativeLeft = rect.left - imageRect.left;
    const relativeTop = rect.top - imageRect.top;

    const normalizedLeft = relativeLeft / imageRect.width;
    const normalizedTop = relativeTop / imageRect.height;
    const normalizedWidth = rect.width / imageRect.width;
    const normalizedHeight = rect.height / imageRect.height;

    // create clip path using the normalized coordinates
    const clipPath = new Rect({
      left: -imageObject.width / 2 + normalizedLeft * imageObject.width,
      top: -imageObject.height / 2 + normalizedTop * imageObject.height,
      width: normalizedWidth * imageObject.width,
      height: normalizedHeight * imageObject.height,
      absolutePositioned: false,
    });

    // apply the clip path while preserving scale and position
    imageObject.clipPath = clipPath;
    imageObject.set({
      scaleX: currentScaleX,
      scaleY: currentScaleY,
      left: currentLeft,
      top: currentTop,
    });

    canvas.remove(cropRect);
    cropRectRef.current = null;
    delete canvas.imageToClip;
    setIsCropping(false);
    canvas.renderAll();
  };

  const cancelCrop = () => {
    if (!canvas || !cropRectRef.current) return;

    canvas.remove(cropRectRef.current);
    cropRectRef.current = null;
    delete canvas.imageToClip;
    setIsCropping(false);
    canvas.renderAll();
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <div className="fixed h-screen w-20 z-10 p-4">
        <div className="w-full h-full flex flex-col items-center py-4 rounded-lg bg-gray-900">
          <div className="group flex gap-5 flex-col items-center cursor-pointer">
            <img src="https://sakura.rex.wf/linear/orchird" alt="orchird" className="h-8 rounded-full" />
            <label htmlFor="fileinp" className="text-gray-100 hover:text-blue-400 transition cursor-pointer">
              <Upload size={24} />
            </label>
            <input hidden id="fileinp" type="file" accept="image/*" onChange={handleImageUpload} />
            <button className="text-gray-100 hover:text-blue-400 transition" onClick={handleExportImage}>
              <ImageDown size={24} />
            </button>
            <button onClick={() => setMarket(!market)} className="text-gray-100 hover:text-blue-400 transition">
              <Store size={24} />
            </button>
            <div className="py-[1px] px-3 bg-gray-700 rounded-md"></div>
            <button className={`text-gray-100 hover:text-blue-400 transition ${isCropping ? "text-blue-400" : ""}`} onClick={startCropping}>
              <Crop size={24} />
            </button>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
      {market && <Market handleAddHat={handleAddHat} />}
      {isCropping && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 p-4 rounded-lg flex gap-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={applyCrop}>
            Apply Crop
          </button>
          <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition" onClick={cancelCrop}>
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

export default RouteComponent;
