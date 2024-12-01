import { createFileRoute } from "@tanstack/react-router";
import { Canvas, FabricImage } from "fabric";
import { Crop, Eraser, ImageDown, Layers, Sliders, Store, Type, Upload, UserSquare2 } from "lucide-react";
import * as React from "react";
import BackgroundRemovalModal from "../components/editor/BackgroundRemovalModal";
import { CropControls, useCropManager } from "../components/editor/CropControls";
import HandleExportImage from "../components/editor/HandleExportImage";
import ImageAdjustments from "../components/editor/ImageAdjustments";
import LayerPanel from "../components/editor/LayerPanel";
import Market from "../components/editor/Market";
import PFPModal from "../components/editor/PFPModal";
import ProfileSection from "../components/editor/ProfileSection";
import TextEditor from "../components/editor/TextEditor";
import { ButtonWithTooltip } from "../components/editor/Tooltip";
import { handleDragLeave, handleDragOver, handleDrop, handleImageUpload } from "../utils/ImageHandlers";
import { createKeyboardHandler } from "../utils/KeyboardHandlers";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function RouteComponent() {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState(null);
  const [market, setMarket] = React.useState(false);
  const [showPFPModal, setShowPFPModal] = React.useState(false);
  const [showBgRemovalModal, setShowBgRemovalModal] = React.useState(false);
  const [showTextPanel, setShowTextPanel] = React.useState(false);
  const cropRectRef = React.useRef(null);
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef(null);
  const [showAdjustments, setShowAdjustments] = React.useState(false);
  const [showLayers, setShowLayers] = React.useState(true);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#02061700",
        uniScaleKey: "shiftKey",
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

      const keyboardHandler = createKeyboardHandler(initCanvas, {
        onUpload: () => fileInputRef.current?.click(),
        onExport: () => HandleExportImage(initCanvas),
        onMarket: () => setMarket((prev) => !prev),
        onCrop: () => (isCropping ? cancelCrop() : startCropping()),
        onPfp: () => setShowPFPModal(true),
        onBgRemove: () => setShowBgRemovalModal(true),
        onAdjustments: () => setShowAdjustments((prev) => !prev),
        onText: () => setShowTextPanel(true),
        onLayers: () => setShowLayers((prev) => !prev),
      });

      document.addEventListener("keydown", keyboardHandler);

      setCanvas(initCanvas);
      initCanvas.renderAll();

      return () => {
        initCanvas.dispose();
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("keydown", keyboardHandler);
      };
    }
  }, []);

  const handleLocalDragOver = (e) => {
    setIsDragging(handleDragOver(e));
  };

  const handleLocalDragLeave = (e) => {
    setIsDragging(handleDragLeave(e));
  };

  const handleLocalDrop = (e) => {
    setIsDragging(false);
    handleDrop(e, canvas, setError);
  };

  const handleLocalImageUpload = (event) => {
    handleImageUpload(event, canvas, setError);
  };

  const handleAddHat = (hatUrl) => {
    if (!canvas) return;
    let imageElement = document.createElement("img");
    imageElement.src = hatUrl;
    imageElement.onload = function () {
      let image = new FabricImage(imageElement, {
        id: `hat-${Date.now()}`,
        name: `Hat ${canvas.getObjects().length + 1}`,
        selectable: true,
        hasControls: true,
        evented: true,
      });

      canvas.add(image);
      canvas.centerObject(image);
      canvas.setActiveObject(image);
      canvas.renderAll();
    };
  };

  const {isCropping, startCropping, applyCrop, cancelCrop} = useCropManager(canvas);

  const handlePFPSelect = async (url) => {
    if (!canvas || !url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = (e) => {
        const imgElement = new Image();
        imgElement.src = e.target.result;

        imgElement.onload = () => {
          const fabricImage = new FabricImage(imgElement, {
            scaleX: 0.5,
            scaleY: 0.5,
          });

          canvas.add(fabricImage);
          canvas.centerObject(fabricImage);
          canvas.setActiveObject(fabricImage);
          canvas.renderAll();
        };
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      setError("Failed to load profile picture. Please try again.");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-violet-400 bg-[linear-gradient(to_right,#80808042_1px,transparent_1px),linear-gradient(to_bottom,#80808042_1px,transparent_1px)] bg-[size:48px_48px] inset-0">
      <div className="fixed h-screen w-24 z-10 p-5">
        <div className="w-full box-shadow-3d h-full flex flex-col items-center justify-between py-4 bg-neutral-200 rounded-lg">
          <div className="flex gap-4 flex-col items-center">
            <ButtonWithTooltip icon={Upload} tooltip="Upload Image" shortcut="U" onClick={() => fileInputRef.current?.click()} />
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLocalImageUpload} style={{display: "none"}} />
            <ButtonWithTooltip icon={ImageDown} tooltip="Export Image" shortcut="E" onClick={() => HandleExportImage(canvas)} />
            <ButtonWithTooltip icon={Store} tooltip="Toggle Marketplace" shortcut="M" onClick={() => setMarket(!market)} active={market} />
            <ButtonWithTooltip icon={Crop} tooltip="Crop Image" shortcut="C" onClick={isCropping ? cancelCrop : startCropping} active={isCropping} />
            <ButtonWithTooltip icon={UserSquare2} tooltip="Get Profile Picture" shortcut="P" onClick={() => setShowPFPModal(true)} />
            <ButtonWithTooltip icon={Eraser} tooltip="Remove Background" shortcut="B" onClick={() => setShowBgRemovalModal(true)} />
            <ButtonWithTooltip icon={Sliders} tooltip="Image Adjustments" shortcut="I" onClick={() => setShowAdjustments(!showAdjustments)} active={showAdjustments} />
            <ButtonWithTooltip icon={Type} tooltip="Add Text" shortcut="T" onClick={() => setShowTextPanel(true)} active={showTextPanel} />
            <ButtonWithTooltip icon={Layers} tooltip="Layers" shortcut="L" onClick={() => setShowLayers(!showLayers)} active={showLayers} />
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="py-[1px] px-3 bg-neutral-300 w-full"></div>
            <ProfileSection />
          </div>
        </div>
      </div>
      <div className={`w-screen h-screen overflow-hidden ${isDragging ? "bg-violet-500/20" : ""} transition-all duration-300 ease-in-out`} onDragOver={handleLocalDragOver} onDragLeave={handleLocalDragLeave} onDrop={handleLocalDrop}>
        <canvas ref={canvasRef} className="w-full h-full transition-transform duration-300 ease-in-out" />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform scale-100 opacity-100">
              <p className="text-lg font-semibold text-violet-600 transition-colors duration-300">Drop your image here</p>
            </div>
          </div>
        )}
      </div>

      {showLayers && <LayerPanel canvas={canvas} />}
      {showAdjustments && <ImageAdjustments canvas={canvas} />}
      <TextEditor canvas={canvas} isOpen={showTextPanel} onClose={() => setShowTextPanel(false)} />
      {market && <Market handleAddHat={handleAddHat} canvas={canvas} />}
      <CropControls canvas={canvas} isActive={isCropping} onComplete={applyCrop} onCancel={cancelCrop} />

      {error && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">{error}</div>}

      <PFPModal isOpen={showPFPModal} onClose={() => setShowPFPModal(false)} onSelect={handlePFPSelect} />
      <BackgroundRemovalModal isOpen={showBgRemovalModal} onClose={() => setShowBgRemovalModal(false)} canvas={canvas} />
    </div>
  );
}

export default RouteComponent;
