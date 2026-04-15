import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldX, Loader2, FileText, Hexagon, User, Clock } from 'lucide-react';
import { Input } from '../components/ui/input';
import { verifyAsset } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyPage({ walletHook }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const { user } = useAuth();
  const displayWallet = result?.asset?.walletAddress || walletHook?.account || '';
  const displayEmail = result?.asset?.ownerEmail || user?.email || '';
  const shortenedWallet = displayWallet && walletHook?.shortenAddress
    ? walletHook.shortenAddress(displayWallet)
    : displayWallet;

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await verifyAsset(query.trim());
      setResult(data);
      if (data.verified) {
        toast.success('Ownership Verified');
      }
    } catch (err) {
      toast.error('Verification failed');
      setResult({ verified: false, message: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-6 sm:px-12 pt-24 pb-12"
      data-testid="verify-page"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#818CF8] mb-2">Verify</p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white" style={{ fontFamily: 'Outfit' }}>
          Ownership Verification
        </h1>
        <p className="text-[#94A3B8] mt-3 text-base leading-relaxed max-w-xl mx-auto">
          Enter a file hash or NFT ID to verify digital ownership and authenticity.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleVerify} className="mb-10">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" strokeWidth={1.5} />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter File Hash or NFT ID..."
            data-testid="verify-hash-input"
            className="bg-[#0D111D] border border-white/10 text-white pl-14 pr-4 py-7 rounded-2xl text-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-[#475569]"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          data-testid="verify-submit-btn"
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white rounded-full px-6 py-4 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:shadow-none text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </span>
          ) : (
            'Verify Ownership'
          )}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && !loading && result && (
          <motion.div
            key={result.verified ? 'verified' : 'not-found'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {result.verified ? (
              <div
                className="bg-[#090B14] border border-emerald-500/20 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                data-testid="verify-result-success"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-medium text-white" style={{ fontFamily: 'Outfit' }}>
                    Ownership Verified
                  </h2>
                  <p className="text-emerald-400 text-sm mt-1">
                    {displayWallet ? `Verified on-chain identity for wallet ${shortenedWallet}` : 'This asset is authenticated and registered'}
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'File Name', value: result.asset.fileName, icon: FileText },
                    { label: 'NFT ID', value: result.asset.nftId, icon: Hexagon },
                    { label: 'Owner', value: result.asset.owner, icon: User },
                    { label: 'User Email', value: displayEmail || 'Not available', icon: User },
                    { label: 'Wallet', value: displayWallet || 'Not connected', icon: Hexagon, mono: true },
                    { label: 'Verification Status', value: result.message || 'Ownership Verified', icon: ShieldCheck },
                    { label: 'IPFS Hash', value: result.asset.ipfsHash || 'ipfs://fakeHash123', mono: true },
                    { label: 'File Hash', value: result.asset.fileHash, mono: true },
                    { label: 'Registered', value: new Date(result.asset.createdAt).toLocaleString(), icon: Clock },
                  ].map(({ label, value, icon: Icon, mono }) => (
                    <div key={label} className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />}
                        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8]">{label}</span>
                      </div>
                      <span
                        className={`text-sm text-right max-w-[55%] break-all ${mono ? 'font-mono text-[#E2E8F0] text-xs' : 'text-white'}`}
                        data-testid={`verify-${label.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="bg-[#090B14] border border-red-500/20 rounded-2xl p-8 text-center"
                data-testid="verify-result-fail"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldX className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-medium text-white" style={{ fontFamily: 'Outfit' }}>
                  Not Found
                </h2>
                <p className="text-[#94A3B8] text-sm mt-2">{result.message}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
