import {format} from "date-fns";

const generateFileName = (prefix, activeObject = null) => {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  const objectType = activeObject ? "selection" : "canvas";
  return `${objectType}-${timestamp}.png`;
};

const HandleExportImage = (canvas) => {
  if (!canvas) return;

  const groupStates = new Map();

  canvas.getObjects().forEach((obj) => {
    if (obj.type === "group") {
      groupStates.set(obj, {
        backgroundColor: obj.backgroundColor,
        transparentCorners: obj.transparentCorners,
      });

      obj.set({
        backgroundColor: "transparent",
        transparentCorners: true,
      });

      if (obj._objects) {
        obj._objects.forEach((nestedObj) => {
          nestedObj.set({
            transparentCorners: true,
          });
        });
      }
    }
  });

  const activeObject = canvas.getActiveObject();
  let filename;
  let dataURL;

  try {
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
  } finally {
    groupStates.forEach((state, group) => {
      group.set({
        backgroundColor: state.backgroundColor,
        transparentCorners: state.transparentCorners,
      });
    });

    canvas.renderAll();
  }
};

export default HandleExportImage;
