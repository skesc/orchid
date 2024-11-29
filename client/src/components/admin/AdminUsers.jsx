import {FileImage, Github, Mail, Search} from "lucide-react";
import React from "react";
import {apiFetch} from "../../utils/fetchConfig";

export default function AdminUsers() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiFetch("/api/admin/users");
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [users, searchTerm]);

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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users by name or email..." className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-violet-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-lg font-medium">{user.name[0].toUpperCase()}</div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900">{user.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-neutral-500">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-neutral-500">Authentication</div>
                  <div className="flex gap-2">
                    {user.oauth_providers.includes("google") && <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">Google</span>}
                    {user.oauth_providers.includes("github") && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-800 text-white">
                        <Github size={12} className="mr-1" />
                        GitHub
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-neutral-500">Marketplace Items</div>
                  <div className="flex items-center gap-1 text-neutral-900">
                    <FileImage size={14} />
                    <span>{user.marketplace_items_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400">No users found</div>
        </div>
      )}
    </div>
  );
}
