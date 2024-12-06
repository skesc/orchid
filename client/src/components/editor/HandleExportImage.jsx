import {format} from "date-fns"
const HandleExportImage = (canvas) => {
  if (!canvas) return;

  try {
    const activeObject = canvas.getActiveObject();
    let filename;
    let dataURL;

    if (activeObject) {
      filename = generateFileName("export", activeObject);
      dataURL = activeObject.toDataURL({
        format: "png",
        quality: 1.0,
      });
    } else {
      const objects = canvas.getObjects();
      if (objects.length === 0) return;

      const bounds = calculateContentBounds(canvas);
      
      canvas.discardActiveObject();
      
      filename = generateFileName("export");
      dataURL = canvas.toDataURL({
        format: "png",
        quality: 1.0,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
    }

    // Download image
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Export failed:", error);
  }
};

function calculateContentBounds(canvas) {
  const objects = canvas.getObjects();
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  objects.forEach(obj => {
    try {
      const bounds = obj.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    } catch (error) {
      console.warn("Could not get bounds for object:", obj, error);
    }
  });

  // TODO: Should we add padding? 
  const padding = 0;
  return {
    left: Math.max(0, minX - padding),
    top: Math.max(0, minY - padding),
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding
  };
}

function generateFileName(prefix, activeObject = null) {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  const objectType = activeObject ? "selection" : "canvas";
  return `${objectType}-${timestamp}.png`;
}

export default HandleExportImage;