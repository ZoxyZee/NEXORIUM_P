import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Shield, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';

export function WalletModal({ open, onClose, walletHook }) {
  const { connecting, error, connectWallet } = walletHook;

  const handleConnect = async (type) => {
    try {
      const address = await connectWallet(type);
      toast.success(type === 'metamask' ? 'MetaMask connected' : 'Demo Wallet connected');
      if (address) onClose();
    } catch (err) {
      toast.error(err.message || 'Wallet connection failed');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="premium-card w-full max-w-md rounded-lg p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Connect wallet"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2">Wallet Identity</p>
                <h2 className="text-2xl font-semibold gradient-text" style={{ fontFamily: 'Outfit' }}>
                  Connect Wallet
                </h2>
                <p className="text-sm text-[#94A3B8] mt-2">
                  Link a wallet after login to associate uploads and verification with your identity.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors"
                aria-label="Close wallet modal"
              >
                <X className="w-4 h-4 mx-auto" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConnect('metamask')}
                disabled={connecting}
                className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-left hover:bg-white/[0.075] transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-[#F6851B]/12 border border-[#F6851B]/25 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#FDBA74]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">MetaMask</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Use your browser wallet</p>
                </div>
                {connecting && <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConnect('demo')}
                disabled={connecting}
                className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-left hover:bg-white/[0.075] transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-indigo-500/12 border border-indigo-300/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-200" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Demo Wallet</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Stable demo address for this session</p>
                </div>
              </motion.button>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
