import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name || 'User');
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center px-6 bg-[#03040B]"
      data-testid="register-page"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <BrandLogo size={56} className="mx-auto mb-4 shadow-[0_10px_30px_rgba(99,102,241,0.25)]" />
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'Outfit' }}>
            Create Account
          </h1>
          <p className="text-[#94A3B8] text-sm mt-2">Register to start protecting your digital assets</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#090B14] border border-white/5 rounded-2xl p-8 space-y-6" data-testid="register-form">
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] mb-2 block">Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                data-testid="register-name"
                className="bg-[#0D111D] border border-white/10 text-white pl-11 pr-4 py-6 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-[#475569]"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                data-testid="register-email"
                className="bg-[#0D111D] border border-white/10 text-white pl-11 pr-4 py-6 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-[#475569]"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="Min 6 characters"
                required
                data-testid="register-password"
                className="bg-[#0D111D] border border-white/10 text-white pl-11 pr-4 py-6 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-[#475569]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="register-submit-btn"
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white rounded-full py-4 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
          <p className="text-center text-sm text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors" data-testid="login-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </motion.div>
  );
}
