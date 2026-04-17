import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, 
  TrendingUp, Clock, Shield, Gauge, Microscope, Star, Footprints, CalendarDays,
  Medal, BarChart2, BookOpen, ExternalLink, Search, ShoppingBag, RefreshCw, AlertCircle
} from 'lucide-react';

// --- 設定定数 ---
const PLAYER_ID = "660271"; // 大谷翔平
const TOTAL_GAMES = 162;
const SEASON_START_DATE = new Date('2026-03-20');
const TODAY = new Date(); // 現在: 2026-04-17

const FALLBACK_STATS = [
  { year: '2021', hr: 46, rbi: 100, sb: 26, h: 138, bb: 96, b_war: 5.1, w: 9, k: 156, ip: 130, era: 3.18, g: 23, p_war: 3.0 },
  { year: '2022', hr: 34, rbi: 95, sb: 11, h: 160, bb: 72, b_war: 3.4, w: 15, k: 219, ip: 166, era: 2.33, g: 28, p_war: 6.2 },
  { year: '2023', hr: 44, rbi: 95, sb: 20, h: 151, bb: 91, b_war: 6.0, w: 10, k: 167, ip: 132, era: 3.14, g: 23, p_war: 4.0 },
  { year: '2024', hr: 54, rbi: 130, sb: 59, h: 197, bb: 81, b_war: 9.2, w: 0, k: 0, ip: 0, era: 0, g: 0, p_war: 0 },
  { year: '2025', hr: 55, rbi: 102, sb: 20, h: 172, bb: 109, b_war: 7.8, w: 1, k: 62, ip: 47, era: 2.87, g: 14, p_war: 1.2 },
  { year: '2026', hr: 6, rbi: 12, sb: 1, h: 18, bb: 15, b_war: 1.1, w: 2, k: 22, ip: 20, era: 0.45, g: 4, p_war: 0.6 } 
];

const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, desc: 'スタンドに叩き込む数。一振りで試合を決める力。', ranks: { team: 1, league: 4, mlb: 8 }, thresholds: [15, 30, 45] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, desc: 'ランナーをホームに返した数。チャンスでの貢献度。', ranks: { team: 2, league: 6, mlb: 10 }, thresholds: [55, 85, 110] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, desc: 'スピードで進塁する数。相手への大きなプレッシャー。', thresholds: [10, 25, 40] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, desc: '技術で出塁した数。攻撃のリズムを作ります。', thresholds: [110, 160, 190] },
    { id: 'bb', label: '四球', color: '#a78bfa', icon: <Footprints size={14} />, desc: '選球眼。相手に恐怖を与える証。', thresholds: [45, 75, 95] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, desc: 'エースの能力。マウンドを守り抜いた証。', thresholds: [8, 13, 18] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, desc: '支配力の象徴。三振でピンチを凌ぐ力。', thresholds: [130, 190, 230] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, desc: '低いほど点を取られない最強投手。', thresholds: [4.30, 3.30, 2.50] },
  ]
};

