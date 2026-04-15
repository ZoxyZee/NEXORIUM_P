import { useEffect, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '../components/ui/sheet';
import { Wallet, FileText, Hexagon, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '@/lib/api';
import { motion } from 'framer-motion';

export function ProfileDrawer({ open, onClose, walletAddress }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (open && token) {
      getProfile().then(data => setProfile(data)).catch(() => {});
    }
  }, [open, token]);

  const initials = profile ? profile.username.split(' ').map(w => w[0]).join('').toUpperCase() : 'DU';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="bg-[#090B14] border-l border-white/5 text-white w-full sm:max-w-sm p-0"
        data-testid="profile-drawer"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>User profile and statistics</SheetDescription>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="p-8 space-y-8"
        >
          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="p-[2px] rounded-full bg-gradient-to-br from-sky-400 via-indigo-400 to-emerald-300 shadow-[0_0_44px_rgba(79,70,229,0.22)]"
            >
              <div className="w-20 h-20 rounded-full bg-[#090B14] flex items-center justify-center text-2xl font-semibold" style={{ fontFamily: 'Outfit' }}>
                {initials}
              </div>
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold gradient-text" style={{ fontFamily: 'Outfit' }} data-testid="profile-username">
                {profile?.username || 'Demo User'}
              </h3>
              <p className="text-[#94A3B8] text-sm mt-1" data-testid="profile-email">
                {profile?.email || 'demo@Nexorium.io'}
              </p>
            </div>
          </div>

          {/* Wallet */}
          <motion.div
            whileHover={{ y: -2 }}
            className="premium-card rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-[#F6851B]" strokeWidth={1.5} />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#818CF8]">Wallet Address</span>
            </div>
            <p className="font-mono text-sm text-[#E2E8F0] break-all" data-testid="profile-wallet">
              {walletAddress || profile?.walletAddress || 'Not connected'}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="premium-card rounded-lg p-5 text-center"
            >
              <FileText className="w-5 h-5 text-indigo-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }} data-testid="profile-total-assets">
                {profile?.totalAssets ?? 0}
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">Assets Uploaded</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="premium-card rounded-lg p-5 text-center"
            >
              <Hexagon className="w-5 h-5 text-purple-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-2xl font-semibold" style={{ fontFamily: 'Outfit' }} data-testid="profile-total-nfts">
                {profile?.totalNFTs ?? 0}
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">NFTs Created</p>
            </motion.div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <span className="text-[#94A3B8]">Account Type:</span>
              <span className="text-white ml-auto">Standard</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <span className="text-[#94A3B8]">Notifications:</span>
              <span className="text-emerald-400 ml-auto">Active</span>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
