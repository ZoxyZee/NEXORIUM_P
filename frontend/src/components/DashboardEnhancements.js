import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Fingerprint,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const quickActions = [
  {
    title: 'Register New IP',
    description: 'Upload a file and create a protected ownership record.',
    icon: Upload,
    action: 'upload',
  },
  {
    title: 'Verify Ownership',
    description: 'Check any file hash or NFT ID against registered assets.',
    icon: ShieldCheck,
    action: 'verify',
  },
  {
    title: 'Connect Wallet',
    description: 'Link MetaMask or a demo wallet to your identity.',
    icon: Wallet,
    action: 'wallet',
  },
  {
    title: 'Security Check',
    description: 'Review your protection readiness for demo confidence.',
    icon: Gauge,
    action: 'check',
  },
];

const checklist = [
  'Use original source files for upload',
  'Connect a verified wallet before registering assets',
  'Store the NFT ID and SHA-256 ownership record',
  'Verify ownership before sharing proof links',
];

const articles = [
  {
    title: 'Why File Hashes Matter',
    category: 'Ownership Proof',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80',
    summary: 'A SHA-256 hash acts like a fingerprint for your digital work, making tampering easier to detect.',
    body: 'A file hash is a compact proof that a specific file existed in a specific state. When the file changes, even slightly, the hash changes too. Nexorium uses this idea to make ownership checks simple, repeatable, and demo-friendly.',
  },
  {
    title: 'Wallets as Creator Identity',
    category: 'Web3 Identity',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=900&q=80',
    summary: 'A connected wallet gives your protected assets a portable identity layer beyond email login.',
    body: 'Email proves account access. A wallet adds a public identity that can travel across Web3 systems. A connected wallet helps creators anchor protected assets to a reusable on-chain identity that can support verification, licensing, and royalty flows.',
  },
  {
    title: 'How to Share Proof Safely',
    category: 'Creator Workflow',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    summary: 'Share the NFT ID or hash when you need verification without exposing private project files.',
    body: 'A verification hash lets another person confirm ownership without needing access to your original file. That keeps sensitive work private while still giving collaborators, clients, or reviewers a reliable proof trail.',
  },
];

export function DashboardEnhancements({ onWalletOpen }) {
  const navigate = useNavigate();
  const [activeArticle, setActiveArticle] = useState(null);

  const runAction = (action) => {
    if (action === 'upload') navigate('/upload');
    if (action === 'verify') navigate('/verify');
    if (action === 'wallet') onWalletOpen?.();
    if (action === 'check') toast.success('Security checklist ready');
  };

  return (
    <>
      <motion.section
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
        }}
        className="mb-10"
      >
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              Command Center
            </p>
            <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
              Move faster with protected workflows
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {quickActions.map(({ title, description, icon: Icon, action }) => (
            <motion.button
              key={title}
              whileHover={{ y: -6, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runAction(action)}
              className="premium-card rounded-lg p-5 text-left overflow-hidden group"
            >
              <div className="relative flex items-start justify-between gap-4">
                <div className="w-11 h-11 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-200" strokeWidth={1.5} />
                </div>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-white transition-colors" strokeWidth={1.5} />
              </div>
              <h3 className="relative text-base font-semibold text-white mt-5" style={{ fontFamily: 'Outfit' }}>
                {title}
              </h3>
              <p className="relative text-sm text-[#94A3B8] mt-2 leading-relaxed">
                {description}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
        }}
        className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-6 mb-10"
      >
        <div className="premium-card rounded-lg p-6 overflow-hidden">
          <div className="relative flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-300/20 flex items-center justify-center">
              <LockKeyhole className="w-5 h-5 text-emerald-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD]">Protection Score</p>
              <h3 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Protection Active</h3>
            </div>
          </div>
          <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '86%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full premium-button"
            />
          </div>
          <div className="relative space-y-3">
            {checklist.map((label) => (
              <div key={label} className="flex items-center gap-3 text-sm text-[#CBD5E1]">
                <CheckCircle className="w-4 h-4 text-emerald-300" strokeWidth={1.5} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#93C5FD] mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                Knowledge Hub
              </p>
              <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                Learn digital ownership basics
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {articles.map((article) => (
              <motion.button
                key={article.title}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveArticle(article)}
                className="premium-card rounded-lg overflow-hidden text-left group"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#03040B] via-[#03040B]/25 to-transparent" />
                </div>
                <div className="relative p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#93C5FD]">{article.category}</span>
                    <span className="text-xs text-[#64748B]">{article.readTime}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white" style={{ fontFamily: 'Outfit' }}>
                    {article.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {activeArticle && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveArticle(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="premium-card w-full max-w-2xl rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={activeArticle.title}
            >
              <div className="relative h-56 overflow-hidden">
                <img src={activeArticle.image} alt={activeArticle.title} className="h-full w-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03040B] via-[#03040B]/30 to-transparent" />
                <button
                  onClick={() => setActiveArticle(null)}
                  className="absolute right-4 top-4 w-9 h-9 rounded-lg border border-white/10 bg-black/30 text-white hover:bg-black/50 transition-colors"
                  aria-label="Close article"
                >
                  <X className="w-4 h-4 mx-auto" strokeWidth={1.5} />
                </button>
              </div>
              <div className="relative p-7">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint className="w-4 h-4 text-indigo-200" strokeWidth={1.5} />
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#93C5FD]">{activeArticle.category}</span>
                  <span className="text-xs text-[#64748B]">{activeArticle.readTime}</span>
                </div>
                <h2 className="text-3xl font-semibold gradient-text" style={{ fontFamily: 'Outfit' }}>
                  {activeArticle.title}
                </h2>
                <p className="text-[#CBD5E1] leading-relaxed mt-4">
                  {activeArticle.body}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
