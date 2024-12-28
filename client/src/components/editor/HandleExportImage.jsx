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
  const exportCanvas = new sourceCanvas.constructor({
    width: sourceCanvas.width,
    height: sourceCanvas.height,
  });

  exportCanvas.backgroundColor = sourceCanvas.backgroundColor;
  exportCanvas.backgroundImage = sourceCanvas.backgroundImage;

  const cloneImageWithCORS = async (obj) => {
    if (obj instanceof FabricImage || obj.type === "image") {
      return new Promise((resolve) => {
        const imgElement = new Image();
        imgElement.crossOrigin = "anonymous";
        imgElement.onload = () => {
          const newImage = new FabricImage(imgElement, {
            ...obj.toObject(),
            crossOrigin: "anonymous",
          });
          resolve(newImage);
        };
        imgElement.src = obj.getSrc();
      });
    }
    return obj.clone();
  };

  const objects = sourceCanvas.getObjects();
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
      const bounds = obj.getBoundingRect();
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
    width: maxX - minX,
    height: maxY - minY,
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
