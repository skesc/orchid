import {LogIn, Search} from "lucide-react";
import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";
import {useAuth} from "../../contexts/AuthContext";
import {API_URL} from "../../utils/fetchConfig";
import MarketplaceBookmarks from "./MarketplaceBookmarks";
import MarketplaceItem from "./MarketplaceItem";

const MarketplaceList = forwardRef(({canvas}, ref) => {
  const {user} = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);
  const [bookmarkedItems, setBookmarkedItems] = useState([]);
  const [myItems, setMyItems] = useState([]);

  const fetchItems = useCallback(
    async (resetItems = true) => {
      try {
        setLoading(resetItems);
        setIsLoadingMore(!resetItems);

        const response = await fetch(`${API_URL}/api/marketplace/items?page=${page}&per_page=9`, {
          credentials: "include",
        });
        const data = await response.json();

        if (user) {
          const filteredItems = data.items.filter((item) => item.author.uuid !== user.uuid && !bookmarkedItems.some((b) => b.uuid === item.uuid));
          setItems((prevItems) => (resetItems ? filteredItems : [...prevItems, ...filteredItems]));

          const userItems = data.items.filter((item) => item.author.uuid === user.uuid);
          if (resetItems) {
            setMyItems(userItems);
          } else {
            setMyItems((prev) => {
              const existingUuids = new Set(prev.map((item) => item.uuid));
              const newItems = userItems.filter((item) => !existingUuids.has(item.uuid));
              return [...prev, ...newItems];
            });
          }
        } else {
          setItems((prevItems) => (resetItems ? data.items : [...prevItems, ...data.items]));
        }

        setHasMore(data.has_next);
      } catch (error) {
        console.error("Error fetching marketplace items:", error);
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [page, user, bookmarkedItems]
  );

  const forceRefresh = useCallback(async () => {
    setPage(1);
    setItems([]);
    setMyItems([]);
    setBookmarkedItems([]);
    await fetchItems(true);

    if (user) {
      try {
        const response = await fetch(`${API_URL}/api/marketplace/bookmarks`, {
          credentials: "include",
        });
        const data = await response.json();
        setBookmarkedItems(data.bookmarks);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    }
  }, [fetchItems, user]);

  useImperativeHandle(ref, () => ({
    fetchItems: forceRefresh,
  }));

  useEffect(() => {
    if (user) {
      const fetchBookmarks = async () => {
        try {
          const response = await fetch(`${API_URL}/api/marketplace/bookmarks`, {
            credentials: "include",
          });
          const data = await response.json();
          setBookmarkedItems(data.bookmarks);
        } catch (error) {
          console.error("Error fetching bookmarks:", error);
        }
      };
      fetchBookmarks();
    } else {
      setBookmarkedItems([]);
      setMyItems([]);
    }
  }, [user]);

  useEffect(() => {
    fetchItems(true);
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;

    if (isNearBottom && hasMore && !loading && !isLoadingMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [hasMore, loading, isLoadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (page > 1) {
      fetchItems(false);
    }
  }, [page, fetchItems]);

  const handleItemDeleted = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);

  const handleToggleBookmark = async (item) => {
    if (!user) return;

    const isBookmarked = bookmarkedItems.some((bookmarked) => bookmarked.uuid === item.uuid);

    try {
      const response = await fetch(`${API_URL}/api/marketplace/bookmarks/${item.uuid}`, {
        method: isBookmarked ? "DELETE" : "POST",
        credentials: "include",
      });

      if (response.ok) {
        setBookmarkedItems((prev) => (isBookmarked ? prev.filter((bookmarked) => bookmarked.uuid !== item.uuid) : [...prev, item]));
        await fetchItems(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
        </div>
      </div>

      {(myItems.length > 0 || bookmarkedItems.length > 0) && <MarketplaceBookmarks canvas={canvas} myItems={myItems} bookmarkedItems={bookmarkedItems} onToggleBookmark={handleToggleBookmark} onUpdate={handleItemDeleted} />}

      {!user && (
        <div className="bg-violet-100 border-2 border-violet-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500 rounded-lg">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-violet-900 font-medium">Want to add your own items?</h3>
              <p className="text-violet-700 text-sm mt-0.5">Sign in to create and share your items with the community!</p>
            </div>
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center text-neutral-500 py-8 flex-grow">No items found. Try adjusting your search or add some items to the marketplace!</div>
      ) : (
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            {filteredItems.map((item) => (
              <MarketplaceItem key={item.uuid} item={item} canvas={canvas} onUpdate={handleItemDeleted} onBookmark={() => handleToggleBookmark(item)} isBookmarked={bookmarkedItems.some((bookmarked) => bookmarked.uuid === item.uuid)} isOwn={user && item.author.uuid === user.uuid} />
            ))}
          </div>

          {isLoadingMore && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MarketplaceList;
