import {format} from "date-fns";

const generateFileName = (prefix, activeObject = null) => {
  const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
  const objectType = activeObject ? "selection" : "full";
  return `orchid-${prefix}-${objectType}-${timestamp}.png`;
};

const handleExportImage = (canvas, prefix = "edit") => {
  if (!canvas) return;

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
    canvas.discardActiveObject();
    canvas.renderAll();
    filename = generateFileName("export");
    dataURL = canvas.toDataURL({
      format: "png",
      quality: 1.0,
    });
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default handleExportImage;
