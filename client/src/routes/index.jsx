import {createFileRoute, Navigate} from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  // return <div className="text-white">i fucking hate my life !!</div>;
  return <Navigate to="/editor" />;
}
