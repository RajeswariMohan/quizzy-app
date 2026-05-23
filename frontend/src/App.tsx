import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}
