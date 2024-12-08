import {BarChart3, EyeOff, FileImage, Github, Image, UserCheck, Users} from "lucide-react";
import React from "react";
import {API_URL, apiFetch} from "../../utils/fetchConfig";

const statsConfig = [
  {
    id: "total_users",
    label: "Total Users",
    icon: Users,
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "total_items",
    label: "Total Items",
    icon: FileImage,
    color: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    id: "private_items",
    label: "Private Items",
    icon: EyeOff,
    color: "bg-rose-500",
    gradient: "from-rose-500 to-rose-600",
  },
  {
    id: "new_users_24h",
    label: "New Users (24h)",
    icon: UserCheck,
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    id: "new_items_24h",
    label: "New Items (24h)",
    icon: Image,
    color: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    id: "public_items",
    label: "Public Items",
    icon: BarChart3,
    color: "bg-sky-500",
    gradient: "from-sky-500 to-sky-600",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [recentItems, setRecentItems] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, itemsData] = await Promise.all([apiFetch("/api/admin/stats"), apiFetch("/api/admin/marketplace")]);

        setStats(statsData);
        // sort items by creation date and take the 5 most recent
        const sortedItems = itemsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        setRecentItems(sortedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsConfig.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
              <div className={`p-6 bg-gradient-to-r ${stat.gradient} text-white`}>
                <div className="flex items-center justify-between">
                  <Icon size={24} className="opacity-75" />
                  <span className="text-3xl font-bold">{stats[stat.id]}</span>
                </div>
                <div className="mt-2 text-lg font-medium">{stat.label}</div>
              </div>
              <div className="px-6 py-3 bg-neutral-50">
                <div className="text-xs text-neutral-500">Updated just now</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium mb-4">Recent Items</h2>
          <div className="space-y-4">
            {recentItems.map((item) => (
              <div key={item.uuid} className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                <img src={`${API_URL}${item.image_path}`} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
                  <div className="text-sm text-neutral-500">by {item.author.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {item.is_private ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600">
                        <EyeOff size={12} className="mr-1" /> Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-600">Public</span>
                    )}
                  </div>
                </div>
                {/* TODO: timezone */}
                <div className="text-sm text-neutral-400">{new Date(item.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-medium mb-4">Platform Overview</h2>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">Authentication Methods</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white">
                  <div className="p-2 rounded-lg bg-red-50">
                    <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Google</div>
                    <div className="text-xs text-neutral-500">Primary</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white">
                  <div className="p-2 rounded-lg bg-neutral-900">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">GitHub</div>
                    <div className="text-xs text-neutral-500">Secondary</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">Content Distribution</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Public Content</span>
                    <span className="font-medium">{Math.round((stats.public_items / stats.total_items) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{width: `${(stats.public_items / stats.total_items) * 100}%`}} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Private Content</span>
                    <span className="font-medium">{Math.round((stats.private_items / stats.total_items) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{width: `${(stats.private_items / stats.total_items) * 100}%`}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
