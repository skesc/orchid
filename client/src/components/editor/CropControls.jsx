import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CropManager } from "./CropManager";

export function CropControls({ _canvas, isActive, onComplete, onCancel }) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-900 p-4 rounded-lg flex gap-4">
      <button
        className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition"
        onClick={onComplete}>
        Apply Crop
      </button>
      <button
        className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-800 transition"
        onClick={onCancel}>
        <X size={24} />
      </button>
    </div>
  );
}

export function useCropManager(canvas) {
  const [cropManager, setCropManager] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (canvas && !cropManager) {
      setCropManager(new CropManager(canvas));
    }
  }, [canvas, cropManager]);

  const startCropping = useCallback(() => {
    if (!cropManager) return;

    const success = cropManager.startCropping();
    if (success) {
      setIsCropping(true);
    } else {
      alert("Please select an image to crop");
    }
  }, [cropManager]);

  const applyCrop = useCallback(async () => {
    if (!cropManager) return;

    const success = await cropManager.applyCrop();
    if (success) {
      setIsCropping(false);
    }
  }, [cropManager]);

  const cancelCrop = useCallback(() => {
    if (!cropManager) return;

    const success = cropManager.cancelCrop();
    if (success) {
      setIsCropping(false);
    }
  }, [cropManager]);

  return {
    isCropping,
    startCropping,
    applyCrop,
    cancelCrop,
  };
}

const CropControlsExports = {
  CropControls,
  useCropManager,
};

export default CropControlsExports;
