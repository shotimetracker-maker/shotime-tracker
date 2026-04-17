import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, 
  TrendingUp, Shield, Gauge, Microscope, Star, Footprints, 
  BookOpen, ExternalLink, Search, ShoppingBag, RefreshCw, AlertCircle
} from 'lucide-react';

// --- 設定 ---
const PLAYER_ID = "660271"; // 大谷翔平のMLB公式ID
const TOTAL_GAMES = 162;
const CURRENT_YEAR = new Date().getFullYear();

// API取得失敗時、またはシーズンオフ時のバックアップデータ
const FALLBACK_STATS = [
  { year: '2021', hr: 46, rbi: 100, sb: 26, h: 138, bb: 96, b_war: 5.1, w: 9, k: 156, ip: 130, era: 3.18, g: 23, p_war: 3.0 },
  { year: '2022', hr: 34, rbi: 95, sb: 11, h: 160, bb: 72, b_war: 3.4, w: 15, k: 219, ip: 166, era: 2.33, g: 28, p_war: 6.2 },
  { year: '2023', hr: 44, rbi: 95, sb: 20, h: 151, bb: 91, b_war: 6.0, w: 10, k: 167, ip: 132, era: 3.14, g: 23, p_war: 4.0 },
  { year: '2024', hr: 54, rbi: 130, sb: 59, h: 197, bb: 81, b_war: 9.2, w: 0, k: 0, ip: 0, era: 0, g: 0, p_war: 0 },
  { year: '2025', hr: 55, rbi: 102, sb: 20, h: 172, bb: 109, b_war: 7.8, w: 1, k: 62, ip: 47, era: 2.87, g: 14, p_war: 1.2 },
  { year: '2026', hr: 0, rbi: 0, sb: 0, h: 0, bb: 0, b_war: 0, w: 0, k: 0, ip: 0, era: 0, g: 0, p_war: 0 } 
];

const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, desc: '一振りで試合を決める本塁打数。', thresholds: [15, 30, 45] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, desc: 'ランナーを返した数。チャンスでの貢献度。', thresholds: [55, 85, 110] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, desc: '足でチャンスを広げるスピード。', thresholds: [10, 25, 40] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, desc: 'ヒットによる出塁数。打撃の安定感。', thresholds: [110, 160, 190] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, desc: '選球眼と相手バッテリーへの重圧。', thresholds: [45, 75, 95] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, desc: 'チームを勝利へ導いたマウンドでの功績。', thresholds: [8, 13, 18] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, desc: '圧倒的な支配力を示す三振数。', thresholds: [130, 190, 230] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, desc: '自責点を抑える投手の最重要指標。', thresholds: [4.30, 3.30, 2.50] },
  ]
};

