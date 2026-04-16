import { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { ProfileDrawer } from '@/components/ProfileDrawer';
import DashboardPage from '@/components/DashboardPage';
import AssetDetailPage from '@/components/AssetDetailPage';
import UploadPage from '@/components/UploadPage';
import VerifyPage from '@/components/VerifyPage';
import SupportPage from '@/components/SupportPage';
import { MarketDrawer } from '@/components/MarketDrawer';
import LoginPage from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import { useWallet } from '@/hooks/useWallet';
import { Loader2 } from 'lucide-react';
import { WalletModal } from '@/components/WalletModal';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#03040B]">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }
  if (user === false) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [marketDrawerOpen, setMarketDrawerOpen] = useState(false);
  const walletHook = useWallet();
  const { user } = useAuth();
  const isAuthenticated = user && user !== false;

  return (
    <>
      {isAuthenticated && (
        <>
          <Navbar onProfileOpen={() => setProfileOpen(true)} onWalletOpen={() => setWalletModalOpen(true)} onMarketOpen={() => setMarketDrawerOpen(true)} walletHook={walletHook} />
          <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} walletAddress={walletHook.account} />
          <WalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} walletHook={walletHook} />
          <MarketDrawer open={marketDrawerOpen} onClose={() => setMarketDrawerOpen(false)} />
        </>
      )}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage onWalletOpen={() => setWalletModalOpen(true)} onMarketOpen={() => setMarketDrawerOpen(true)} /></ProtectedRoute>} />
        <Route path="/assets/:assetId" element={<ProtectedRoute><AssetDetailPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage walletHook={walletHook} onWalletOpen={() => setWalletModalOpen(true)} /></ProtectedRoute>} />
        <Route path="/verify" element={<ProtectedRoute><VerifyPage walletHook={walletHook} /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
      </Routes>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#090B14',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-[#03040B]">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
