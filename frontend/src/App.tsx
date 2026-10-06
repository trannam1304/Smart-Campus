import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/layout/Navbar';
import { MobileFooterNav } from './components/layout/MobileFooterNav';
import { ToastProvider, setToastFunctions, useToast } from './hooks/useToast';

const GlobalToastInit: React.FC = () => {
  const { success, error } = useToast();
  React.useEffect(() => {
    setToastFunctions(success, error);
  }, [success, error]);
  return null;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <GlobalToastInit />
      <AuthProvider>
        <BookingProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-0">
              <Navbar />
              <main className="flex-1">
                <AppRoutes />
              </main>
              <MobileFooterNav />
            </div>
          </BrowserRouter>
        </BookingProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
