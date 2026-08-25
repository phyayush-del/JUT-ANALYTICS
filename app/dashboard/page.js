// 🚀 FORCE REDEPLOY - 2026-08-25
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area
} from 'recharts';

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showData, setShowData] = useState(false);
  const [user, setUser] = useState('');
  const [targetScore, setTargetScore] = useState(680);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const username = sessionStorage.getItem('jnanasudha_username');
    if (!isLoggedIn || !username) {
      router.push('/');
    } else {
      setUser(username);
      // Try to load cached results
      const cached = localStorage.getItem('jutResults');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setResults(parsed);
          setShowData(true);
        } catch (e) {}
      }
    }
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const username = sessionStorage.getItem('jnanasudha_username');
      const password = sessionStorage.getItem('jnanasudha_password');
      
      if (!username || !password) {
        throw new Error('Credentials not found');
      }

      const response = await fetch('/api/fetch-results', {
        headers: {
          'x-username': username,
          'x-password': password,
        }
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Error:', data.error);
        setShowData(false);
        setResults([]);
        return;
      }
      
      setResults(data);
      setShowData(true);
      // Cache results
      localStorage.setItem('jutResults', JSON.stringify(data));
    } catch (error) {
      console.error('Fetch error:', error);
      setResults([]);
      setShowData(false);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('jutResults');
    router.push('/');
  };

  const exportPDF = () => {
    window.print();
  };

  // --- ANALYTICS FUNCTIONS ---
  const getBestSubject = () => {
    if (results.length === 0) return 'N/A';
    const avgPhysics = results.reduce((a, b) => a + (b.physics || 0), 0) / results.length;
    const avgChemistry = results.reduce((a, b) => a + (b.chemistry || 0), 0) / results.length;
    const avgBiology = results.reduce((a, b) => a + (b.biology || 0), 0) / results.length;
    
    const max = Math.max(avgPhysics, avgChemistry, avgBiology);
    if (max === avgPhysics) return 'Physics';
    if (max === avgChemistry) return 'Chemistry';
    return 'Biology';
  };

  const getImprovingSubject = () => {
    if (results.length < 3) return 'Need more data';
    const sorted = [...results].sort((a, b) => a.id - b.id);
    const first = sorted.slice(0, 3);
    const last = sorted.slice(-3);
    
    const firstAvg = {
      physics: first.reduce((a, b) => a + (b.physics || 0), 0) / first.length,
      chemistry: first.reduce((a, b) => a + (b.chemistry || 0), 0) / first.length,
      biology: first.reduce((a, b) => a + (b.biology || 0), 0) / first.length,
    };
    const lastAvg = {
      physics: last.reduce((a, b) => a + (b.physics || 0), 0) / last.length,
      chemistry: last.reduce((a, b) => a + (b.chemistry || 0), 0) / last.length,
      biology: last.reduce((a, b) => a + (b.biology || 0), 0) / last.length,
    };
    
    const improvements = {
      physics: lastAvg.physics - firstAvg.physics,
      chemistry: lastAvg.chemistry - firstAvg.chemistry,
      biology: lastAvg.biology - firstAvg.biology,
    };
    
    const max = Math.max(improvements.physics, improvements.chemistry, improvements.biology);
    if (max <= 0) return 'Stable';
    if (max === improvements.physics) return 'Physics';
    if (max === improvements.chemistry) return 'Chemistry';
    return 'Biology';
  };

  const getConsistency = () => {
    if (results.length < 2) return 100;
    const scores = results.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avg) * 100);
    return Math.round(consistency);
  };

  const getTargetProgress = () => {
    if (results.length === 0 || targetScore === 0) return 0;
    const currentAvg = results.reduce((a, b) => a + b.score, 0) / results.length;
    const progress = Math.min(100, Math.round((currentAvg / targetScore) * 100));
    return Math.min(100, progress);
  };

  const getTrend = (subject) => {
    if (results.length < 3) return 'Need more data';
    const sorted = [...results].sort((a, b) => a.id - b.id);
    const first = sorted.slice(0, 2);
    const last = sorted.slice(-2);
    const firstAvg = first.reduce((a, b) => a + (b[subject] || 0), 0) / first.length;
    const lastAvg = last.reduce((a, b) => a + (b[subject] || 0), 0) / last.length;
    const diff = lastAvg - firstAvg;
    if (diff > 10) return '📈 Improving';
    if (diff < -10) return '📉 Declining';
    return '📊 Stable';
  };

  // Chart Data
  const chartData = results.map(r => ({
    name: `JUT ${r.id}`,
    score: r.score,
    rank: r.rank,
    physics: r.physics || 0,
    chemistry: r.chemistry || 0,
    biology: r.biology || 0,
  }));

  const radarData = results.length > 0 ? [
    { subject: 'Physics', value: Math.round(results.reduce((a, b) => a + (b.physics || 0), 0) / results.length) || 0 },
    { subject: 'Chemistry', value: Math.round(results.reduce((a, b) => a + (b.chemistry || 0), 0) / results.length) || 0 },
    { subject: 'Biology', value: Math.round(results.reduce((a, b) => a + (b.biology || 0), 0) / results.length) || 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wider">
            JUT ANALYTICS
          </h1>
          <p className="text-gray-500 text-xs mt-1 tracking-wider">
            NEET PERFORMANCE SYSTEM 
            <span className="text-purple-400 ml-2">👤 {user}</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={fetchResults}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:scale-105 transition text-white text-xs font-semibold tracking-wider disabled:opacity-50"
          >
            {loading ? '⟳ SYNCING...' : '📥 SYNC RESULTS'}
          </button>
          <button
            onClick={exportPDF}
            className="px-6 py-2.5 bg-green-500/20 border border-green-500/30 rounded-xl hover:scale-105 transition text-green-400 text-xs font-semibold tracking-wider"
          >
            📄 EXPORT PDF
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl hover:scale-105 transition text-red-400 text-xs font-semibold tracking-wider"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {showData && results.length > 0 && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Current Score" value={results[results.length-1]?.score || 0} />
            <StatCard label="Best Score" value={Math.max(...results.map(r => r.score))} />
            <StatCard label="Avg Score" value={Math.round(results.reduce((a,b) => a + b.score, 0) / results.length)} />
            <StatCard label="Current Rank" value={`#${results[results.length-1]?.rank || 0}`} />
            <StatCard label="Best Rank" value={`#${Math.min(...results.map(r => r.rank))}`} />
            <StatCard label="Tests" value={results.length} />
          </div>

          {/* Insights Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <InsightCard 
              title="🏆 Best Subject" 
              value={getBestSubject()} 
              detail="Based on average marks"
            />
            <InsightCard 
              title="📈 Improving Subject" 
              value={getImprovingSubject()} 
              detail="Most progress"
            />
            <InsightCard 
              title="📊 Consistency" 
              value={`${getConsistency()}%`} 
              detail="Score stability"
            />
            <InsightCard 
              title="🎯 Target Progress" 
              value={`${getTargetProgress()}%`} 
              detail={`Target: ${targetScore}`}
            />
          </div>

          {/* Subject Trends */}
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10 mb-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 tracking-wider">📈 SUBJECT TRENDS</h3>
            <div className="grid grid-cols-3 gap-4">
              <TrendIndicator 
                subject="Physics" 
                value={getTrend('physics')} 
                color="cyan-400"
              />
              <TrendIndicator 
                subject="Chemistry" 
                value={getTrend('chemistry')} 
                color="green-400"
              />
              <TrendIndicator 
                subject="Biology" 
                value={getTrend('biology')} 
                color="pink-400"
              />
            </div>
          </div>

          {/* Target Setter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => setShowTargetInput(!showTargetInput)}
              className="px-4 py-2 bg-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/20 transition"
            >
              {showTargetInput ? 'Hide Target' : '🎯 Set Target Score'}
            </button>
            {showTargetInput && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white w-32 text-center"
                  placeholder="680"
                />
                <span className="text-gray-400 text-sm">Target Score</span>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="SCORE PROGRESSION">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 6 }} />
                  <Area type="monotone" dataKey="score" fill="#8b5cf6" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="RANK PROGRESSION">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis reversed stroke="#555" />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rank" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Subject Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ChartCard title="PHYSICS">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Line type="monotone" dataKey="physics" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="CHEMISTRY">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Line type="monotone" dataKey="chemistry" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="BIOLOGY">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Line type="monotone" dataKey="biology" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Radar + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="SUBJECT PERFORMANCE">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" stroke="#555" />
                  <PolarRadiusAxis stroke="#555" />
                  <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="SUBJECT COMPARISON">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#555" />
                  <YAxis stroke="#555" />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222' }} />
                  <Legend />
                  <Bar dataKey="physics" fill="#06b6d4" />
                  <Bar dataKey="chemistry" fill="#22c55e" />
                  <Bar dataKey="biology" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Table */}
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4 tracking-wider">📊 JUT HISTORY</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">JUT</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">SCORE</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">RANK</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">PHYSICS</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">CHEMISTRY</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">BIOLOGY</th>
                    <th className="text-left p-3 text-gray-500 text-xs tracking-wider">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="p-3 text-white text-sm">JUT {result.id}</td>
                      <td className="p-3 text-purple-400 font-bold text-sm">{result.score}</td>
                      <td className="p-3 text-purple-400 text-sm">#{result.rank}</td>
                      <td className="p-3 text-cyan-400 text-sm">{result.physics}</td>
                      <td className="p-3 text-green-400 text-sm">{result.chemistry}</td>
                      <td className="p-3 text-pink-400 text-sm">{result.biology}</td>
                      <td className="p-3 text-white font-semibold text-sm">{(result.physics || 0) + (result.chemistry || 0) + (result.biology || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showData && results.length === 0 && (
        <div className="bg-white/5 rounded-2xl p-16 text-center backdrop-blur-sm border border-white/10">
          <div className="text-6xl mb-6">📭</div>
          <h2 className="text-xl font-bold text-white mb-2">NO RESULTS FOUND</h2>
          <p className="text-gray-500 text-sm">We couldn't find any JUT results for your account.</p>
        </div>
      )}

      {!showData && (
        <div className="bg-white/5 rounded-2xl p-16 text-center backdrop-blur-sm border border-white/10">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-xl font-bold text-white mb-2">WELCOME TO YOUR DASHBOARD</h2>
          <p className="text-gray-500 text-sm">Click <span className="text-purple-400">"SYNC RESULTS"</span> to fetch your JUT data.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10 hover:scale-105 transition">
      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
      <h3 className="text-xs font-semibold text-gray-400 mb-4 tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function InsightCard({ title, value, detail }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10 hover:scale-105 transition">
      <p className="text-gray-500 text-xs">{title}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{detail}</p>
    </div>
  );
}

function TrendIndicator({ subject, value, color }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <p className="text-gray-500 text-xs">{subject}</p>
      <p className={`text-${color} text-sm font-semibold mt-1`}>{value}</p>
    </div>
  );
} 
