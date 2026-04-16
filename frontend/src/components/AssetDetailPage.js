import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeDollarSign, Crown, Download, ExternalLink, FileText, History, Loader2, ScrollText, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { downloadAssetFile, getAsset, getAssetFileBlob, getAuditReport, getTransactions, licenseAsset, transferAsset } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [auditReport, setAuditReport] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [saleAmount, setSaleAmount] = useState('100');
  const [licenseeEmail, setLicenseeEmail] = useState('');
  const [licenseFee, setLicenseFee] = useState('75');

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [assetData, auditData, transactionData] = await Promise.all([
        getAsset(assetId),
        getAuditReport(assetId),
        getTransactions(assetId),
      ]);
      setAsset(assetData);
      setAuditReport(auditData);
      setTransactions(transactionData.transactions || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Asset details failed to load');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [assetId, navigate]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const isOwner = !!asset && !!user && asset.ownerEmail === user.email;
  const canInlinePreview = !!asset?.fileType && (asset.fileType.startsWith('image/') || asset.fileType.startsWith('video/'));

  useEffect(() => {
    let objectUrl = '';
    if (!asset || !isOwner || !canInlinePreview) {
      setPreviewUrl('');
      return undefined;
    }

    setPreviewLoading(true);
    getAssetFileBlob(asset.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        setPreviewUrl('');
        toast.error('Preview could not be loaded');
      })
      .finally(() => setPreviewLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset, isOwner, canInlinePreview]);

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!asset || !newOwner.trim()) return;

    setTransferLoading(true);
    try {
      await transferAsset({
        assetId: asset.id,
        newOwner,
        saleAmount: Number(saleAmount) || 100,
      });
      toast.success('Ownership transfer recorded');
      setNewOwner('');
      await loadPage();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleLicense = async (event) => {
    event.preventDefault();
    if (!asset || !licenseeEmail.trim()) return;

    setLicenseLoading(true);
    try {
      await licenseAsset({
        assetId: asset.id,
        licenseeEmail,
        feeAmount: Number(licenseFee) || 75,
      });
      toast.success('License issued successfully');
      setLicenseeEmail('');
      await loadPage();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'License activation failed');
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!asset || !isOwner) return;
    try {
      const blob = await downloadAssetFile(asset.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.fileName || 'asset';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const summaryRows = useMemo(() => (asset ? [
    ['NFT ID', asset.nftId],
    ['File Hash', asset.fileHash],
    ['Owner Email', asset.ownerEmail || 'Not available'],
    ['Wallet Address', asset.walletAddress || 'Not connected'],
    ['Created', formatDate(asset.createdAt)],
    ['Minted', formatDate(asset.mintedAt)],
    ['IPFS Reference', asset.ipfsHash || 'ipfs://pending'],
  ] : []), [asset]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#03040B] pt-32 sm:pt-24">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div className="premium-shell min-h-screen px-4 sm:px-8 lg:px-12 pt-32 sm:pt-24 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div className="min-w-0">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Back to dashboard
            </button>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2">Asset Detail</p>
            <h1 className="text-3xl sm:text-4xl font-semibold gradient-text break-words" style={{ fontFamily: 'Outfit' }}>
              {asset.fileName}
            </h1>
            <p className="text-sm text-[#94A3B8] mt-2 break-all">{asset.nftId}</p>
          </div>
          <Badge className={isOwner ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20 hover:bg-emerald-500/10 self-start' : 'bg-white/5 text-[#CBD5E1] border-white/10 hover:bg-white/5 self-start'}>
            {isOwner ? 'Owner Access' : 'Proof Access'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Asset Preview</h2>
              </div>
              {isOwner ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/8 bg-black/20 min-h-[260px] overflow-hidden flex items-center justify-center">
                    {previewLoading ? (
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    ) : asset.fileType?.startsWith('image/') && previewUrl ? (
                      <img src={previewUrl} alt={asset.fileName} className="w-full max-h-[520px] object-contain" />
                    ) : asset.fileType?.startsWith('video/') && previewUrl ? (
                      <video src={previewUrl} controls className="w-full max-h-[520px] object-contain bg-black" />
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <p className="text-white font-medium">Protected owner-only file access</p>
                        <p className="text-sm text-[#94A3B8] mt-2">
                          This format is available through secure backend delivery. Use the buttons below to open or download it.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const blob = await getAssetFileBlob(asset.id);
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank', 'noopener,noreferrer');
                          setTimeout(() => URL.revokeObjectURL(url), 30000);
                        } catch {
                          toast.error('Protected view failed');
                        }
                      }}
                      className="premium-button text-white rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                      View Asset
                    </button>
                    <button
                      onClick={handleDownload}
                      className="rounded-lg border border-white/10 bg-white/[0.04] text-white px-4 py-2 text-sm font-medium hover:bg-white/[0.08] transition-colors inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.5} />
                      Download Asset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    This file is served only to the current owner through secured backend checks. You can still review the proof records, licensing activity, and full evidence trail below.
                  </p>
                </div>
              )}
            </section>

            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-300" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Proof Details</h2>
              </div>
              <div className="space-y-3">
                {summaryRows.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8]">{label}</span>
                    <span className="text-sm text-[#CBD5E1] break-all sm:text-right sm:max-w-[64%]">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Transfer History</h2>
              </div>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">No transactions logged yet.</p>
                ) : (
                  transactions.slice().reverse().map((tx, index) => (
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
            </section>
          </div>

          <div className="space-y-6">
            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-amber-300" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Royalty History</h2>
              </div>
              <div className="text-3xl font-light text-white" style={{ fontFamily: 'Outfit' }}>
                {asset.royaltyPercentage ?? 10}% <span className="text-sm text-[#94A3B8]">creator royalty</span>
              </div>
              <p className="text-sm text-amber-300 mt-2">
                Earned: ${Number(asset.royaltyEarnings || 0).toFixed(2)}
              </p>
              {isOwner && (
                <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 mt-5">
                  <Input
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="newowner@nexorium.com"
                    className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                  />
                  <Input
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    type="number"
                    min="0"
                    className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={transferLoading || !newOwner.trim()}
                    className="premium-button disabled:bg-none disabled:bg-indigo-600/30 text-white rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center justify-center"
                  >
                    {transferLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </section>

            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ScrollText className="w-4 h-4 text-violet-200" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Active Licenses</h2>
              </div>
              {isOwner && (
                <form onSubmit={handleLicense} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-3 mb-5">
                  <Input
                    value={licenseeEmail}
                    onChange={(e) => setLicenseeEmail(e.target.value)}
                    placeholder="licensee@studio.com"
                    className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                  />
                  <Input
                    value={licenseFee}
                    onChange={(e) => setLicenseFee(e.target.value)}
                    type="number"
                    min="0"
                    className="soft-input bg-white/[0.04] border border-white/10 text-white rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={licenseLoading || !licenseeEmail.trim()}
                    className="premium-button disabled:bg-none disabled:bg-indigo-600/30 text-white rounded-lg px-4 py-2 text-sm font-medium inline-flex items-center justify-center"
                  >
                    {licenseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
                  </button>
                </form>
              )}
              <div className="space-y-3">
                {(asset.activeLicenses || []).length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">No active licenses yet.</p>
                ) : (
                  asset.activeLicenses.map((license) => (
                    <div key={license.licenseId} className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white break-all">{license.licenseeEmail}</p>
                          <p className="text-xs text-[#94A3B8] mt-1">{license.licenseType} - expires {formatDate(license.expiresAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-violet-200">${Number(license.feeAmount || 0).toFixed(2)}</p>
                          <p className="text-xs text-amber-300">Royalty ${Number(license.royaltyAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="premium-card rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BadgeDollarSign className="w-4 h-4 text-emerald-200" strokeWidth={1.5} />
                <h2 className="font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Audit Report</h2>
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
