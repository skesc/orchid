import {ActiveSelection, FabricImage, Group} from "fabric";

let fabricClipboard = null;

export function createKeyboardHandler(canvas, {onUpload, onExport, onMarket, onCrop, onPfp, onBgRemove, onAdjustments, onText, onLayers} = {}) {
  return (event) => {
    const activeElement = document.activeElement;
    const isInputField = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.contentEditable === "true";

    if (isInputField) return;

    handleDelete(event, canvas);
    handleGrouping(event, canvas);
    handleCopy(event, canvas);
    handlePaste(event, canvas);
    handleUngroup(event, canvas);

    if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
      switch (event.key.toLowerCase()) {
        case "u":
          event.preventDefault();
          onUpload?.();
          break;
        case "e":
          event.preventDefault();
          onExport?.();
          break;
        case "m":
          event.preventDefault();
          onMarket?.();
          break;
        case "c":
          event.preventDefault();
          onCrop?.();
          break;
        case "p":
          event.preventDefault();
          onPfp?.();
          break;
        case "b":
          event.preventDefault();
          onBgRemove?.();
          break;
        case "i":
          event.preventDefault();
          onAdjustments?.();
          break;
        case "t":
          event.preventDefault();
          onText?.();
          break;
        case "l":
          event.preventDefault();
          onLayers?.();
          break;
      }
    }
  };
}

function handleDelete(event, canvas) {
  if (event.key !== "Backspace" && event.key !== "Delete") return;

  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  const parentGroup = activeObject.group;
  if (parentGroup) {
    parentGroup.remove(activeObject);
    if (parentGroup.getObjects().length === 0) {
      canvas.remove(parentGroup);
    }
  } else {
    canvas.remove(activeObject);
  }

  canvas.discardActiveObject();
  canvas.renderAll();
}

function handleGrouping(event, canvas) {
  if (!(event.ctrlKey && event.key === "g")) return;

  event.preventDefault();
  const selectedObjects = canvas.getActiveObjects();
  if (selectedObjects.length <= 1) return;

  const group = new Group(selectedObjects, {
    canvas: canvas,
  });

  selectedObjects.forEach((obj) => canvas.remove(obj));
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();
}

function handleCopy(event, canvas) {
  if (!(event.ctrlKey && event.key === "c")) return;

  event.preventDefault();
  canvas
    ?.getActiveObject()
    ?.clone(["name"])
    .then((cloned) => {
      fabricClipboard = cloned;
    });
}

async function handlePaste(event, canvas) {
  if (!(event.ctrlKey && event.key === "v")) return;
  if (!fabricClipboard || !canvas) return;

  event.preventDefault();
  try {
    const clonedObj = await fabricClipboard.clone(["name", "padding"]);
    canvas.discardActiveObject();

    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });

    if (clonedObj instanceof ActiveSelection) {
      clonedObj.canvas = canvas;
      clonedObj.forEachObject((obj) => {
        canvas.add(obj);
      });
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }

    fabricClipboard.top += 10;
    fabricClipboard.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
    canvas.fire("custom:added");
  } catch (err) {
    console.error("Failed to paste:", err);
  }
}

function handleUngroup(event, canvas) {
  if (!(event.ctrlKey && event.key === "u")) return;

  event.preventDefault();
  const activeObject = canvas.getActiveObject();
  if (!activeObject || activeObject.type !== "group") return;

  const items = activeObject.getObjects();
  canvas.remove(activeObject);

  items.forEach((item) => canvas.add(item));

  canvas.discardActiveObject();
  const selection = new ActiveSelection(items, {canvas});
  canvas.setActiveObject(selection);
  canvas.renderAll();
}

// Helper functions
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function createImageFromDataUrl(dataUrl, canvas) {
  return new Promise((resolve, reject) => {
    const imgElement = new Image();
    imgElement.src = dataUrl;
    imgElement.onload = () => {
      const fabricImage = new FabricImage(imgElement, {
        id: `image-${Date.now()}`,
        name: `Pasted Image ${canvas.getObjects().length + 1}`,
      });

      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;

      if (fabricImage.width > maxWidth || fabricImage.height > maxHeight) {
        const scaleFactorWidth = maxWidth / fabricImage.width;
        const scaleFactorHeight = maxHeight / fabricImage.height;
        const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
        fabricImage.scale(scaleFactor);
      }

      canvas.add(fabricImage);
      canvas.centerObject(fabricImage);
      canvas.setActiveObject(fabricImage);
      canvas.renderAll();
      resolve(fabricImage);
    };
    imgElement.onerror = reject;
  });
}
