import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Login failed. Check your credentials.');
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
      data-testid="login-page"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'Outfit' }}>
            Nexorium
          </h1>
          <p className="text-[#94A3B8] text-sm mt-2">Sign in to protect your digital assets</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#090B14] border border-white/5 rounded-2xl p-8 space-y-6" data-testid="login-form">
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" strokeWidth={1.5} />
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="user1@nexorium.com"
                required
                data-testid="login-email"
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
                placeholder="Enter password"
                required
                data-testid="login-password"
                className="bg-[#0D111D] border border-white/10 text-white pl-11 pr-4 py-6 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-[#475569]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit-btn"
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white rounded-full py-4 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
          <p className="text-center text-sm text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors" data-testid="register-link">
              Register
            </Link>
          </p>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 bg-[#0D111D] border border-white/5 rounded-xl p-4" data-testid="demo-credentials">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#818CF8] mb-2">Demo Credentials</p>
          <div className="space-y-1 text-sm text-[#94A3B8]">
            <p>user1@nexorium.com / 123456</p>
            <p>user2@nexorium.com / 123456</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
