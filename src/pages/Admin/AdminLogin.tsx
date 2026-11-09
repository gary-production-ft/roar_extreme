import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('admin@roarextreme.com');
  const [password, setPassword] = useState('RoarAdmin#2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.token, data.admin);
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Unable to connect to authentication server. Ensure backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden cursor-default select-auto">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF5A1F]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="font-heading font-black text-3xl tracking-widest text-white">
            ROAR <span className="text-[#FF5A1F]">EXTREME</span>
          </span>
          <h1 className="text-xs uppercase font-mono tracking-widest text-white/50 mt-1">
            Studio Management Portal
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase font-mono text-white/60 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@roarextreme.com"
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5A1F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase font-mono text-white/60 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5A1F] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg shadow-[#FF5A1F]/20"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40 font-mono">
            Provisioned Superadmin: <br />
            <span className="text-white/70">admin@roarextreme.com</span> /{' '}
            <span className="text-[#FF5A1F]/80">RoarAdmin#2026</span>
          </p>
        </div>
      </div>
    </div>
  );
};

