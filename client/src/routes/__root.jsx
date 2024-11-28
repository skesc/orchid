import {Outlet, createRootRoute} from "@tanstack/react-router";
import * as React from "react";
import NavbarMain from "../components/NavbarMain";
import {useAuth} from "../contexts/AuthContext";
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const {user, loading} = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen top-0 flex flex-col bg-gray-950">
      {/* <NavbarMain /> */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootComponent;
