import {FabricImage} from "fabric";
import React from "react";
import {useAuth} from "../../contexts/AuthContext";
import {API_URL} from "../../utils/fetchConfig";

export default function MarketplaceItem({item, onUpdate, canvas}) {
  const {user} = useAuth();
  const isAuthor = user && user.id === item.author.id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`${API_URL}/api/marketplace/items/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        onUpdate();
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleUse = () => {
    if (!canvas) return;

    const imageUrl = `${API_URL}${item.image_path}`;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const fabricImage = new FabricImage(img, {
        id: `marketplace-${Date.now()}`,
        name: item.name,
      });

      // Scale the image if it's too large
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
    };

    img.src = imageUrl;
  };

  return (
    <div className="bg-neutral-300 rounded-lg shadow-lg flex flex-col items-center overflow-hidden p-4">
      <img src={`${API_URL}${item.image_path}`} alt={item.name} className="h-[8rem] object-cover" />
      <div className="p-2 w-full">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-black">{item.name}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUse} className="bg-violet-600 w-full text-white px-4 py-[4px] rounded hover:bg-violet-700 transition">
            Use
          </button>
          {isAuthor && (
            <button onClick={handleDelete} className="bg-red-600/10 text-red-600 rounded px-4 hover:text-red-500">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
