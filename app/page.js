'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('jnanasudha_username', username);
        sessionStorage.setItem('jnanasudha_password', password);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-900/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wider">JUT ANALYTICS</h1>
            <p className="text-gray-500 text-xs mt-2 tracking-wider">AUTHENTICATION REQUIRED</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Jnanasudha Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition text-sm" placeholder="Enter your mobile number" required />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition text-sm" placeholder="Enter your Jnanasudha password" required />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:scale-[1.02] transition-all duration-300 text-white font-semibold text-sm tracking-wider shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:hover:scale-100">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⟳</span> AUTHENTICATING...</span> : 'UNLOCK'}
            </button>
          </form>
          <div className="mt-6 text-center"><p className="text-gray-600 text-[10px] tracking-wider">CONTACT ADMIN IF YOU DON'T HAVE ACCESS</p></div>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
}
