import { FabricImage, Rect } from "fabric";

export class CropManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.cropRect = null;
    this.imageToClip = null;
  }

  startCropping() {
    if (!this.canvas) return false;

    const activeObject = this.canvas.getActiveObject();
    if (!activeObject || !(activeObject instanceof FabricImage)) {
      return false;
    }

    this.imageToClip = activeObject;
    const bounds = activeObject.getBoundingRect();

    this.cropRect = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: "rgba(0,0,0,0.3)",
      stroke: "#fff",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      cornerColor: "white",
      cornerStrokeColor: "black",
      cornerSize: 10,
      transparentCorners: false,
    });

    this.canvas.add(this.cropRect);
    this.canvas.setActiveObject(this.cropRect);
    this.canvas.renderAll();
    return true;
  }

  applyCrop() {
    if (!this.canvas || !this.cropRect || !this.imageToClip) return false;

    const imageObject = this.imageToClip;
    const cropRect = this.cropRect;

    const originalWidth = imageObject.width * (imageObject.scaleX || 1);
    const originalHeight = imageObject.height * (imageObject.scaleY || 1);

    const currentAngle = imageObject.angle || 0;
    const flipX = imageObject.flipX;
    const flipY = imageObject.flipY;

    imageObject.set({ angle: 0 });
    this.canvas.renderAll();

    const rect = cropRect.getBoundingRect();
    const imageRect = imageObject.getBoundingRect();

    const relativeLeft = rect.left - imageRect.left;
    const relativeTop = rect.top - imageRect.top;
    const relativeWidth = rect.width;
    const relativeHeight = rect.height;

    const cropX = (relativeLeft / imageRect.width) * originalWidth;
    const cropY = (relativeTop / imageRect.height) * originalHeight;
    const cropWidth = (relativeWidth / imageRect.width) * originalWidth;
    const cropHeight = (relativeHeight / imageRect.height) * originalHeight;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext("2d");

    const img = imageObject.getElement();

    tempCtx.drawImage(
      img,
      cropX / (imageObject.scaleX || 1),
      cropY / (imageObject.scaleY || 1),
      cropWidth / (imageObject.scaleX || 1),
      cropHeight / (imageObject.scaleY || 1),
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return new Promise((resolve) => {
      const croppedImg = new Image();
      croppedImg.src = tempCanvas.toDataURL("image/png");

      croppedImg.onload = () => {
        const croppedFabricImage = new FabricImage(croppedImg);

        croppedFabricImage.set({
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
          originX: "center",
          originY: "center",
          angle: currentAngle,
          flipX: flipX,
          flipY: flipY,
          scaleX: 1,
          scaleY: 1,
        });

        this.canvas.remove(imageObject);
        this.canvas.remove(cropRect);
        this.canvas.add(croppedFabricImage);
        this.canvas.setActiveObject(croppedFabricImage);

        this.cleanup();
        this.canvas.renderAll();
        resolve(true);
      };
    });
  }

  cancelCrop() {
    if (!this.canvas || !this.cropRect) return false;

    this.canvas.remove(this.cropRect);
    this.cleanup();
    this.canvas.renderAll();
    return true;
  }

  cleanup() {
    this.cropRect = null;
    this.imageToClip = null;
  }
}
