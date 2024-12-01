import { Search } from "lucide-react";
import React, { forwardRef, useEffect, useImperativeHandle, useState, useCallback, useRef } from "react";
import { API_URL } from "../../utils/fetchConfig";
import MarketplaceItem from "./MarketplaceItem";

const MarketplaceList = forwardRef(({canvas}, ref) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);

  const fetchItems = useCallback(async (resetItems = true) => {
    try {
      setLoading(resetItems);
      setIsLoadingMore(!resetItems);

      const response = await fetch(`${API_URL}/api/marketplace/items?page=${page}&per_page=9`);
      const data = await response.json();
      
      setItems(prevItems => 
        resetItems ? data.items : [...prevItems, ...data.items]
      );
      setHasMore(data.has_next);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [page]);

  useImperativeHandle(ref, () => ({
    fetchItems: () => fetchItems(true),
  }));

  useEffect(() => {
    fetchItems(true);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 300;

    if (
      isNearBottom
      && hasMore 
      && !loading 
      && !isLoadingMore
    ) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMore, loading, isLoadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      fetchItems(false);
    }
  }, [page, fetchItems]);

  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    const searchTerms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim());
    return items.filter((item) => {
      return searchTerms.some((term) => 
        item.name.toLowerCase().includes(term) || 
        (item.categories && item.categories.some((category) => 
          category.toLowerCase().includes(term)
        ))
      );
    });
  };

  const filteredItems = filterItems(items, searchTerm);

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
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
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" 
            size={20} 
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center text-neutral-500 py-8 flex-grow">
          No items found. Try adjusting your search or add some items to the marketplace!
        </div>
      ) : (
        <div 
          ref={scrollContainerRef} 
          className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            {filteredItems.map((item) => (
              <MarketplaceItem 
                key={item.id} 
                item={item} 
                onUpdate={() => fetchItems(true)} 
                canvas={canvas} 
              />
            ))}
          </div>

          {isLoadingMore && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="text-center text-neutral-500 py-4">
              No more items to load
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MarketplaceList;