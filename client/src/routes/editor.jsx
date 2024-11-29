import {createFileRoute} from "@tanstack/react-router";
import {Canvas, FabricImage, Group, Rect} from "fabric";
import {Crop, Eraser, ImageDown, Store, Upload, UserSquare2, X} from "lucide-react";
import * as React from "react";
import BackgroundRemovalModal from "../components/BackgroundRemovalModal";
import HandleExportImage from "../components/HandleExportImage";
import PFPModal from "../components/PFPModal";
import ProfileSection from "../components/ProfileSection";
import {ButtonWithTooltip} from "../components/Tooltip";
import {useAuth} from "../contexts/AuthContext";

export const Route = createFileRoute("/editor")({
  component: RouteComponent,
});

function Market({handleAddHat}) {
  const HATS = ["/hat-1.png", "/hat-2.png", "/hat-3.png"];
  return (
    <div className="fixed right-0 h-screen w-[30rem] top-0 bg-neutral-900 transform  z-10  flex-wrap gap-4 p-4 flex space-x-2">
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
  const [showPFPModal, setShowPFPModal] = React.useState(false);
  const [showBgRemovalModal, setShowBgRemovalModal] = React.useState(false);
  const cropRectRef = React.useRef(null);
  const [error, setError] = React.useState("");
  const {user} = useAuth();
  const fileInputRef = React.useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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

  const handleImageUpload = (event) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const fileType = file.type.toLowerCase();
    if (fileType === "image/svg+xml" || fileType === "image/gif") {
      setError("SVG and GIF files are not supported. Please upload a static, raster image format (PNG or JPEG).");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      setError("Unsupported file type. Please upload a PNG, JPEG or WebP image.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const imgSrc = e.target.result;
      const imageElement = new Image();
      imageElement.src = imgSrc;
      imageElement.onload = function () {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = imageElement.width;
        tempCanvas.height = imageElement.height;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(imageElement, 0, 0);

        const convertedImage = new Image();
        convertedImage.src = tempCanvas.toDataURL("image/png");

        convertedImage.onload = () => {
          let image = new FabricImage(convertedImage);

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

      imageElement.onerror = function () {
        setError("Failed to load image. Please try a different file.");
        event.target.value = "";
      };
    };

    reader.onerror = function () {
      setError("Failed to read file. Please try again.");
      event.target.value = "";
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

    const originalWidth = imageObject.width;
    const originalHeight = imageObject.height;
    const currentAngle = imageObject.angle || 0;
    const currentScaleX = imageObject.scaleX || 1;
    const currentScaleY = imageObject.scaleY || 1;
    const flipX = imageObject.flipX;
    const flipY = imageObject.flipY;

    imageObject.set({angle: 0});
    canvas.renderAll();

    const rect = cropRect.getBoundingRect();
    const imageRect = imageObject.getBoundingRect();

    const relativeLeft = (rect.left - imageRect.left) / currentScaleX;
    const relativeTop = (rect.top - imageRect.top) / currentScaleY;
    const relativeWidth = rect.width / currentScaleX;
    const relativeHeight = rect.height / currentScaleY;

    const cropX = (relativeLeft / imageRect.width) * originalWidth;
    const cropY = (relativeTop / imageRect.height) * originalHeight;
    const cropWidth = (relativeWidth / imageRect.width) * originalWidth;
    const cropHeight = (relativeHeight / imageRect.height) * originalHeight;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext("2d");

    const img = imageObject.getElement();
    tempCtx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedImg = new Image();
    croppedImg.src = tempCanvas.toDataURL("image/png");

    croppedImg.onload = () => {
      const croppedFabricImage = new FabricImage(croppedImg);

      croppedFabricImage.set({
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
        originX: "center",
        originY: "center",
        angle: currentAngle,
        flipX: flipX,
        flipY: flipY,
        scaleX: 1,
        scaleY: 1,
      });

      canvas.remove(imageObject);
      canvas.remove(cropRect);

      canvas.add(croppedFabricImage);
      canvas.setActiveObject(croppedFabricImage);

      cropRectRef.current = null;
      delete canvas.imageToClip;
      setIsCropping(false);
      canvas.renderAll();
    };
  };

  const cancelCrop = () => {
    if (!canvas || !cropRectRef.current) return;

    canvas.remove(cropRectRef.current);
    cropRectRef.current = null;
    delete canvas.imageToClip;
    setIsCropping(false);
    canvas.renderAll();
  };

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
              <div className="group flex gap-5 flex-col items-center cursor-pointer">
            <ButtonWithTooltip icon={Upload} tooltip="Upload Image" onClick={() => fileInputRef.current?.click()} />
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} style={{display: "none"}} />
            <ButtonWithTooltip icon={ImageDown} tooltip="Export Image" onClick={() => HandleExportImage(canvas)} />
            <ButtonWithTooltip icon={Store} tooltip="Toggle Marketplace" onClick={() => setMarket(!market)} active={market} />
            <ButtonWithTooltip icon={Crop} tooltip="Crop Image" onClick={isCropping ? cancelCrop : startCropping} active={isCropping} />
            <ButtonWithTooltip icon={UserSquare2} tooltip="Get Profile Picture" onClick={() => setShowPFPModal(true)} />
            <ButtonWithTooltip icon={Eraser} tooltip="Remove Background" onClick={() => setShowBgRemovalModal(true)} />
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="py-[1px] px-3 bg-neutral-300 w-full"></div>
            <ProfileSection />
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full" />

      {market && <Market handleAddHat={handleAddHat} />}

      {isCropping && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900 p-4 rounded-lg flex gap-4">
          <button className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition" onClick={applyCrop}>
            Apply Crop
          </button>
          <button className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-800 transition" onClick={cancelCrop}>
            <X size={24} />
          </button>
        </div>
      )}

      {error && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">{error}</div>}

      <PFPModal isOpen={showPFPModal} onClose={() => setShowPFPModal(false)} onSelect={handlePFPSelect} />
      <BackgroundRemovalModal isOpen={showBgRemovalModal} onClose={() => setShowBgRemovalModal(false)} canvas={canvas} />

    </div>
  );
}

export default RouteComponent;
