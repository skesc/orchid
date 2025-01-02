import { format } from "date-fns";
import { FabricImage } from "fabric";

const HandleExportImage = (canvas, setError) => {
  if (!canvas) {
    console.warn("No canvas provided for export");
    return;
  }

  try {
    const objects = canvas.getObjects();
    if (objects.length === 0) {
      setError("Cannot export: Canvas is empty");
      return;
    }

    createExportableCanvas(canvas)
      .then(({ exportCanvas, cleanup }) => {
        try {
          const { filename, dataURL } = exportCanvasToImage(exportCanvas);
          downloadImage(filename, dataURL);
        } finally {
          cleanup();
        }
      })
      .catch((error) => {
        console.error("Export failed:", error);
        setError("Failed to export image");
      });
  } catch (error) {
    console.error("Export failed:", error);
    setError("Failed to export image");
  }
};

// this creates a temporary canvas with the same properties as the source canvas
// this is necessary because the canvas.toDataURL() method does not support CORS-enabled images
// so we need to clone the images and add them to the temporary canvas
async function createExportableCanvas(sourceCanvas) {
  const objects = sourceCanvas.getObjects();
  let minX = Infinity,
    minY = Infinity;

  // find minimum coordinates in original object space
  objects.forEach((obj) => {
    minX = Math.min(minX, obj.left);
    minY = Math.min(minY, obj.top);
  });

  const offsetX = minX < 0 ? -minX : 0;
  const offsetY = minY < 0 ? -minY : 0;

  const exportCanvas = new sourceCanvas.constructor({
    width: sourceCanvas.width,
    height: sourceCanvas.height,
  });

  exportCanvas.backgroundColor = sourceCanvas.backgroundColor;
  exportCanvas.backgroundImage = sourceCanvas.backgroundImage;

  const cloneImageWithCORS = async (obj) => {
    const adjustedPos = {
      x: obj.left + offsetX,
      y: obj.top + offsetY,
    };

    if (obj instanceof FabricImage || obj.type === "image") {
      return new Promise((resolve) => {
        const imgElement = new Image();
        imgElement.crossOrigin = "anonymous";
        imgElement.onload = () => {
          const newImage = new FabricImage(imgElement, {
            ...obj.toObject(),
            left: adjustedPos.x,
            top: adjustedPos.y,
            crossOrigin: "anonymous",
          });
          resolve(newImage);
        };
        imgElement.src = obj.getSrc();
      });
    }

    const clone = obj.clone();
    clone.set({
      left: adjustedPos.x,
      top: adjustedPos.y,
    });
    return clone;
  };

  const clonedObjects = await Promise.all(objects.map(cloneImageWithCORS));
  clonedObjects.forEach((obj) => exportCanvas.add(obj));
  exportCanvas.renderAll();

  return {
    exportCanvas,
    cleanup: () => {
      exportCanvas.dispose();
    },
  };
}

function exportCanvasToImage(canvas) {
  const activeObject = canvas.getActiveObject();

  if (activeObject) {
    return exportSingleObject(activeObject);
  }

  const objects = canvas.getObjects();
  if (objects.length === 0) {
    throw new Error("No objects to export");
  }

  return exportEntireCanvas(canvas);
}

function exportSingleObject(object) {
  const filename = generateFileName("object");
  const dataURL = object.toDataURL({
    format: "png",
    quality: 1.0,
  });

  return { filename, dataURL };
}

function exportEntireCanvas(canvas) {
  const bounds = calculateContentBounds(canvas);
  canvas.discardActiveObject();

  const filename = generateFileName("canvas");
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1.0,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  });

  return { filename, dataURL };
}

function calculateContentBounds(canvas) {
  const objects = canvas.getObjects();
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  objects.forEach((obj) => {
    try {
      const bounds = obj.getBoundingRect(true, true);
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    } catch (error) {
      console.warn("Could not get bounds for object:", error);
    }
  });

  return {
    left: Math.max(0, minX),
    top: Math.max(0, minY),
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function generateFileName(type) {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  return `export-${type}-${timestamp}.png`;
}

function downloadImage(filename, dataURL) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default HandleExportImage;
