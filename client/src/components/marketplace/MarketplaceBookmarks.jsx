import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import MarketplaceItem from "./MarketplaceItem";

export function MarketplaceBookmarks({
  canvas,
  myItems,
  bookmarkedItems,
  onToggleBookmark,
  onUpdate,
}) {
  const scrollContainerRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateArrowVisibility();
      container.addEventListener("scroll", updateArrowVisibility);
      window.addEventListener("resize", updateArrowVisibility);

      return () => {
        container.removeEventListener("scroll", updateArrowVisibility);
        window.removeEventListener("resize", updateArrowVisibility);
      };
    }
  }, [myItems, bookmarkedItems]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollPosition =
        scrollContainerRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  if (!myItems.length && !bookmarkedItems.length) {
    return null;
  }

  // filter out duplicates (items that are both owned and bookmarked)
  const bookmarkedNotOwned = bookmarkedItems.filter(
    (item) => !myItems.some((myItem) => myItem.uuid === item.uuid),
  );

  return (
    <div className="mb-6 bg-neutral-300/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-violet-500" />
          <h3 className="font-medium text-neutral-900">
            Bookmarked & My Items
          </h3>
        </div>

        <div className="flex gap-1">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-violet-500 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
          )}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg bg-neutral-200 text-neutral-700 hover:bg-violet-500 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-violet-500 scrollbar-track-neutral-300 pb-2">
        {myItems.map((item) => (
          <div key={`my-${item.uuid}`} className="flex-none w-64">
            <MarketplaceItem
              item={item}
              canvas={canvas}
              onBookmark={() => onToggleBookmark(item)}
              onUpdate={onUpdate}
              isBookmarked={bookmarkedItems.some(
                (bookmarked) => bookmarked.uuid === item.uuid,
              )}
              isOwn={true}
            />
          </div>
        ))}

        {bookmarkedNotOwned.map((item) => (
          <div key={`bookmarked-${item.uuid}`} className="flex-none w-64">
            <MarketplaceItem
              item={item}
              canvas={canvas}
              onBookmark={() => onToggleBookmark(item)}
              onUpdate={onUpdate}
              isBookmarked={true}
              isOwn={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketplaceBookmarks;
