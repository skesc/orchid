import { format } from "date-fns";

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

    const { filename, dataURL } = exportCanvasToImage(canvas);
    downloadImage(filename, dataURL);
  } catch (error) {
    console.error("Export failed:", error);
    setError("Failed to export image");
  }
};

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
