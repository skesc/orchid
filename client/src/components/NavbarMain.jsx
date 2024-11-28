import {Link} from "@tanstack/react-router";
import {Edit3, Home, LogOut, Menu, ShoppingCart} from "lucide-react";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";

const NavbarMain = () => {
  const {user, loading} = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              <Menu size={24} />
            </button>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600 transition-colors duration-200">
                <Home size={18} className="mr-2" />
                <span className="font-medium">Home</span>
              </Link>
              <Link to="/editor" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600 transition-colors duration-200">
                <Edit3 size={18} className="mr-2" />
                <span className="font-medium">Editor</span>
              </Link>
              <Link to="/marketplace" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600 transition-colors duration-200">
                <ShoppingCart size={18} className="mr-2" />
                <span className="font-medium">Marketplace</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : user ? (
              <div className="flex items-center space-x-6">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://sakura.rex.wf/linear/${user.name}?text=${user.name
                      .split(" ")
                      .map((n) => n.slice(0, 2))
                      .join("")
                      .toUpperCase()}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm transition-transform duration-200 hover:scale-105"
                  />
                  <span className="text-gray-900 font-semibold">{user.name}</span>
                </div>
                <Link to="/logout" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Link>
              </div>
            ) : (
              <Link to="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/" className="flex items-center px-3 py-2 rounded-md text-gray-900 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>
            <Home size={18} className="mr-2" />
            <span className="font-medium">Home</span>
          </Link>
          <Link to="/editor" className="flex items-center px-3 py-2 rounded-md text-gray-900 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>
            <Edit3 size={18} className="mr-2" />
            <span className="font-medium">Editor</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavbarMain;
