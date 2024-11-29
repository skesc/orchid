import {useNavigate} from "@tanstack/react-router";
import React, {useEffect, useState} from "react";
import MarketplaceItem from "./MarketplaceItem";

const CATEGORIES = ["Hat", "Glasses", "Accessory", "Background"];
const API_URL = process.env.VITE_API_URL;

export default function MarketplaceList() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const fetchItems = async () => {
    try {
      const url = new URL(`${API_URL}/api/marketplace/items`);
      if (selectedCategory) {
        url.searchParams.append("category", selectedCategory);
      }
      const response = await fetch(url);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="overflow-y-scroll">
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setSelectedCategory("")} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedCategory === "" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            All
          </button>
          {CATEGORIES.map((category) => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedCategory === category ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
        {items.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No items found</p>
          </div>
        ) : (
          items.map((item) => <MarketplaceItem key={item.id} item={item} onUpdate={fetchItems} />)
        )}
      </div>
    </div>
  );
}
