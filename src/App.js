import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, Info, RefreshCw, TrendingUp, 
  Award, Star, Calendar, ArrowUpRight, History
} from 'lucide-react';

// 初期データ (2018-2026/04/17現在)
const INITIAL_STATS = [
  { year: '2018', hr: 22, sb: 10, rbi: 61, h: 93, ab: 326, bb: 37, w: 4, k: 63, ip: 51.2, era: 3.31 },
  { year: '2019', hr: 18, sb: 12, rbi: 62, h: 110, ab: 384, bb: 33, w: 0, k: 0, ip: 0, era: 0 },
  { year: '2020', hr: 7, sb: 7, rbi: 24, h: 29, ab: 153, bb: 22, w: 0, k: 3, ip: 1.2, era: 37.80 },
  { year: '2021', hr: 46, sb: 26, rbi: 100, h: 138, ab: 537, bb: 96, w: 9, k: 156, ip: 130.1, era: 3.18 },
  { year: '2022', hr: 34, sb: 11, rbi: 95, h: 160, ab: 586, bb: 72, w: 15, k: 219, ip: 166, era: 2.33 },
  { year: '2023', hr: 44, sb: 20, rbi: 95, h: 151, ab: 497, bb: 91, w: 10, k: 167, ip: 132, era: 3.14 },
  { year: '2024', hr: 54, sb: 59, rbi: 130, h: 197, ab: 636, bb: 81, w: 0, k: 0, ip: 0, era: 0 }, // 打者専念
  { year: '2025', hr: 55, sb: 20, rbi: 102, h: 172, ab: 611, bb: 109, w: 1, k: 62, ip: 47, era: 2.87 },
  { year: '2026', hr: 5, sb: 0, rbi: 10, h: 16, ab: 63, bb: 14, w: 2, k: 18, ip: 18, era: 0.50 } // シーズン序盤
];

