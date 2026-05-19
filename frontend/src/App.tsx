import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Trading } from './pages/trading/Trading';
import { Strategies } from './pages/strategies/Strategies';
import { Risk } from './pages/risk/Risk';
import { Stocks } from './pages/stocks/Stocks';
import { Crypto } from './pages/crypto/Crypto';
import { QABot } from './pages/qa-bot/QABot';
import { Admin } from './pages/admin/Admin';
import { Login } from './pages/Login';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="trading" element={<Trading />} />
            <Route path="strategies" element={<Strategies />} />
            <Route path="risk" element={<Risk />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="crypto" element={<Crypto />} />
            <Route path="qa-bot" element={<QABot />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
