import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Upload, CheckCircle, User, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export function Navbar({ onProfileOpen, onWalletOpen, walletHook }) {
  const { account, connecting, shortenAddress } = walletHook;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/verify', label: 'Verify', icon: CheckCircle },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 glass-nav bg-[#03040B]/70 border-b border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group" data-testid="navbar-logo">
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            whileTap={{ scale: 0.96 }}
            className="w-9 h-9 rounded-lg premium-button flex items-center justify-center ring-1 ring-white/15"
          >
            <Shield className="w-4.5 h-4.5 text-white" strokeWidth={1.5} />
          </motion.div>
          <span className="font-heading text-lg font-semibold tracking-tight gradient-text" style={{ fontFamily: 'Outfit' }}>
            Nexorium
          </span>
        </NavLink>

        {/* Center Nav */}
        <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-full px-1.5 py-1 shadow-inner shadow-white/[0.03]">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-testid={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.08] shadow-[0_0_28px_rgba(79,70,229,0.22)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={onWalletOpen}
            disabled={connecting}
            data-testid="connect-wallet-btn"
            className="flex items-center gap-2 bg-[#F6851B]/10 border border-[#F6851B]/25 text-[#FDBA74] hover:bg-[#F6851B]/15 rounded-full px-4 py-2 text-sm font-medium transition-colors shadow-[0_0_24px_rgba(246,133,27,0.08)]"
          >
            <Wallet className="w-4 h-4" strokeWidth={1.5} />
            {connecting ? 'Connecting...' : account ? shortenAddress(account) : 'Connect Wallet'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={onProfileOpen}
            data-testid="navbar-profile-btn"
            className="w-9 h-9 rounded-full bg-white/[0.06] border border-indigo-300/20 flex items-center justify-center hover:bg-indigo-500/15 transition-colors shadow-[0_0_24px_rgba(99,102,241,0.16)]"
          >
            <User className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={async () => { await logout(); navigate('/login'); }}
            data-testid="logout-btn"
            className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex items-center justify-center gap-1 px-4 pb-2">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                  : 'text-[#94A3B8] hover:text-white'
              }`
            }
          >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </div>
    </motion.nav>
  );
}
