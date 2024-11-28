import {createFileRoute} from "@tanstack/react-router";
import React from "react";
import MarketplaceList from "../../components/marketplace/MarketplaceList";

export const Route = createFileRoute("/marketplace/")({
  component: MarketplacePage,
});

function MarketplacePage() {
  return <MarketplaceList />;
}
