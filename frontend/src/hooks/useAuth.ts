import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function useRequireAuth() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth().catch(() => navigate('/login'));
    }
  }, [isAuthenticated]);

  return { isAuthenticated };
}
