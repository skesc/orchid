import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loading } = useAuth(); // eslint-disable-line

  return (
    <div className="min-h-screen top-0 flex flex-col">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default RootComponent;
