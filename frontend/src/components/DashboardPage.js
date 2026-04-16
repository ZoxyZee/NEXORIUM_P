import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, FileText, Hexagon, Loader2, ShieldCheck, Sparkles, History, Crown, ScrollText, BadgeDollarSign, Send, LifeBuoy, ArrowRight, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../components/ui/table';
import { useNavigate } from 'react-router-dom';
import { getAssets, getAuditReport, getStats, licenseAsset, transferAsset } from '@/lib/api';
import { toast } from 'sonner';
import { DashboardEnhancements } from '@/components/DashboardEnhancements';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = Number(value) || 0;
    const duration = 700;
    const startedAt = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(end * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return displayValue.toLocaleString();
}

export default function DashboardPage({ onWalletOpen, onMarketOpen }) {
  const [stats, setStats] = useState({ totalAssets: 0, totalNFTs: 0, processing: 0, royaltyEarnings: 0, activeLicenses: 0 });
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newOwner, setNewOwner] = useState('');
  const [saleAmount, setSaleAmount] = useState('100');
  const [licenseeEmail, setLicenseeEmail] = useState('');
  const [licenseFee, setLicenseFee] = useState('75');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const [statsData, assetsData] = await Promise.all([
        getStats(),
        getAssets(q),
      ]);
      setStats(statsData);
      setAssets(assetsData);
    } catch (err) {
      console.error(err);
      toast.error('Dashboard data failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!selectedAsset) {
      setAuditReport(null);
      return;
    }
    getAuditReport(selectedAsset.id).then(setAuditReport).catch(() => setAuditReport(null));
  }, [selectedAsset]);

  const formatDate = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !newOwner.trim()) return;

    setTransferLoading(true);
    try {
      const data = await transferAsset({
        assetId: selectedAsset.id,
        newOwner,
        saleAmount: Number(saleAmount) || 100,
      });
      toast.success(data.royalty?.message || 'Transfer simulated successfully');
      setSelectedAsset(data.asset);
      setAssets(current => current.filter(asset => asset.id !== selectedAsset.id));
      setNewOwner('');
      fetchData(search);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleLicense = async (e) => {
    e.preventDefault();
    if (!selectedAsset || !licenseeEmail.trim()) return;

    setLicenseLoading(true);
    try {
      const data = await licenseAsset({
        assetId: selectedAsset.id,
        licenseeEmail,
        feeAmount: Number(licenseFee) || 75,
      });
      toast.success(`License issued to ${data.license.licenseeEmail}`);
      setSelectedAsset(data.asset);
      setAuditReport(data.auditReport);
      setLicenseeEmail('');
      fetchData(search);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'License activation failed');
    } finally {
      setLicenseLoading(false);
    }
  };

  const verifiedAssets = Math.max((stats.totalAssets || 0) - (stats.processing || 0), 0);
  const statCards = useMemo(() => [
    {
      label: 'Total Assets',
      value: stats.totalAssets,
      icon: FileText,
      tone: 'from-blue-500/20 to-cyan-400/10',
      iconClass: 'text-sky-300',
    },
    {
      label: 'NFTs Created',
      value: stats.totalNFTs,
      icon: Hexagon,
      tone: 'from-indigo-500/20 to-violet-400/10',
      iconClass: 'text-indigo-200',
    },
    {
      label: 'Verified Assets',
      value: verifiedAssets,
      icon: ShieldCheck,
      tone: 'from-emerald-500/18 to-teal-400/10',
      iconClass: 'text-emerald-300',
    },
    {
      label: 'Active Licenses',
      value: stats.activeLicenses || 0,
      icon: ScrollText,
      tone: 'from-violet-500/18 to-fuchsia-400/10',
      iconClass: 'text-violet-200',
    },
    {
      label: 'Royalty Earnings',
      value: `$${Number(stats.royaltyEarnings || 0).toFixed(2)}`,
      icon: BadgeDollarSign,
      tone: 'from-amber-500/18 to-orange-400/10',
      iconClass: 'text-amber-300',
    },
  ], [stats.totalAssets, stats.totalNFTs, stats.activeLicenses, stats.royaltyEarnings, verifiedAssets]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="premium-shell min-h-screen max-w-none px-6 sm:px-12 pt-24 pb-12"
      data-testid="dashboard-page"
    >
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            Dashboard
          </p>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight gradient-text" style={{ fontFamily: 'Outfit' }}>
            Your Digital Assets
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/upload')}
          data-testid="register-new-btn"
          className="premium-button text-white rounded-lg px-6 py-3 font-medium transition-all text-sm"
        >
          Register New IP
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        {statCards.map(({ label, value, icon: Icon, tone, iconClass }) => (
          <motion.div
            key={label}
            whileHover={{ y: -6, scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="premium-card rounded-lg p-8 overflow-hidden"
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${tone}`} />
            <div className="flex items-center justify-between mb-4">
              <span className="relative font-mono text-xs uppercase tracking-[0.2em] text-[#B4C6F8]">{label}</span>
              <div className="relative w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                <Icon className={`w-5 h-5 ${iconClass}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="relative text-4xl font-light text-white" style={{ fontFamily: 'Outfit' }} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
              {typeof value === 'string' ? value : <AnimatedNumber value={value} />}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <DashboardEnhancements onWalletOpen={onWalletOpen} />

      <motion.section variants={item} className="mb-10">
        <button
          onClick={onMarketOpen}
          className="w-full premium-card rounded-lg p-6 text-left group overflow-hidden"
          data-testid="market-cta-card"
        >
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-500/16 via-cyan-400/10 to-transparent" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/12 border border-emerald-300/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-200" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD] mb-2">Live Market</p>
                <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                  Track Crypto Prices in Realtime
                </h2>
                <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed max-w-2xl">
                  Open the market drawer to monitor trending coins, live Binance prices, and 24-hour momentum with animated tiles.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" strokeWidth={1.5} />
          </div>
        </button>
      </motion.section>

      <motion.section variants={item} className="mb-10">
        <button
          onClick={() => navigate('/support')}
          className="w-full premium-card rounded-lg p-6 text-left group"
          data-testid="support-cta-card"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-indigo-500/12 border border-indigo-300/20 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-indigo-200" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD] mb-2">Need Help?</p>
                <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                  Contact Support
                </h2>
                <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed max-w-2xl">
                  Reach the Nexorium team for creator onboarding, wallet issues, verification guidance, or ownership queries.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#64748B] group-hover:text-white transition-colors" strokeWidth={1.5} />
          </div>
        </button>
      </motion.section>

      {/* Search */}
      <motion.div variants={item} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by file name, NFT ID, or hash..."
            data-testid="asset-search-input"
            className="soft-input bg-white/[0.04] border border-white/10 text-white pl-11 pr-4 py-6 rounded-lg focus:border-indigo-300 placeholder:text-[#64748B]"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item} className="premium-card rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="empty-state">
            <img
              src="https://static.prod-images.emergentagent.com/jobs/4363c4e3-7a58-4420-8a3b-9ae995a2edf7/images/bf4f62aca118c5b5462f6d0ea4b67bc74578ae6b92fa3525a5602db92e84255f.png"
              alt="Shield"
              className="w-24 h-24 opacity-40 mb-4"
            />
            <p className="text-[#94A3B8] text-sm">No assets registered yet</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 text-indigo-300 hover:text-white text-sm font-medium transition-colors"
            >
              Upload your first asset
            </button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] py-4 px-6">File Name</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] py-4 px-4">NFT ID</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] py-4 px-4 hidden md:table-cell">Owner</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] py-4 px-4">Status</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] py-4 px-4 hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="border-b border-white/5 hover:bg-white/[0.045] cursor-pointer transition-colors"
                  data-testid={`asset-row-${asset.id}`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{asset.fileName}</p>
                        <p className="text-xs text-[#475569] font-mono truncate max-w-[200px]">{asset.fileHash.slice(0, 16)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <span className="font-mono text-sm text-[#E2E8F0]" data-testid={`nft-id-${asset.id}`}>{asset.nftId}</span>
                  </TableCell>
                  <TableCell className="py-4 px-4 hidden md:table-cell">
                    <span className="text-sm text-[#94A3B8]">{asset.owner}</span>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    {asset.status === 'completed' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-400/20 hover:bg-emerald-500/10">
                        Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-300 border-amber-400/20 hover:bg-amber-500/10">
                        Processing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-4 hidden lg:table-cell">
                    <span className="text-sm text-[#94A3B8]">{formatDate(asset.createdAt)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              className="premium-card w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-lg p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2">Nexorium Asset</p>
                  <h2 className="text-3xl font-semibold gradient-text" style={{ fontFamily: 'Outfit' }}>
                    {selectedAsset.fileName}
                  </h2>
                  <p className="text-sm text-[#94A3B8] mt-2">
                    {selectedAsset.nftId} - {selectedAsset.ipfsHash || 'ipfs://pending'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors"
                  aria-label="Close asset details"
                >
                  <X className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-5">
                  <div className="bg-white/[0.035] border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-4 h-4 text-emerald-300" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Ownership Metadata</h3>
                    </div>
                    {[
                      ['Owner Email', selectedAsset.ownerEmail || 'Not available'],
                      ['Wallet Address', selectedAsset.walletAddress || 'Not connected'],
                      ['File Hash', selectedAsset.fileHash],
                      ['Created', formatDate(selectedAsset.createdAt)],
                      ['IPFS Placeholder', selectedAsset.ipfsHash || 'ipfs://fakeHash123'],
                      ['Royalty Earnings', `$${Number(selectedAsset.royaltyEarnings || 0).toFixed(2)}`],
                      ['Active Licenses', String((selectedAsset.activeLicenses || []).filter((license) => license.status === 'active').length)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8]">{label}</span>
                        <span className="text-sm text-right text-[#CBD5E1] break-all max-w-[58%]">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/[0.035] border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="w-4 h-4 text-amber-300" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Royalty Distribution</h3>
                    </div>
                    <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                      Transfers and licenses both contribute to a running royalty ledger for the creator.
                    </p>
                    <div className="text-3xl font-light text-white" style={{ fontFamily: 'Outfit' }}>
                      {selectedAsset.royaltyPercentage ?? 10}% <span className="text-sm text-[#94A3B8]">creator royalty</span>
                    </div>
                    <p className="text-sm text-amber-300 mt-2">
                      Earned: ${Number(selectedAsset.royaltyEarnings || 0).toFixed(2)}
                    </p>
                    <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 mt-5">
                      <Input
                        value={newOwner}
                        onChange={e => setNewOwner(e.target.value)}
                        placeholder="newowner@nexorium.com"
                        className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                      />
                      <Input
                        value={saleAmount}
                        onChange={e => setSaleAmount(e.target.value)}
                        type="number"
                        min="0"
                        className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                      />
                      <button
                        type="submit"
                        disabled={transferLoading || !newOwner.trim()}
                        className="premium-button disabled:bg-none disabled:bg-indigo-600/30 text-white rounded-lg px-4 py-2 text-sm font-medium"
                      >
                        {transferLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>

                  <div className="bg-white/[0.035] border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ScrollText className="w-4 h-4 text-violet-200" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Active Licenses</h3>
                    </div>
                    <form onSubmit={handleLicense} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3">
                      <Input
                        value={licenseeEmail}
                        onChange={e => setLicenseeEmail(e.target.value)}
                        placeholder="licensee@studio.com"
                        className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                      />
                      <Input
                        value={licenseFee}
                        onChange={e => setLicenseFee(e.target.value)}
                        type="number"
                        min="0"
                        className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                      />
                      <button
                        type="submit"
                        disabled={licenseLoading || !licenseeEmail.trim()}
                        className="premium-button disabled:bg-none disabled:bg-indigo-600/30 text-white rounded-lg px-4 py-2 text-sm font-medium"
                      >
                        {licenseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
                      </button>
                    </form>
                    <div className="space-y-3 mt-5">
                      {(selectedAsset.activeLicenses || []).length === 0 ? (
                        <p className="text-sm text-[#94A3B8]">No active licenses yet.</p>
                      ) : (
                        selectedAsset.activeLicenses.map((license) => (
                          <div key={license.licenseId} className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{license.licenseeEmail}</p>
                                <p className="text-xs text-[#94A3B8] mt-1">{license.licenseType} - expires {formatDate(license.expiresAt)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-violet-200">${Number(license.feeAmount || 0).toFixed(2)}</p>
                                <p className="text-xs text-amber-300">Royalty ${Number(license.royaltyAmount || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="bg-white/[0.035] border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <History className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Activity Timeline</h3>
                    </div>
                    <div className="space-y-4">
                      {(selectedAsset.transactionHistory || []).length === 0 ? (
                        <p className="text-sm text-[#94A3B8]">No transactions logged yet.</p>
                      ) : (
                        selectedAsset.transactionHistory.slice().reverse().map((tx, index) => (
                          <div key={`${tx.timestamp}-${index}`} className="relative pl-6">
                            <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-300 shadow-[0_0_18px_rgba(129,140,248,0.45)]" />
                            <p className="text-sm font-medium text-white capitalize">{tx.actionType}</p>
                            <p className="text-xs text-[#94A3B8] mt-1">{tx.user || 'system'} - {formatDate(tx.timestamp)}</p>
                            {tx.message && <p className="text-xs text-emerald-300 mt-1">{tx.message}</p>}
                            {tx.transactionHash && <p className="text-xs font-mono text-[#64748B] break-all mt-1">{tx.transactionHash}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white/[0.035] border border-white/10 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ScrollText className="w-4 h-4 text-emerald-200" strokeWidth={1.5} />
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Audit Trail</h3>
                    </div>
                    {!auditReport ? (
                      <p className="text-sm text-[#94A3B8]">Preparing evidence report...</p>
                    ) : (
                      <div className="space-y-3">
                        {[
                          ['Generated', formatDate(auditReport.generatedAt)],
                          ['Transactions', String(auditReport.transactionCount || 0)],
                          ['Active Licenses', String(auditReport.activeLicenseCount || 0)],
                          ['Creator Earnings', `$${Number(auditReport.royaltyEarnings || 0).toFixed(2)}`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                            <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8]">{label}</span>
                            <span className="text-sm text-right text-[#CBD5E1]">{value}</span>
                          </div>
                        ))}
                        <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                          <p className="text-xs font-mono uppercase tracking-[0.15em] text-[#818CF8] mb-2">Evidence Summary</p>
                          <p className="text-sm text-[#CBD5E1] leading-relaxed">
                            Ownership anchored to {auditReport.fileHash?.slice(0, 18)}... with {auditReport.transactionCount || 0} recorded events and {auditReport.activeLicenseCount || 0} active licenses.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
