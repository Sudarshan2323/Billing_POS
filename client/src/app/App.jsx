import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { PosBillingPage } from '../pages/PosBillingPage';
import { ProductsPage } from '../pages/ProductsPage';
import { PartiesPage } from '../pages/PartiesPage';
import { InvoicesPage } from '../pages/InvoicesPage';
import { ReportsPage } from '../pages/ReportsPage';
import { DevUiPage } from '../pages/DevUiPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="billing" element={<PosBillingPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="parties" element={<PartiesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="dev/ui" element={<DevUiPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
