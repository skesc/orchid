import React from "react";
import {useAuth} from "../../contexts/AuthContext";

const API_URL = process.env.VITE_API_URL;

export default function MarketplaceItem({item, onUpdate}) {
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
    // TODO: Implement the logic to use the item in the photo editor
    console.log("Using item:", item);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <img src={item.image_path} alt={item.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          {isAuthor && (
            <button onClick={handleDelete} className="text-red-400 hover:text-red-300">
              Delete
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-2">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.categories.map((category, index) => (
            <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
              {category}
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-400">By {item.author.name}</span>
          <button onClick={handleUse} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
