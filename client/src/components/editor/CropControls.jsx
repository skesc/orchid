import {X} from "lucide-react";
import React from "react";
import {CropManager} from "./CropManager";

export function CropControls({canvas, isActive, onComplete, onCancel}) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900 p-4 rounded-lg flex gap-4">
      <button className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition" onClick={onComplete}>
        Apply Crop
      </button>
      <button className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-800 transition" onClick={onCancel}>
        <X size={24} />
      </button>
    </div>
  );
}

export function useCropManager(canvas) {
  const cropManagerRef = React.useRef(null);
  const [isCropping, setIsCropping] = React.useState(false);

  React.useEffect(() => {
    if (canvas && !cropManagerRef.current) {
      cropManagerRef.current = new CropManager(canvas);
    }
  }, [canvas]);

  const startCropping = React.useCallback(() => {
    if (!cropManagerRef.current) return;

    const success = cropManagerRef.current.startCropping();
    if (success) {
      setIsCropping(true);
    } else {
      alert("Please select an image to crop");
    }
  }, []);

  const applyCrop = React.useCallback(async () => {
    if (!cropManagerRef.current) return;

    const success = await cropManagerRef.current.applyCrop();
    if (success) {
      setIsCropping(false);
    }
  }, []);

  const cancelCrop = React.useCallback(() => {
    if (!cropManagerRef.current) return;

    const success = cropManagerRef.current.cancelCrop();
    if (success) {
      setIsCropping(false);
    }
  }, []);

  return {
    isCropping,
    startCropping,
    applyCrop,
    cancelCrop,
  };
}
