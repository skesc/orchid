import {Link, Outlet, createRootRoute} from "@tanstack/react-router";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const {user, loading} = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-600">
                Home
              </Link>
              <Link to="/editor" className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-600 ml-4">
                Editor
              </Link>
            </div>

            <div className="flex items-center">
              {loading ? (
                <div className="animate-pulse text-gray-400">Loading...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{user.name}</span>
                  <Link to="/logout" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Sign Out
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
