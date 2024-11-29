import {Search} from "lucide-react";
import React, {forwardRef, useEffect, useImperativeHandle, useState} from "react";
import {API_URL} from "../../utils/fetchConfig";
import MarketplaceItem from "./MarketplaceItem";

const MarketplaceList = forwardRef(({canvas}, ref) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchItems,
  }));

  useEffect(() => {
    fetchItems();
  }, []);

  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;

    const searchTerms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim());

    return items.filter((item) => {
      return searchTerms.some((term) => item.name.toLowerCase().includes(term) || (item.categories && item.categories.some((category) => category.toLowerCase().includes(term))));
    });
  };

  const filteredItems = filterItems(items, searchTerm);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or categories (separate multiple terms with commas)"
            className="w-full px-4 py-3 pl-10 bg-neutral-100 rounded-lg outline-none 
                     border-2 border-transparent
                     focus:border-violet-400 focus:bg-white
                     transition-all duration-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={20} />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center text-neutral-500 py-8">No items found. Try adjusting your search or add some items to the marketplace!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          {filteredItems.map((item) => (
            <MarketplaceItem key={item.id} item={item} onUpdate={fetchItems} canvas={canvas} />
          ))}
        </div>
      )}
    </div>
  );
});

export default MarketplaceList;
