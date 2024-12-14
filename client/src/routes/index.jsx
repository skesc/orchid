import { createFileRoute, Navigate } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/editor" />;
}
