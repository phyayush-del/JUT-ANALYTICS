'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area
} from 'recharts';

export default function Home() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showData, setShowData] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    setTimeout(() => {
      const mockData = [
        { id: 10411, score: 555, rank: 70, physics: 130, chemistry: 125, biology: 300 },
        { id: 10422, score: 598, rank: 34, physics: 140, chemistry: 135, biology: 323 },
        { id: 10439, score: 628, rank: 31, physics: 145, chemistry: 141, biology: 342 },
      ];
      setResults(mockData);
      setShowData(true);
      setLoading(false);
    }, 2000);
  };

  // Prepare data for charts
  const chartData = results.map(r => ({
    name: `JUT ${r.id}`,
    score: r.score,
    rank: r.rank,
    physics: r.physics,
    chemistry: r.chemistry,
    biology: r.biology,
  }));

  // Radar data
  const radarData = [
    { subject: 'Physics', value: Math.round(results.reduce((a, b) => a + b.physics, 0) / results.length) || 0 },
    { subject: 'Chemistry', value: Math.round(results.reduce((a, b) => a + b.chemistry, 0) / results.length) || 0 },
    { subject: 'Biology', value: Math.round(results.reduce((a, b) => a + b.biology, 0) / results.length) || 0 },
  ];

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e]">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              JUT Analytics
            </span>
          </h1>
          <p className="text-gray-400 mt-2">NEET Performance System</p>
        </div>
        <button
          onClick={fetchResults}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:scale-105 transition text-white font-semibold disabled:opacity-50"
        >
          {loading ? '🔄 Syncing...' : '📥 Sync Results'}
        </button>
      </header>

      {showData && results.length > 0 && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Current Score" value={results[results.length-1].score} />
            <StatCard label="Best Score" value={Math.max(...results.map(r => r.score))} />
            <StatCard label="Avg Score" value={Math.round(results.reduce((a,b) => a + b.score, 0) / results.length)} />
            <StatCard label="Current Rank" value={`#${results[results.length-1].rank}`} />
            <StatCard label="Best Rank" value={`#${Math.min(...results.map(r => r.rank))}`} />
            <StatCard label="Tests" value={results.length} />
          </div>

          {/* GRAPHS ROW 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Score Chart */}
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">📈 Score Progression</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} />
                  <Area type="monotone" dataKey="score" fill="#6366f1" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Rank Chart */}
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">📉 Rank Progression</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis reversed stroke="#888" />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rank" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPHS ROW 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🔬 Physics</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="physics" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🧪 Chemistry</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="chemistry" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🧬 Biology</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="biology" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRAPHS ROW 3 - Radar + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Subject Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" stroke="#888" />
                  <PolarRadiusAxis stroke="#888" />
                  <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Subject Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                  <Legend />
                  <Bar dataKey="physics" fill="#06b6d4" />
                  <Bar dataKey="chemistry" fill="#22c55e" />
                  <Bar dataKey="biology" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* JUT History Table */}
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">📊 JUT History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-400">JUT</th>
                    <th className="text-left p-3 text-gray-400">Score</th>
                    <th className="text-left p-3 text-gray-400">Rank</th>
                    <th className="text-left p-3 text-gray-400">Physics</th>
                    <th className="text-left p-3 text-gray-400">Chemistry</th>
                    <th className="text-left p-3 text-gray-400">Biology</th>
                    <th className="text-left p-3 text-gray-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-gray-800 hover:bg-white/5">
                      <td className="p-3 text-white">JUT {result.id}</td>
                      <td className="p-3 text-blue-400 font-bold">{result.score}</td>
                      <td className="p-3 text-purple-400">#{result.rank}</td>
                      <td className="p-3 text-cyan-400">{result.physics}</td>
                      <td className="p-3 text-green-400">{result.chemistry}</td>
                      <td className="p-3 text-pink-400">{result.biology}</td>
                      <td className="p-3 text-white font-semibold">{result.physics + result.chemistry + result.biology}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <p className="text-gray-400 text-sm">📈 Best Subject</p>
              <p className="text-2xl font-bold text-white mt-1">Biology</p>
              <p className="text-gray-500 text-sm mt-2">{Math.round(results.reduce((a,b) => a + b.biology, 0) / results.length)}/360 avg</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <p className="text-gray-400 text-sm">🎯 Avg Score</p>
              <p className="text-2xl font-bold text-white mt-1">{Math.round(results.reduce((a,b) => a + b.score, 0) / results.length)}</p>
              <p className="text-gray-500 text-sm mt-2">Across all tests</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
              <p className="text-gray-400 text-sm">⚡ Improvement</p>
              <p className="text-2xl font-bold text-white mt-1">+{results[results.length-1].score - results[0].score}</p>
              <p className="text-gray-500 text-sm mt-2">JUT {results[0].id} → JUT {results[results.length-1].id}</p>
            </div>
          </div>
        </>
      )}

      {!showData && (
        <div className="bg-white/5 rounded-2xl p-16 text-center backdrop-blur-sm border border-white/10">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to JUT Analytics!</h2>
          <p className="text-gray-300">Click <span className="text-purple-400 font-semibold">"Sync Results"</span> to fetch your JUT data.</p>
        </div>
      )}
    </div>
  );
}

// Stat Card
function StatCard({ label, value }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10 hover:scale-105 transition">
      <p className="text-gray-400 text-sm uppercase">{label}</p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}