const MERCARI_ITEMS = [
  { id: 1, title: '公式ユニフォーム #17', price: '¥18,500', img: 'https://images.unsplash.com/photo-1516731415730-0c641725a676?w=200' },
  { id: 2, title: 'ドジャース 記念キャップ', price: '¥6,400', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200' },
  { id: 3, title: '大谷 記念カード', price: '¥12,800', img: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=200' },
];

export default function App() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [gamesPlayed, setGamesPlayed] = useState(1);

  // --- MLB API データ取得 (リトライ機能付き) ---
  const fetchMLBData = async (retryCount = 0) => {
    setIsSyncing(true);
    setSyncError(false);
    try {
      const hUrl = `https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=hitting&season=${CURRENT_YEAR}`;
      const pUrl = `https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=pitching&season=${CURRENT_YEAR}`;
      
      const [hRes, pRes] = await Promise.all([fetch(hUrl), fetch(pUrl)]);
      const hData = await hRes.json();
      const pData = await pRes.json();

      const hStats = hData.stats?.[0]?.splits?.[0]?.stat || {};
      const pStats = pData.stats?.[0]?.splits?.[0]?.stat || {};

      const currentGames = hStats.gamesPlayed || 1;
      setGamesPlayed(currentGames);

      // 2026年（現在の年）のデータを更新
      const newStats = stats.map(s => {
        if (s.year === '2026') {
          return {
            ...s,
            hr: hStats.homeRuns || 0,
            rbi: hStats.rbi || 0,
            sb: hStats.stolenBases || 0,
            h: hStats.hits || 0,
            bb: hStats.baseOnBalls || 0,
            w: pStats.wins || 0,
            k: pStats.strikeOuts || 0,
            ip: parseInt(pStats.inninsPitched) || 0,
            era: parseFloat(pStats.era) || 0,
            g: pStats.gamesPitched || 0,
          };
        }
        return s;
      });

      setStats(newStats);
      setLastUpdated(new Date().toLocaleTimeString());
      setIsSyncing(false);
    } catch (err) {
      if (retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchMLBData(retryCount + 1), delay);
      } else {
        setSyncError(true);
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    fetchMLBData();
    const interval = setInterval(fetchMLBData, 300000); // 5分ごとに更新
    return () => clearInterval(interval);
  }, []);

  const currentStat2026 = stats.find(s => s.year === '2026') || {};
  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];

  const paceData = useMemo(() => {
    const data = [];
    const baseDate = new Date(`${CURRENT_YEAR}-03-20`);
    const dayInterval = 186; // シーズン期間の目安日数
    
    for (let i = 0; i <= dayInterval; i += 1) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const entry = { label };

      ['2024', '2025', '2026'].forEach(year => {
        const yearStat = stats.find(s => s.year === year) || {};
        const totalVal = yearStat[activeMetricId] || 0;
        
        if (year === '2026') {
          const progress = i / dayInterval;
          const isFuture = i > (gamesPlayed * 1.1); // ざっくりとした現在地の判定
          entry[year] = isFuture ? null : (activeMetricId === 'era' ? totalVal : Math.floor(totalVal * (i / Math.max(1, gamesPlayed))));
        } else {
          entry[year] = activeMetricId === 'era' ? totalVal : Math.floor(totalVal * (i / dayInterval));
        }
      });
      data.push(entry);
    }
    return data;
  }, [activeMetricId, stats, gamesPlayed]);

  const annualData = useMemo(() => {
    return stats.map(stat => {
      const row = { ...stat };
      if (stat.year === '2026' && activeMetricId !== 'era') {
        const currentVal = stat[activeMetricId] || 0;
        const projected = Math.round((currentVal / Math.max(1, gamesPlayed)) * TOTAL_GAMES);
        row[activeMetricId + '_proj'] = Math.max(0, projected - currentVal);
        row[activeMetricId + '_total'] = projected;
      }
      return row;
    });
  }, [stats, gamesPlayed, activeMetricId]);

  const mercariLink = "https://px.a8.net/svt/ejp?a8mat=4B1N9L+C6720I+5LNQ+BW8O2&a8ejpredirect=https%3A%2F%2Fjp.mercari.com%2Fsearch%3Fkeyword%3D%25E5%25A4%25A7%25E8%25B0%25B7%25E7%25BF%2594%25E5%25B9%25B3%2520%25E3%2583%2589%25E3%2582%25B8%25E3%2583%25A3%25E3%2583%25BC%25E3%2582%25B9%2520%25E3%2582%25B0%25E3%2583%2583%25E3%2582%25BA%26status%3Don_sale%26sort%3Dnum_likes%26order%3Ddesc";

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-5 font-sans overflow-x-hidden text-left">
      
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
            Sho-Time <span className="text-blue-500">Tracker</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : (syncError ? 'bg-red-500' : 'bg-emerald-500')}`}></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isSyncing ? 'Syncing MLB Data...' : (syncError ? 'Sync Error' : `Live MLB Synced: ${lastUpdated || 'Offline'}`)}
             </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono shadow-xl flex gap-4">
          <div className="flex flex-col"><span className="text-slate-500 text-[9px] font-bold uppercase">Played</span><span className="text-white font-black">{gamesPlayed}G</span></div>
          <div className="flex flex-col border-l border-slate-800 pl-4"><span className="text-slate-500 text-[9px] font-bold uppercase">Remain</span><span className="text-blue-400 font-black">{TOTAL_GAMES - gamesPlayed}G</span></div>
        </div>
      </header>

      {/* Mercari & Ads */}
      <section className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 h-full">
           <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C506SY+4EKC+631SX" target="_blank" rel="nofollow" className="block h-full rounded-xl border border-slate-800 overflow-hidden bg-slate-900 transition-all hover:border-blue-500">
              <img src="https://www20.a8.net/svt/bgt?aid=260417289734&wid=001&eno=01&mid=s00000020550001022000&mc=1" alt="ABEMA" className="w-full h-full object-cover" />
           </a>
        </div>
        <div className="md:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-3">
            <div className="flex-grow grid grid-cols-3 gap-2">
              {MERCARI_ITEMS.map(item => (
                <a key={item.id} href={mercariLink} target="_blank" rel="nofollow" className="group bg-black rounded-lg overflow-hidden border border-slate-800 hover:border-red-500 transition-all">
                  <img src={item.img} alt={item.title} className="w-full h-16 object-cover opacity-80 group-hover:opacity-100" />
                  <div className="p-1.5"><div className="text-[10px] text-white font-black">{item.price}</div></div>
                </a>
              ))}
            </div>
            <a href={mercariLink} target="_blank" rel="nofollow" className="md:w-32 bg-red-600 text-white rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-red-500 transition-colors shadow-lg active:scale-95">
               <ShoppingBag size={18} />
               <span className="text-[10px] font-black uppercase tracking-tighter">Mercari Shop</span>
            </a>
        </div>
      </section>

      {/* Tabs */}
      <nav className="max-w-6xl w-full mx-auto flex overflow-x-auto gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...METRICS.batting, ...METRICS.pitching].map(m => (
          <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
            <div className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase">{m.label}</div>
            <div className="text-lg font-black font-mono text-white leading-none">{currentStat2026[m.id]}</div>
          </button>
        ))}
      </nav>

      {/* Analytics */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
        <div className="lg:col-span-2 flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400">{activeMetricObj.icon}</div>
             <h2 className="text-xl font-black text-white">{activeMetricObj.label} 分析</h2>
          </div>
          <div className="text-4xl font-black italic text-blue-400">
            {activeMetricId === 'era' ? currentStat2026.era : Math.round((currentStat2026[activeMetricId] / gamesPlayed) * TOTAL_GAMES)}
            <span className="text-[10px] not-italic text-slate-500 ml-2 uppercase border-l border-slate-700 pl-2">Expected</span>
          </div>
        </div>

        <div className="h-[280px] bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest"><TrendingUp size={12} className="inline mr-1" /> シーズン推移</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" fontSize={8} interval={30} axisLine={false} tickLine={false} />
              <YAxis fontSize={8} reversed={activeMetricId === 'era'} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px'}} />
              <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
              <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1} dot={false} opacity={0.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[280px] bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
          <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest"><BarChart2 size={12} className="inline mr-1" /> 年度比較</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" fontSize={9} axisLine={false} tickLine={false} />
              <YAxis fontSize={8} axisLine={false} tickLine={false} />
              <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
              <Bar dataKey={activeMetricId} radius={[4, 4, 0, 0]}>
                {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
              </Bar>
              {activeMetricId !== 'era' && <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>

      <footer className="text-center text-[9px] text-slate-700 font-mono py-10 uppercase tracking-widest">
        © 2026 Sho-Time Analytics • Official MLB Data Engine Enabled
      </footer>
    </div>
  );
}
