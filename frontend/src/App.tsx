import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/layout/Navbar';
import { ToastProvider, setToastFunctions, useToast } from './hooks/useToast';

const GlobalToastInit: React.FC = () => {
  const { success, error } = useToast();
  React.useEffect(() => {
    setToastFunctions(success, error);
  }, [success, error]);
  return null;
};

const AnimatedPageContainer: React.FC = () => {
  const location = useLocation();
  return (
    <main className="flex-1">
      <div key={location.pathname} className="animate-fade-in-up">
        <AppRoutes />
      </div>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <GlobalToastInit />
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <AnimatedPageContainer />
            </div>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