const App = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activeTab, setActiveTab] = useState('batting'); // 'batting' or 'pitching'
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('2026-04-17');

  const apiKey = ""; // Gemini APIキー (実行環境から自動提供)

  // Gemini APIを使用して最新データを取得
  const syncLatestStats = async () => {
    setIsSyncing(true);
    const query = `Provide the latest 2026 MLB regular season stats for Shohei Ohtani as of today. 
                   Include: HR, SB, RBI, H, AB, BB, W, K, IP, ERA. 
                   Format as a JSON object strictly like this: 
                   {"hr": 5, "sb": 0, "rbi": 10, "h": 16, "ab": 63, "bb": 14, "w": 2, "k": 18, "ip": 18, "era": 0.50}`;

    try {
      let resultText = "";
      let retries = 5;
      let delay = 1000;

      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: query }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });
          const data = await response.json();
          resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (resultText) break;
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }

      if (resultText) {
        const newEntry = JSON.parse(resultText);
        setStats(prev => prev.map(s => s.year === '2026' ? { ...s, ...newEntry } : s));
        setLastUpdated(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const currentYearData = stats.find(s => s.year === '2026');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold tracking-widest uppercase text-xs">
            <Zap size={14} className="fill-current" />
            Live Analytics Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter">
            SHO-TIME <span className="text-blue-500">2026</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm flex items-center gap-2">
            <Calendar size={14} /> 最終更新: {lastUpdated} (MLB公式サイト/ESPN参照)
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={syncLatestStats}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all ${
              isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'シンクロ中...' : '最新データ取得'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Summary Cards */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="2026 HR" value={currentYearData.hr} icon={<Trophy className="text-orange-400" />} color="border-orange-500/30" />
          <SummaryCard label="2026 RBI" value={currentYearData.rbi} icon={<Target className="text-red-400" />} color="border-red-500/30" />
          <SummaryCard label="2026 Wins" value={currentYearData.w} icon={<Award className="text-blue-400" />} color="border-blue-500/30" />
          <SummaryCard label="2026 SO" value={currentYearData.k} icon={<Activity className="text-emerald-400" />} color="border-emerald-500/30" />
        </div>

        {/* Tab Selection */}
        <div className="lg:col-span-12 flex bg-slate-900/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('batting')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'batting' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Batting (打撃)
          </button>
          <button 
            onClick={() => setActiveTab('pitching')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'pitching' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Pitching (投球)
          </button>
        </div>

        {/* Main Charts */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-400" />
              {activeTab === 'batting' ? '本塁打と打点の年度別推移' : '勝利数と奪三振の年度別推移'}
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  {activeTab === 'batting' ? (
                    <>
                      <Bar name="本塁打 (HR)" dataKey="hr" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar name="打点 (RBI)" dataKey="rbi" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                    </>
                  ) : (
                    <>
                      <Bar name="勝利数 (Wins)" dataKey="w" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar name="奪三振 (SO)" dataKey="k" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-purple-400" />
              {activeTab === 'batting' ? '安打数と盗塁の相関' : '投球回の推移'}
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="colorH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                  {activeTab === 'batting' ? (
                    <>
                      <Area type="monotone" name="安打数 (Hits)" dataKey="h" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorH)" />
                      <Line type="monotone" name="盗塁 (SB)" dataKey="sb" stroke="#fbbf24" strokeWidth={3} dot={{ r: 6 }} />
                    </>
                  ) : (
                    <Area type="monotone" name="投球回 (IP)" dataKey="ip" stroke="#10b981" fillOpacity={1} fill="url(#colorH)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar: Details & Highlights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Star size={20} />
              </div>
              <h4 className="font-bold text-lg">2026 Season Outlook</h4>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              2026年シーズン、大谷選手はドジャースでの3年目を迎えています。前年の手術から完全に復帰した二刀流としてのパフォーマンスが期待されます。序盤から本塁打王争いに食い込むペースで量産しています。
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">打率 (AVG)</span>
                <span className="font-mono text-blue-400">.{(currentYearData.h / currentYearData.ab).toFixed(3).replace(/^0/, '')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">防御率 (ERA)</span>
                <span className="font-mono text-emerald-400">{currentYearData.era.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">四球 (BB)</span>
                <span className="font-mono">{currentYearData.bb}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Career Highlights
            </h4>
            <div className="space-y-4">
              <HighlightItem year="2025" text="2年連続ワールドシリーズ制覇" />
              <HighlightItem year="2024" text="史上初「50-50」達成 (54HR/59SB)" />
              <HighlightItem year="2023" text="WBC優勝・MVP & 2度目の満票MVP" />
              <HighlightItem year="2022" text="ベーブ・ルース以来の「2桁勝利&2桁本塁打」" />
              <HighlightItem year="2021" text="日本人初の本塁打王争い・初のMVP" />
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center">
            <Info size={24} className="mx-auto mb-2 text-slate-500" />
            <p className="text-xs text-slate-500">
              ※本データは学習用のシミュレーションおよび公開スタッツに基づいています。最新の正確な数字はESPN.comやMLB.comを直接ご確認ください。
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 pb-8 border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
        <div>© 2026 SHO-TIME Analytics Dash. All Rights Reserved.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-blue-400 transition-colors">Stats Source</a>
          <a href="#" className="hover:text-blue-400 transition-colors">API Integration</a>
          <a href="#" className="hover:text-blue-400 transition-colors">About</a>
        </div>
      </footer>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, color }) => (
  <div className={`bg-slate-900/60 border ${color} rounded-2xl p-4 transition-transform hover:scale-[1.02] cursor-default`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <div className="text-3xl font-black">{value}</div>
    <div className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
      <ArrowUpRight size={10} />
      Season Record Pace
    </div>
  </div>
);

const HighlightItem = ({ year, text }) => (
  <div className="flex gap-4 items-start group">
    <span className="font-mono text-xs text-blue-500 font-bold py-1 px-2 bg-blue-500/10 rounded">{year}</span>
    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{text}</span>
  </div>
);

export default App;
