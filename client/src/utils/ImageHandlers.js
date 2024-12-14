import { FabricImage } from "fabric";

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UNSUPPORTED_TYPES = ["image/svg+xml", "image/gif"];

export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  const fileType = file.type.toLowerCase();

  if (UNSUPPORTED_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error:
        "SVG and GIF files are not supported. Please upload a static, raster image format (PNG or JPEG).",
    };
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return {
      isValid: false,
      error: "Unsupported file type. Please upload a PNG, JPEG or WebP image.",
    };
  }

  return { isValid: true, error: null };
}

export function createImageFromFile(file, canvas) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Failed to read file. Please try again."));
    };

    reader.onload = (e) => {
      const imgSrc = e.target.result;
      convertToFabricImage(imgSrc, file.name, canvas)
        .then(resolve)
        .catch(reject);
    };

    reader.readAsDataURL(file);
  });
}

function convertToFabricImage(imgSrc, fileName, canvas) {
  return new Promise((resolve, reject) => {
    const imageElement = new Image();

    imageElement.onerror = () => {
      reject(new Error("Failed to load image. Please try a different file."));
    };

    imageElement.onload = function () {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imageElement.width;
      tempCanvas.height = imageElement.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(imageElement, 0, 0);

      const convertedImage = new Image();
      convertedImage.src = tempCanvas.toDataURL("image/png");

      convertedImage.onload = () => {
        const fabricImage = createAndConfigureFabricImage(
          convertedImage,
          fileName,
          canvas,
        );
        resolve(fabricImage);
      };
    };

    imageElement.src = imgSrc;
  });
}

function createAndConfigureFabricImage(convertedImage, fileName, canvas) {
  const image = new FabricImage(convertedImage, {
    id: `image-${Date.now()}`,
    name: fileName || `Image ${canvas.getObjects().length + 1}`,
    selectable: true,
    hasControls: true,
    hoverCursor: "default",
    lockMovementX: false,
    lockMovementY: false,
    evented: true,
  });

  // Scale image if it's too large
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.9;

  if (image.width > maxWidth || image.height > maxHeight) {
    const scaleFactorWidth = maxWidth / image.width;
    const scaleFactorHeight = maxHeight / image.height;
    const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
    image.scale(scaleFactor);
  }

  canvas.add(image);
  canvas.centerObject(image);
  canvas.renderAll();

  return image;
}

export function handleImageUpload(event, canvas, setError) {
  setError?.(""); // Clear any existing errors
  const file = event.target.files?.[0];

  if (!file || !canvas) {
    if (event.target) event.target.value = "";
    return;
  }

  const validation = validateImageFile(file);
  if (!validation.isValid) {
    setError?.(validation.error);
    if (event.target) event.target.value = "";
    return;
  }

  createImageFromFile(file, canvas)
    .then(() => {
      if (event.target) event.target.value = "";
    })
    .catch((error) => {
      setError?.(error.message);
      if (event.target) event.target.value = "";
    });
}

export function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  return true;
}

export function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
}

export function handleDrop(e, canvas, setError) {
  e.preventDefault();
  e.stopPropagation();

  const files = Array.from(e.dataTransfer.files);
  const imageFile = files.find((file) => file.type.startsWith("image/"));

  if (imageFile) {
    const event = { target: { files: [imageFile] } };
    handleImageUpload(event, canvas, setError);
  }

  return false;
}
