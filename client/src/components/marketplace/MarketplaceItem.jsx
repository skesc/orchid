import {FabricImage} from "fabric";
import {Tag, Trash2} from "lucide-react";
import React from "react";
import {useAuth} from "../../contexts/AuthContext";
import {getOptimizedImageUrl, OptimizedImage} from "../../utils/ImageLoader.jsx";
import {API_URL} from "../../utils/fetchConfig";

export default function MarketplaceItem({item, onUpdate, canvas, isOwn}) {
  const {user} = useAuth();
  const hasCategories = item.categories && Array.isArray(item.categories) && item.categories.length > 0;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`${API_URL}/api/marketplace/items/${item.uuid}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleUse = () => {
    if (!canvas) return;

    const previewUrl = getOptimizedImageUrl(item.image_path, {quality: 50});
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const fabricImage = new FabricImage(img, {
        id: `marketplace-${Date.now()}`,
        name: item.name,
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

      // upgrade to full quality after the image is loaded
      const fullQualityUrl = getOptimizedImageUrl(item.image_path, {quality: 90});
      const fullQualityImg = new Image();
      fullQualityImg.crossOrigin = "anonymous";

      fullQualityImg.onload = () => {
        fabricImage.setSrc(fullQualityImg.src, () => {
          canvas.renderAll();
        });
      };

      fullQualityImg.src = fullQualityUrl;
    };

    img.src = previewUrl;
  };

  return (
    <div className="bg-neutral-300 rounded-lg overflow-hidden transition-all duration-200 hover:brightness-95 relative group h-full flex flex-col">
      <div className="relative">
        <OptimizedImage src={item.image_path} alt={item.name} size="preview" className="h-32 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base font-medium text-neutral-900 line-clamp-1">{item.name}</h3>
          {isOwn && (
            <button onClick={handleDelete} className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {item.description && <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2">{item.description}</p>}

          {hasCategories && (
            <div className="flex items-center gap-1.5 mt-2">
              <Tag size={14} className="text-neutral-500 shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {item.categories.map((category, index) => (
                  <span key={index} className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-md">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-400/20">
          <span className="text-[10px] text-neutral-500">by {item.author.name}</span>
          <button onClick={handleUse} className="px-3 py-1 bg-violet-500 text-white text-sm rounded-md hover:bg-violet-600 transition-colors">
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
