import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Hash, Hexagon, CheckCircle, Loader2, X, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { mintAsset, uploadAsset } from '@/lib/api';

const steps = [
  { key: 'upload', label: 'File Uploaded', icon: Upload },
  { key: 'hash', label: 'Hash Generated', icon: Hash },
  { key: 'metadata', label: 'Metadata Created', icon: FileText },
  { key: 'mint', label: 'NFT Record Created', icon: Hexagon },
  { key: 'done', label: 'Completed', icon: CheckCircle },
];

export default function UploadPage({ walletHook, onWalletOpen }) {
  const { account } = walletHook;
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const resetForm = () => {
    setFile(null);
    setCurrentStep(-1);
    setResult(null);
    setUploading(false);
  };

  const handleRegister = async () => {
    if (!file) return;
    setUploading(true);
    setCurrentStep(0);

    try {
      // Step 1: Upload
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(1);

      // Step 2: Hash generated (backend does this)
      const uploadedAsset = await uploadAsset(file, account || '');

      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 800));

      // Step 3: Simulate NFT record creation.
      // Replace with actual Solidity contract interaction:
      // contract.mintNFT(fileHash, metadataURI) via ethers.js.
      setCurrentStep(3);
      const mintedAsset = await mintAsset(uploadedAsset.id);

      setCurrentStep(4);
      setResult(mintedAsset);
      toast.success('NFT Created Successfully');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
      setCurrentStep(-1);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="premium-shell min-h-screen px-6 sm:px-12 pt-24 pb-12"
      data-testid="upload-page"
    >
      <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2">Register</p>
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight gradient-text" style={{ fontFamily: 'Outfit' }}>
          Upload & Protect
        </h1>
        <p className="text-[#94A3B8] mt-3 text-base leading-relaxed">
          Upload your digital asset to generate a unique SHA-256 hash and NFT certificate.
        </p>
      </div>

      {/* Wallet connection */}
      {!account && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card mb-8 rounded-lg p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-[#F6851B]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-white">Connect your wallet</p>
              <p className="text-xs text-[#94A3B8]">Link your wallet to associate ownership</p>
            </div>
          </div>
          <button
            onClick={onWalletOpen}
            data-testid="upload-connect-wallet"
            className="flex items-center gap-2 bg-[#F6851B]/10 border border-[#F6851B]/25 text-[#FDBA74] hover:bg-[#F6851B]/15 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Wallet className="w-4 h-4" strokeWidth={1.5} />
            Connect
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="upload-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-zone"
              className={`upload-zone relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                dragging
                  ? 'border-indigo-500/50 bg-indigo-600/5 dragging'
                : file
                    ? 'border-emerald-500/30 bg-emerald-600/5'
                    : 'border-white/10 bg-white/[0.035] hover:border-[#4F46E5]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.txt,.js,.py,.html,.css,.json,.md"
                data-testid="file-input"
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    initial={{ scale: 0.86, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                  >
                    <FileText className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                  </motion.div>
                  <div>
                    <p className="text-white font-medium" data-testid="selected-file-name">{file.name}</p>
                    <p className="text-[#94A3B8] text-sm mt-1">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-[#94A3B8] hover:text-white text-xs flex items-center gap-1 mt-2 transition-colors"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-14 h-14 rounded-lg bg-indigo-600/10 flex items-center justify-center"
                  >
                    <Upload className="w-7 h-7 text-indigo-400" strokeWidth={1.5} />
                  </motion.div>
                  <div>
                    <p className="text-white font-medium">Drop your file here, or click to browse</p>
                    <p className="text-[#475569] text-sm mt-1">Supports images, PDFs, and code files</p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            {currentStep >= 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="premium-card rounded-lg p-8 overflow-hidden"
              >
                <div className="relative mb-8 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 premium-button"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  {steps.map((step, i) => {
                    const StepIcon = step.icon;
                    const active = i <= currentStep;
                    const current = i === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        <motion.div
                          animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ duration: 0.35 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          active
                            ? current && uploading
                              ? 'bg-indigo-600/20 border border-indigo-500/40'
                              : 'bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
                            : 'bg-white/5 border border-white/10'
                        }`}
                        >
                          {current && uploading ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" strokeWidth={1.5} />
                          ) : (
                            <StepIcon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-[#475569]'}`} strokeWidth={1.5} />
                          )}
                        </motion.div>
                        <p className={`text-xs mt-2 text-center ${active ? 'text-white' : 'text-[#475569]'}`}>
                          {step.label}
                        </p>
                        {i < steps.length - 1 && (
                          <div className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-[2px] ${
                            i < currentStep ? 'bg-emerald-500/40' : 'bg-white/5'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={!file || uploading}
              data-testid="register-submit-btn"
              className="w-full premium-button disabled:bg-none disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white rounded-lg px-6 py-4 font-medium transition-all disabled:shadow-none text-sm"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                </span>
              ) : (
                'Register & Mint NFT'
              )}
            </button>
          </motion.div>
        ) : (
          /* Success Result */
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="premium-card border-emerald-500/20 rounded-lg p-8"
            data-testid="registration-result"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-300/25 shadow-[0_0_34px_rgba(16,185,129,0.22)]"
              >
                <CheckCircle className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
              </motion.div>
              <h2 className="text-2xl font-medium text-white" style={{ fontFamily: 'Outfit' }}>
                NFT Created Successfully
              </h2>
              <p className="text-[#94A3B8] text-sm mt-2">Your file has been securely registered</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'File Name', value: result.fileName },
                { label: 'NFT ID', value: result.nftId },
                { label: 'File Hash', value: result.fileHash, mono: true },
                { label: 'IPFS Hash', value: result.ipfsHash || 'ipfs://fakeHash123', mono: true },
                { label: 'Royalty', value: `${result.royaltyPercentage ?? 10}%` },
                { label: 'Owner', value: result.owner },
                { label: 'Status', value: result.status, badge: true },
                { label: 'Timestamp', value: new Date(result.createdAt).toLocaleString() },
              ].map(({ label, value, mono, badge }) => (
                <div key={label} className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8]">{label}</span>
                  {badge ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-md">
                      Completed
                    </span>
                  ) : (
                    <span className={`text-sm text-right max-w-[60%] break-all ${mono ? 'font-mono text-[#E2E8F0] text-xs' : 'text-white'}`} data-testid={`result-${label.toLowerCase().replace(/\s/g, '-')}`}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Blockchain-ready note */}
            <div className="mt-6 bg-[#0D111D] border border-white/5 rounded-xl p-4">
              <p className="text-xs text-[#94A3B8]">
                {/* Future: Deploy smart contract on Polygon testnet for on-chain minting.
                    Planned: IPFS storage for decentralized file hosting.
                    Roadmap: Royalty system for secondary sales. */}
                This NFT has been simulated for demo. Blockchain minting on Polygon testnet will be available in production.
              </p>
            </div>

            <button
              onClick={resetForm}
              data-testid="register-another-btn"
              className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white rounded-lg px-6 py-3 font-medium transition-all text-sm border border-white/10"
            >
              Register Another Asset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}
