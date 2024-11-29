import {Eye, EyeOff, Search, Trash2} from "lucide-react";
import React from "react";
import {API_URL, apiFetch} from "../../utils/fetchConfig";

export default function AdminMarketplace() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filter, setFilter] = React.useState("all"); // all, public, private

  const fetchItems = async () => {
    try {
      const data = await apiFetch("/api/admin/marketplace");
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to load marketplace items");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await apiFetch(`/api/admin/marketplace/${itemId}`, {
        method: "DELETE",
      });
      await fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.author.email.toLowerCase().includes(searchTerm.toLowerCase()) || item.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filter === "all" || (filter === "public" && !item.is_private) || (filter === "private" && item.is_private);

      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or category..." className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg transition-colors ${filter === "all" ? "bg-violet-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"}`}>
            All
          </button>
          <button onClick={() => setFilter("public")} className={`px-4 py-2 rounded-lg transition-colors ${filter === "public" ? "bg-violet-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"}`}>
            Public
          </button>
          <button onClick={() => setFilter("private")} className={`px-4 py-2 rounded-lg transition-colors ${filter === "private" ? "bg-violet-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"}`}>
            Private
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-48">
              <img src={`${API_URL}${item.image_path}`} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{item.name}</h3>
                  {item.is_private ? <EyeOff size={18} className="text-white" /> : <Eye size={18} className="text-white" />}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-neutral-500">Uploaded by</div>
                  <div className="text-sm font-medium">{item.author.name}</div>
                  <div className="text-sm text-neutral-400">{item.author.email}</div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              {item.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.categories.map((category, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700">
                      {category}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-sm text-neutral-400">Created: {new Date(item.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400">No items found</div>
        </div>
      )}
    </div>
  );
}
