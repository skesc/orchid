import {createFileRoute, useNavigate} from "@tanstack/react-router";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";

export const Route = createFileRoute("/logout")({
  component: LogoutComponent,
});

function LogoutComponent() {
  const navigate = useNavigate();
  const {logout} = useAuth();
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        navigate({to: "/"});
      } catch (err) {
        setError(err.message);
        setTimeout(() => navigate({to: "/"}), 1500);
      }
    };

    handleLogout();
  }, [navigate, logout]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing out...</p>
      </div>
    </div>
  );
}

export default LogoutComponent;