const MERCARI_ITEMS = [
  { id: 1, title: '公式ユニフォーム #17', price: '¥18,500', img: 'https://images.unsplash.com/photo-1516731415730-0c641725a676?w=200' },
  { id: 2, title: '記念キャップ', price: '¥6,400', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200' },
  { id: 3, title: 'MVPカード', price: '¥12,800', img: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=200' },
];

export default function App() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [showTodayCompare, setShowTodayCompare] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [gamesPlayed, setGamesPlayed] = useState(4); // デフォルト

  // --- MLB API 取得ロジック ---
  const fetchMLBData = async (retryCount = 0) => {
    setIsSyncing(true);
    try {
      const year = new Date().getFullYear();
      const hUrl = `https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=hitting&season=${year}`;
      const pUrl = `https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=pitching&season=${year}`;
      
      const [hRes, pRes] = await Promise.all([fetch(hUrl), fetch(pUrl)]);
      const hData = await hRes.json();
      const pData = await pRes.json();

      const hStats = hData.stats?.[0]?.splits?.[0]?.stat || {};
      const pStats = pData.stats?.[0]?.splits?.[0]?.stat || {};

      const currentGP = hStats.gamesPlayed || 4;
      setGamesPlayed(currentGP);

      const newStats = stats.map(s => {
        if (s.year === '2026') {
          return {
            ...s,
            hr: hStats.homeRuns ?? s.hr,
            rbi: hStats.rbi ?? s.rbi,
            sb: hStats.stolenBases ?? s.sb,
            h: hStats.hits ?? s.h,
            bb: hStats.baseOnBalls ?? s.bb,
            w: pStats.wins ?? s.w,
            k: pStats.strikeOuts ?? s.k,
            ip: parseInt(pStats.inningsPitched) || s.ip,
            era: parseFloat(pStats.era) || s.era,
          };
        }
        return s;
      });

      setStats(newStats);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err) {
      if (retryCount < 3) {
        setTimeout(() => fetchMLBData(retryCount + 1), 2000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMLBData();
    const timer = setInterval(fetchMLBData, 300000);
    return () => clearInterval(timer);
  }, []);

  const currentStat2026 = useMemo(() => stats.find(s => s.year === '2026') || {}, [stats]);
  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];

  // 日付データ (4/17時点の数値を算出するためのダミーロジック)
  const todayData = useMemo(() => {
    const results = {};
    const dayProgress = 28 / 186; // 3/20~4/17は約28日間
    stats.forEach(s => {
      if (activeMetricId === 'era') results[s.year] = s[activeMetricId];
      else results[s.year] = Math.round((s[activeMetricId] || 0) * (s.year === '2026' ? 1 : dayProgress));
    });
    return results;
  }, [stats, activeMetricId]);

  const paceData = useMemo(() => {
    const data = [];
    const startDate = new Date('2026-03-20');
    const finalValues = {};
    stats.forEach(s => { finalValues[s.year] = Number(s[activeMetricId]) || 0; });

    for (let i = 0; i <= 186; i += 3) { 
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = (currentDate.getMonth() + 1) + '/' + currentDate.getDate();
      const entry = { day: i, label: dateStr };
      ['2024', '2025', '2026'].forEach(year => {
        const finalVal = finalValues[year] || 0;
        if (year === '2026') {
          const isFuture = currentDate > TODAY;
          if (isFuture) entry[year] = null;
          else {
            const progress = i / 28; // 現在を28日目と仮定
            entry[year] = activeMetricId === 'era' ? finalVal : Math.floor(finalVal * progress);
          }
        } else {
          const progress = i / 186;
          entry[year] = activeMetricId === 'era' ? finalVal : Math.floor(finalVal * progress);
        }
      });
      data.push(entry);
    }
    return data;
  }, [activeMetricId, stats]);

  const annualData = useMemo(() => {
    return stats.map(stat => {
      const row = { ...stat };
      if (stat.year === '2026' && activeMetricId !== 'era') {
        const current = Number(stat[activeMetricId]) || 0;
        const total = Math.round((current / Math.max(1, gamesPlayed)) * TOTAL_GAMES);
        row[activeMetricId + '_proj'] = Math.max(0, total - current);
        row[activeMetricId + '_total'] = total;
      }
      return row;
    });
  }, [stats, gamesPlayed, activeMetricId]);

  const mercariLink = "https://px.a8.net/svt/ejp?a8mat=4B1N9L+C6720I+5LNQ+BW8O2&a8ejpredirect=https%3A%2F%2Fjp.mercari.com%2Fsearch%3Fkeyword%3D%25E5%25A4%25A7%25E8%25B0%25B7%25E7%25BF%2594%25E5%25B9%25B3%2520%25E3%2583%2589%25E3%2582%25B8%25E3%2583%25A3%25E3%2583%25BC%25E3%2582%25B9%2520%25E3%2582%25B0%25E3%2583%2583%25E3%2582%25BA%26status%3Don_sale%26sort%3Dnum_likes%26order%3Ddesc";

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-5 font-sans overflow-x-hidden text-left">
      
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3 z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter uppercase leading-none">
            Sho-Time <span className="text-blue-500 tracking-normal">Tracker</span>
            <span className="text-[10px] text-slate-500 not-italic ml-2 font-normal border border-slate-700 px-1.5 py-0.5 rounded">v42</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isSyncing ? 'MLB Syncing...' : `LIVE SYNCED: ${lastSync || 'Initializing...'}`}
             </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono w-full md:w-auto shadow-xl flex justify-around md:justify-start gap-4">
          <div className="flex flex-col"><span className="text-slate-500 text-[9px] uppercase font-bold">Played</span><span className="text-white font-black">{gamesPlayed}G</span></div>
          <div className="flex flex-col border-l border-slate-800 pl-4"><span className="text-slate-500 text-[9px] uppercase font-bold">Remain</span><span className="text-blue-400 font-black">{TOTAL_GAMES - gamesPlayed}G</span></div>
        </div>
      </header>

      {/* AD & Mercari */}
      <section className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase px-1 flex items-center gap-1"><RefreshCw size={10} /> Live TV</span>
          <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C506SY+4EKC+631SX" target="_blank" rel="nofollow" className="block overflow-hidden rounded-xl border border-slate-800 hover:border-blue-500 transition-all bg-slate-900 h-full min-h-[100px]">
            <img src="https://www20.a8.net/svt/bgt?aid=260417289734&wid=001&eno=01&mid=s00000020550001022000&mc=1" alt="ABEMA" className="w-full h-full object-cover" />
          </a>
        </div>
        <div className="md:col-span-8 flex flex-col gap-1.5">
          <span className="text-[9px] font-black text-red-500 tracking-widest uppercase px-1 flex items-center gap-1"><ShoppingBag size={10} /> Mercari Market</span>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col md:flex-row gap-3">
            <div className="flex-grow grid grid-cols-3 gap-2">
              {MERCARI_ITEMS.map(item => (
                <a key={item.id} href={mercariLink} target="_blank" rel="nofollow" className="group relative overflow-hidden rounded-lg bg-black border border-slate-800 transition-all hover:border-red-500 shadow-lg">
                  <img src={item.img} alt={item.title} className="w-full h-14 md:h-16 object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="p-1.5">
                    <div className="text-[7px] text-slate-400 font-bold truncate mb-0.5 uppercase">{item.title}</div>
                    <div className="text-[10px] text-white font-black font-mono">{item.price}</div>
                  </div>
                </a>
              ))}
            </div>
            <a href={mercariLink} target="_blank" rel="nofollow" className="md:w-32 bg-red-600 hover:bg-red-500 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all active:scale-95">
               <Search size={16} />
               <span className="text-[9px] font-black uppercase">商品検索</span>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Navigation */}
      <nav className="max-w-6xl w-full mx-auto flex overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...METRICS.batting, ...METRICS.pitching].map(m => (
          <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
            <div className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase">{m.label}</div>
            <div className={`text-lg font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>{currentStat2026[m.id] ?? 0}</div>
          </button>
        ))}
      </nav>

      {/* Analysis Grid */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl">
        <div className="lg:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 ring-1 ring-blue-500/20">{activeMetricObj.icon}</div>
            <div>
              <h2 className="text-xl font-black text-white leading-none uppercase">{activeMetricObj.label} 分析</h2>
              <p className="text-[10px] text-slate-500 mt-1">{activeMetricObj.desc}</p>
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-black italic text-blue-400 drop-shadow-lg flex items-baseline leading-none">
            {activeMetricId === 'era' ? currentStat2026.era : (annualData.find(d => d.year === '2026')?.[activeMetricId + '_total'] || 0)}
            <span className="text-[10px] not-italic text-slate-500 ml-2 uppercase font-black tracking-widest border-l border-slate-700 h-4 flex items-center pl-2">Expected</span>
          </div>
        </div>

        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex flex-col h-[300px] relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} /> Seasonal Pace</span>
              <button onClick={() => setShowTodayCompare(!showTodayCompare)} className={`text-[8px] font-bold px-2 py-1 rounded border transition-all ${showTodayCompare ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>4/17時点を比較</button>
            </div>
            
            {showTodayCompare && (
              <div className="absolute top-12 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-2xl z-50 text-[10px] space-y-1 border-l-4 border-l-blue-500">
                <div className="font-bold border-b border-slate-700 pb-1 mb-1 uppercase tracking-tighter">4/17時点の{activeMetricObj.label}</div>
                {['2026', '2025', '2024', '2023'].map(year => (
                  <div key={year} className="flex justify-between gap-4 font-mono">
                    <span className={year === '2026' ? 'text-blue-300' : 'text-slate-500'}>{year}:</span>
                    <span className="font-bold">{todayData[year] ?? '-'}</span>
                  </div>
                ))}
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="label" fontSize={8} interval={20} tickLine={false} axisLine={false} tickMargin={10}/>
                <YAxis fontSize={8} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} width={30}/>
                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px'}}/>
                <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
                <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1} dot={false} opacity={0.6}/>
                <Line type="monotone" dataKey="2025" stroke="#6366f1" strokeWidth={1} dot={false} opacity={0.5}/>
              </LineChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex flex-col h-[300px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><BarChart2 size={12} /> Yearly Comparison</span>
            </div>
            <div className="flex gap-3 mb-3 text-[7px] font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
              <div className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500"></span><span>AS級</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-500"></span><span>MVP級</span></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="year" fontSize={9} tickLine={false} axisLine={false} tickMargin={10}/>
                <YAxis fontSize={8} tickLine={false} axisLine={false} width={30}/>
                <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="3 3" opacity={0.4} />
                <ReferenceLine y={activeMetricObj.thresholds[2]} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.4} />
                <Bar dataKey={activeMetricId} stackId="a" radius={[4, 4, 0, 0]}>
                  {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                  <LabelList content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (value === 0 && index !== 5) return null;
                    const is2026 = annualData[index].year === '2026';
                    return <text x={x + width / 2} y={is2026 ? y + 10 : y - 6} fill={is2026 ? "#fff" : "#64748b"} fontSize={8} fontWeight="bold" textAnchor="middle">{value}</text>;
                  }} />
                </Bar>
                {activeMetricId !== 'era' && (
                    <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]}>
                         <LabelList content={(props) => {
                             const { x, y, width, index } = props;
                             if (annualData[index].year !== '2026') return null;
                             return <text x={x + width / 2} y={y - 6} fill="#3b82f6" fontSize={10} fontWeight="black" textAnchor="middle">{annualData[index][activeMetricId + '_total']}</text>;
                         }} />
                    </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[9px] text-slate-700 font-mono py-10 tracking-[0.3em] uppercase">
        © 2026 Dodgers Nation Analytics • Hybrid Data Sync Enabled
      </footer>
    </div>
  );
              }
