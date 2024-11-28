import {FabricImage} from "fabric";
import {Loader2, X} from "lucide-react";
import React from "react";
import {API_URL} from "../utils/fetchConfig";

export default function BackgroundRemovalModal({isOpen, onClose, canvas}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleRemoveBackground = async () => {
    const activeObject = canvas?.getActiveObject();
    if (!activeObject || !canvas) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const dataURL = activeObject.toDataURL();
      const blob = await (await fetch(dataURL)).blob();

      const formData = new FormData();
      formData.append("image", blob, "image.png");

      const response = await fetch(`${API_URL}/api/remove-background`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to remove background");
      }

      const originalWidth = activeObject.width;
      const originalHeight = activeObject.height;
      const currentAngle = activeObject.angle || 0;
      const currentScaleX = activeObject.scaleX || 1;
      const currentScaleY = activeObject.scaleY || 1;
      const flipX = activeObject.flipX;
      const flipY = activeObject.flipY;

      const img = await FabricImage.fromURL(data.image_path);
      img.set({
        left: activeObject.left,
        top: activeObject.top,
        angle: currentAngle,
        scaleX: currentScaleX,
        scaleY: currentScaleY,
        flipX: flipX,
        flipY: flipY,
        width: originalWidth,
        height: originalHeight,
      });

      canvas.remove(activeObject);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      onClose();
    } catch (err) {
      setError(err.message || "An error occurred while removing the background");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 m-4">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">Remove Background</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Select an image first, then click remove background</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>

          <button onClick={handleRemoveBackground} disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Remove Background"
            )}
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">Note: Processed image will expire in 10 minutes on our server.</p>
      </div>
    </div>
  );
}
