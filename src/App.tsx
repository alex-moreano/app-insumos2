import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import IncomingInventoryPage from './pages/IncomingInventoryPage';
import OutgoingInventoryPage from './pages/OutgoingInventoryPage';
import KardexPage from './pages/KardexPage';
import ReportsPage from './pages/ReportsPage';
import MainLayout from './components/layout/MainLayout';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with main layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="productos" element={<ProductsPage />} />
              <Route path="ingresos" element={<IncomingInventoryPage />} />
              <Route path="egresos" element={<OutgoingInventoryPage />} />
              <Route path="kardex" element={<KardexPage />} />
              <Route path="reportes" element={<ReportsPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
