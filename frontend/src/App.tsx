import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded page components for code splitting (named exports → default)
const Dashboard = lazy(() =>
  import('./pages/dashboard/Dashboard').then(m => ({ default: m.Dashboard as ComponentType }))
);
const Trading = lazy(() =>
  import('./pages/trading/Trading').then(m => ({ default: m.Trading as ComponentType }))
);
const Strategies = lazy(() =>
  import('./pages/strategies/Strategies').then(m => ({ default: m.Strategies as ComponentType }))
);
const Risk = lazy(() =>
  import('./pages/risk/Risk').then(m => ({ default: m.Risk as ComponentType }))
);
const Stocks = lazy(() =>
  import('./pages/stocks/Stocks').then(m => ({ default: m.Stocks as ComponentType }))
);
const Crypto = lazy(() =>
  import('./pages/crypto/Crypto').then(m => ({ default: m.Crypto as ComponentType }))
);
const QABot = lazy(() =>
  import('./pages/qa-bot/QABot').then(m => ({ default: m.QABot as ComponentType }))
);
const Admin = lazy(() =>
  import('./pages/admin/Admin').then(m => ({ default: m.Admin as ComponentType }))
);

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
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
              <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="trading" element={<Suspense fallback={<PageLoader />}><Trading /></Suspense>} />
              <Route path="strategies" element={<Suspense fallback={<PageLoader />}><Strategies /></Suspense>} />
              <Route path="risk" element={<Suspense fallback={<PageLoader />}><Risk /></Suspense>} />
              <Route path="stocks" element={<Suspense fallback={<PageLoader />}><Stocks /></Suspense>} />
              <Route path="crypto" element={<Suspense fallback={<PageLoader />}><Crypto /></Suspense>} />
              <Route path="qa-bot" element={<Suspense fallback={<PageLoader />}><QABot /></Suspense>} />
              <Route path="admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
