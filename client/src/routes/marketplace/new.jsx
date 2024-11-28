import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import MarketplaceForm from '../../components/marketplace/MarketplaceForm';

export const Route = createFileRoute('/marketplace/new')({
  component: NewMarketplaceItemPage,
});

function NewMarketplaceItemPage() {
  return <MarketplaceForm />;
} 