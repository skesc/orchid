import {createFileRoute, useNavigate} from "@tanstack/react-router";
import * as React from "react";
import {useAuth} from "../../contexts/AuthContext";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackComponent,
});

function AuthCallbackComponent() {
  const navigate = useNavigate();
  const {checkAuth} = useAuth();

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        await checkAuth();
        navigate({to: "/editor"});
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate({to: "/login"});
      }
    };

    handleCallback();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallbackComponent;
