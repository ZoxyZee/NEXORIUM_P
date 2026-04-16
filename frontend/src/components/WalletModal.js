import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Loader2, Shield, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { WALLET_OPTIONS } from '@/hooks/useWallet';

export function WalletModal({ open, onClose, walletHook }) {
  const { connecting, error, connectWallet } = walletHook;

  const handleConnect = async (wallet) => {
    try {
      const address = await connectWallet(wallet.id);
      toast.success(`${wallet.name} connected`);
      if (address) onClose();
    } catch (err) {
      if (err.code === 'WALLET_NOT_INSTALLED' && err.installUrl) {
        window.open(err.installUrl, '_blank', 'noopener,noreferrer');
        toast.info(`Install ${wallet.name} to continue`);
        return;
      }
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
              {WALLET_OPTIONS.map((wallet) => {
                const isDemo = wallet.id === 'demo';
                const accentClasses = isDemo
                  ? 'bg-indigo-500/12 border-indigo-300/20 text-indigo-200'
                  : 'bg-emerald-500/12 border-emerald-300/20 text-emerald-200';

                return (
                  <motion.button
                    key={wallet.id}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleConnect(wallet)}
                    disabled={connecting}
                    className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 text-left hover:bg-white/[0.075] transition-colors"
                  >
                    <div className={`w-11 h-11 rounded-lg border flex items-center justify-center ${accentClasses}`}>
                      {isDemo ? (
                        <Shield className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <Wallet className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{wallet.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{wallet.description}</p>
                    </div>
                    {!isDemo && <ExternalLink className="w-4 h-4 text-[#64748B]" strokeWidth={1.5} />}
                    {connecting && <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />}
                  </motion.button>
                );
              })}
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
