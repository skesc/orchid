import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, Search } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../utils/fetchConfig";
import MarketplaceBookmarks from "./MarketplaceBookmarks";
import MarketplaceItem from "./MarketplaceItem";

const ITEMS_PER_PAGE = 9;

const MarketplaceList = forwardRef(({ canvas }, ref) => { // eslint-disable-line
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef(null);
  const queryClient = useQueryClient();

  // fetch marketplace items with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["marketplace-items"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `${API_URL}/api/marketplace/items?page=${pageParam}&per_page=${ITEMS_PER_PAGE}`,
        { credentials: "include" },
      );
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      return data.items || [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < ITEMS_PER_PAGE) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // keep cache for 30 minutes
  });

  useImperativeHandle(ref, () => ({
    fetchItems: refetch,
  }));

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const scrollThreshold = 100; // px from bottom

    if (
      scrollHeight - (scrollTop + clientHeight) < scrollThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const allItems = (data?.pages || []).flatMap((page) => page || []);
  const filteredItems = allItems.filter((item) => {
    if (!item || !searchTerm) return true;
    const searchTerms = searchTerm
      .toLowerCase()
      .split(",")
      .map((term) => term.trim());
    return searchTerms.some(
      (term) =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.categories &&
          item.categories.some((category) =>
            category.toLowerCase().includes(term),
          )),
    );
  });

  const myItems = user
    ? filteredItems.filter((item) => item?.author?.uuid === user.uuid)
    : [];
  const bookmarkedItems = user
    ? filteredItems.filter((item) => item?.is_bookmarked)
    : [];

  const mainListingItems = filteredItems.filter((item) => {
    if (!item) return false;
    const isOwnItem = user && item?.author?.uuid === user.uuid;
    const isBookmarked = user && item?.is_bookmarked;
    return !isOwnItem && !isBookmarked;
  });

  const handleItemDeleted = () => {
    // invalidate and refetch marketplace items
    queryClient.invalidateQueries({ queryKey: ["marketplace-items"] });
  };

  const handleToggleBookmark = async (item) => {
    if (!user || !item) return;

    try {
      const response = await fetch(
        `${API_URL}/api/marketplace/items/${item.uuid}/bookmark`,
        {
          method: item.is_bookmarked ? "DELETE" : "POST",
          credentials: "include",
        },
      );

      if (response.ok) {
        // update the item in the cache
        queryClient.setQueryData(["marketplace-items"], (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              (page || []).map((i) =>
                i?.uuid === item.uuid
                  ? { ...i, is_bookmarked: !i.is_bookmarked }
                  : i,
              ),
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  if (isLoading) {
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
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
            size={20}
          />
        </div>
      </div>

      {(myItems.length > 0 || bookmarkedItems.length > 0) && (
        <MarketplaceBookmarks
          canvas={canvas}
          myItems={myItems}
          bookmarkedItems={bookmarkedItems}
          onToggleBookmark={handleToggleBookmark}
          onUpdate={handleItemDeleted}
        />
      )}

      {!user && (
        <div className="bg-violet-100 border-2 border-violet-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500 rounded-lg">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-violet-900 font-medium">
                Want to add your own items?
              </h3>
              <p className="text-violet-700 text-sm mt-0.5">
                Sign in to create and share your items with the community!
              </p>
            </div>
          </div>
        </div>
      )}

      {mainListingItems.length === 0 ? (
        <div className="text-center text-neutral-500 py-8 flex-grow">
          No items found. Try adjusting your search or add some items to the
          marketplace!
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
            {mainListingItems.map(
              (item) =>
                item && (
                  <MarketplaceItem
                    key={item.uuid}
                    item={item}
                    canvas={canvas}
                    onUpdate={handleItemDeleted}
                    onBookmark={() => handleToggleBookmark(item)}
                    isBookmarked={bookmarkedItems.some(
                      (bookmarked) => bookmarked?.uuid === item.uuid,
                    )}
                    isOwn={user && item.author?.uuid === user.uuid}
                  />
                ),
            )}
          </div>

          {isFetchingNextPage && (
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
