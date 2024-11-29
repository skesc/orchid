import {filters} from "fabric";
import {FlipHorizontal, FlipVertical, RefreshCw, RotateCw, Sliders} from "lucide-react";
import React, {useEffect, useState} from "react";

const ImageAdjustments = ({canvas}) => {
  const [activeObject, setActiveObject] = useState(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
  });

  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      const selected = canvas.getActiveObject();
      if (selected && selected.type === "image") {
        setActiveObject(selected);
        setAdjustments({
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
        });
      } else {
        setActiveObject(null);
      }
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:cleared", handleSelection);
    canvas.on("selection:updated", handleSelection);

    return () => {
      canvas.off("selection:created", handleSelection);
      canvas.off("selection:cleared", handleSelection);
      canvas.off("selection:updated", handleSelection);
    };
  }, [canvas]);

  const applyFilter = (filterType, value) => {
    if (!activeObject || !canvas) return;

    setAdjustments((prev) => ({...prev, [filterType]: value}));

    let filter;
    switch (filterType) {
      case "blur":
        filter = new filters.Blur({
          blur: value / 10,
        });
        break;
      case "brightness":
        filter = new filters.Brightness({
          brightness: value / 100,
        });
        break;
      case "contrast":
        filter = new filters.Contrast({
          contrast: value / 100,
        });
        break;
      case "saturation":
        filter = new filters.Saturation({
          saturation: value / 100,
        });
        break;
      default:
        return;
    }

    activeObject.filters = [filter];
    activeObject.applyFilters();
    canvas.renderAll();
  };

  const handleRotate = () => {
    if (!activeObject || !canvas) return;
    const currentAngle = activeObject.angle || 0;
    activeObject.rotate((currentAngle + 90) % 360);
    canvas.renderAll();
  };

  const handleFlip = (direction) => {
    if (!activeObject || !canvas) return;
    if (direction === "horizontal") {
      activeObject.set("flipX", !activeObject.flipX);
    } else {
      activeObject.set("flipY", !activeObject.flipY);
    }
    canvas.renderAll();
  };

  const resetAdjustments = () => {
    if (!activeObject || !canvas) return;

    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      blur: 0,
    });

    activeObject.filters = [];

    activeObject.set({
      flipX: false,
      flipY: false,
      angle: 0,
    });

    activeObject.applyFilters();
    canvas.renderAll();
  };

  if (!activeObject) {
    return (
      <div className="fixed left-24 top-6 bg-neutral-200 box-shadow-3d text-neutral-900 p-4 rounded-lg">
        <p className="text-sm">Select an image to adjust</p>
      </div>
    );
  }

  return (
    <div className="fixed left-24 top-6 bg-neutral-200 text-neutral-900 box-shadow-3d p-4 rounded-lg w-72">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders size={16} />
          <h3 className="font-bold">Image Adjustments</h3>
        </div>
        <button onClick={resetAdjustments} className="p-2 hover:bg-neutral-700 rounded-full transition-colors" title="Reset all adjustments">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Brightness</label>
            <span className="text-sm text-neutral-500">{adjustments.brightness}</span>
          </div>
          <input type="range" min="-100" max="100" value={adjustments.brightness} onChange={(e) => applyFilter("brightness", parseInt(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Contrast</label>
            <span className="text-sm text-neutral-500">{adjustments.contrast}</span>
          </div>
          <input type="range" min="-100" max="100" value={adjustments.contrast} onChange={(e) => applyFilter("contrast", parseInt(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Saturation</label>
            <span className="text-sm text-neutral-500">{adjustments.saturation}</span>
          </div>
          <input type="range" min="-100" max="100" value={adjustments.saturation} onChange={(e) => applyFilter("saturation", parseInt(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Blur</label>
            <span className="text-sm text-neutral-500">{adjustments.blur}</span>
          </div>
          <input type="range" min="0" max="100" value={adjustments.blur} onChange={(e) => applyFilter("blur", parseInt(e.target.value))} className="w-full accent-violet-500" />
        </div>

        <div className="flex justify-between pt-2 gap-2">
          <button onClick={handleRotate} className="flex-1 p-2 bg-neutral-300 rounded hover:bg-neutral-400 transition-colors flex items-center justify-center gap-2">
            <RotateCw size={16} />
            <span className="text-sm">Rotate</span>
          </button>
          <button onClick={() => handleFlip("horizontal")} className="flex-1 p-2 bg-neutral-300 rounded hover:bg-neutral-400 transition-colors flex items-center justify-center gap-2">
            <FlipHorizontal size={16} />
            <span className="text-sm">Flip H</span>
          </button>
          <button onClick={() => handleFlip("vertical")} className="flex-1 p-2 bg-neutral-300 rounded hover:bg-neutral-400 transition-colors flex items-center justify-center gap-2">
            <FlipVertical size={16} />
            <span className="text-sm">Flip V</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageAdjustments;
