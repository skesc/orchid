import {createFileRoute} from "@tanstack/react-router";
import React from "react";
import MarketplaceForm from "../../components/marketplace/MarketplaceForm";

export const Route = createFileRoute("/marketplace/new")({
  component: NewMarketplaceItemPage,
});

function NewMarketplaceItemPage() {
  return <MarketplaceForm />;
}
