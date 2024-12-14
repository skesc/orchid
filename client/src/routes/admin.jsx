import { createFileRoute, Navigate } from "@tanstack/react-router";
import { BarChart3, FileImage, Users } from "lucide-react";
import React from "react";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminMarketplace from "../components/admin/AdminMarketplace";
import AdminUsers from "../components/admin/AdminUsers";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../utils/fetchConfig";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "marketplace", label: "Marketplace", icon: FileImage },
  { id: "users", label: "Users", icon: Users },
];

function AdminRoute() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const data = await apiFetch("/api/admin/check");
        setIsAdmin(data.is_admin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        checkAdmin();
      } else {
        setLoading(false);
        setIsAdmin(false);
      }
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "marketplace":
        return <AdminMarketplace />;
      case "users":
        return <AdminUsers />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-neutral-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-400">
                Logged in as {user.email}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab.id ? "bg-violet-500 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}>
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">{renderContent()}</div>
    </div>
  );
}

export default AdminRoute;
