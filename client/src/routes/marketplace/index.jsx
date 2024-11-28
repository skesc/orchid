import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import MarketplaceList from '../../components/marketplace/MarketplaceList';

export const Route = createFileRoute('/marketplace/')({
  component: MarketplacePage,
});

function MarketplacePage() {
  return <MarketplaceList />;
} 