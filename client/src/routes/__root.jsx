import {Outlet, createRootRoute} from "@tanstack/react-router";
import * as React from "react";
import {useAuth} from "../contexts/AuthContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const {user, loading} = useAuth();

  return (
    <div className="min-h-screen top-0 flex flex-col bg-neutral-950">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootComponent;
