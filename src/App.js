import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, 
  TrendingUp, Clock, Shield, Gauge, Microscope, Star, Footprints, CalendarDays,
  Medal, BarChart2, BookOpen, ExternalLink, Search, ShoppingBag, Tag, RefreshCw
} from 'lucide-react';

// --- 設定と定数 ---
const TOTAL_GAMES = 162;
// 2026年シーズン開始を3月20日と想定
const SEASON_START_DATE = new Date('2026-03-20');
// 現在時刻（実行環境のシステム時刻）
const CURRENT_DATE = new Date(); 

// --- 初期データ (API取得失敗時のフォールバック) ---
const INITIAL_STATS = [
  { year: '2021', hr: 46, rbi: 100, sb: 26, h: 138, bb: 96, b_war: 5.1, w: 9, k: 156, ip: 130, era: 3.18, g: 23, p_war: 3.0 },
  { year: '2022', hr: 34, rbi: 95, sb: 11, h: 160, bb: 72, b_war: 3.4, w: 15, k: 219, ip: 166, era: 2.33, g: 28, p_war: 6.2 },
  { year: '2023', hr: 44, rbi: 95, sb: 20, h: 151, bb: 91, b_war: 6.0, w: 10, k: 167, ip: 132, era: 3.14, g: 23, p_war: 4.0 },
  { year: '2024', hr: 54, rbi: 130, sb: 59, h: 197, bb: 81, b_war: 9.2, w: 0, k: 0, ip: 0, era: 0, g: 0, p_war: 0 },
  { year: '2025', hr: 55, rbi: 102, sb: 20, h: 172, bb: 109, b_war: 7.8, w: 1, k: 62, ip: 47, era: 2.87, g: 14, p_war: 1.2 },
  { year: '2026', hr: 6, rbi: 12, sb: 1, h: 18, bb: 15, b_war: 1.1, w: 2, k: 22, ip: 20, era: 0.45, g: 4, p_war: 0.6 } 
];

const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, desc: 'スタンドに叩き込む数。一振りで試合を決める力。', ranks: { team: 1, league: 4, mlb: 8 }, mlbAvg: 15, thresholds: [15, 30, 45] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, desc: 'ランナーをホームに返した数。チャンスでの貢献度。', ranks: { team: 2, league: 6, mlb: 10 }, mlbAvg: 55, thresholds: [55, 85, 110] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, desc: 'スピードで進塁する数。相手への大きなプレッシャー。', ranks: { team: 3, league: 15, mlb: 30 }, mlbAvg: 8, thresholds: [10, 25, 40] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, desc: '技術で出塁した数。攻撃のリズムを作ります。', ranks: { team: 3, league: 12, mlb: 25 }, mlbAvg: 100, thresholds: [110, 160, 190] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, desc: '選球眼。打たれるくらいなら歩かせようと思わせる恐怖の証。', ranks: { team: 1, league: 2, mlb: 5 }, mlbAvg: 40, thresholds: [45, 75, 95] },
    { id: 'b_war', label: '野手WAR', color: '#f472b6', icon: <Star size={14} />, desc: '控え選手と比較して何勝分貢献したかの総合指標。', ranks: { team: 1, league: 2, mlb: 2 }, mlbAvg: 2.0, thresholds: [2.0, 5.0, 8.0] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, desc: '自分が投げてチームが勝った数。エースの能力。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 8, thresholds: [8, 13, 18] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, desc: '支配力の象徴。ピンチを自力で凌ぐ最強のアウト奪取。', ranks: { team: 1, league: 2, mlb: 4 }, mlbAvg: 120, thresholds: [130, 190, 230] },
    { id: 'ip', label: '投球回', color: '#8b5cf6', icon: <Clock size={14} />, desc: 'マウンドに立ち続けた回数。長い回を投げる信頼の証。', ranks: { team: 2, league: 18, mlb: 35 }, mlbAvg: 140, thresholds: [150, 185, 205] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, desc: '平均自責点。低いほど「点を取られない最強投手」。', ranks: { team: 1, league: 1, mlb: 1 }, mlbAvg: 4.30, thresholds: [4.30, 3.30, 2.50] },
    { id: 'g', label: '登板数', color: '#2dd4bf', icon: <CalendarDays size={14} />, desc: 'マウンドに上がった回数。頑丈な体と安定感。', ranks: { team: 1, league: 12, mlb: 22 }, mlbAvg: 25, thresholds: [25, 30, 33] },
    { id: 'p_war', label: '投手WAR', color: '#fb7185', icon: <Star size={14} />, desc: '投手としてどれだけチームに勝ち星を増やしたかの指標。', ranks: { team: 1, league: 4, mlb: 6 }, mlbAvg: 2.0, thresholds: [2.0, 4.5, 6.5] },
  ]
};

const MERCARI_ITEMS = [
  { id: 1, title: '大谷翔平 ドジャース公式ユニフォーム #17', price: '¥18,500', img: 'https://images.unsplash.com/photo-1516731415730-0c641725a676?auto=format&fit=crop&q=80&w=200' },
  { id: 2, title: 'NEW ERA 59FIFTY ドジャース 記念キャップ', price: '¥6,400', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=200' },
  { id: 3, title: '【激レア】大谷翔平 2024 MVP記念カード', price: '¥12,800', img: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=200' },
];

export default function App() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [showTodayCompare, setShowTodayCompare] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState(false);

  // --- 擬似自動更新ロジック ---
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      // ここに本来は API call (fetch('https://api.mlb.com/...')) が入ります
      // 今回はデモとして3秒後に最新時刻をセットする擬似挙動
      setTimeout(() => {
        setLastUpdated(new Date().toLocaleTimeString());
        setIsSyncing(false);
      }, 1500);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 1分ごとにチェック
    return () => clearInterval(interval);
  }, []);

  // 今日の消化試合数を計算
  const daysSinceStart = Math.max(1, Math.floor((CURRENT_DATE - SEASON_START_DATE) / (1000 * 60 * 60 * 24)));
  const gamesPlayed = Math.min(TOTAL_GAMES, Math.floor(daysSinceStart * 0.9)); // ほぼ毎日試合があると想定

  const currentStat2026 = useMemo(() => stats.find(s => s.year === '2026') || {}, [stats]);
  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];

  const paceData = useMemo(() => {
    const data = [];
    const startDate = new Date('2026-03-20');
    const finalValues = {};
    stats.forEach(s => { finalValues[s.year] = Number(s[activeMetricId]) || 0; });

    for (let i = 0; i <= 186; i += 1) { 
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = (currentDate.getMonth() + 1) + '/' + currentDate.getDate();
      const isPastToday = currentDate > CURRENT_DATE;
      const entry = { day: i, label: dateStr };
      ['2023', '2024', '2025', '2026'].forEach(year => {
        const finalVal = finalValues[year] || 0;
        if (year === '2026') {
          if (isPastToday) entry[year] = null;
          else {
            const progress = i / Math.max(1, daysSinceStart);
            if (activeMetricId === 'era') {
              entry[year] = i === 0 ? null : Number((finalVal + (Math.sin(i) * (1-progress) * 0.2)).toFixed(2));
            } else {
              entry[year] = activeMetricId.includes('war') ? Number((finalVal * progress).toFixed(1)) : Math.floor(finalVal * progress);
            }
          }
        } else {
          const progress = i / 186;
          if (activeMetricId === 'era') {
            entry[year] = Number((finalVal + (Math.sin(i) * (1-progress) * 0.5)).toFixed(2));
          } else {
            entry[year] = activeMetricId.includes('war') ? Number((finalVal * progress).toFixed(1)) : Math.floor(finalVal * progress);
          }
        }
      });
      data.push(entry);
    }
    return data;
  }, [activeMetricId, stats, daysSinceStart]);

  const annualData = useMemo(() => {
    return stats.map(stat => {
      const row = { year: stat.year };
      ['hr', 'rbi', 'sb', 'h', 'bb', 'b_war', 'w', 'k', 'ip', 'era', 'g', 'p_war'].forEach(m => {
        const val = Number(stat[m]) || 0;
        row[m] = val;
        if (stat.year === '2026' && m !== 'era') {
          const total = m.includes('war') 
              ? Number(((val / Math.max(1, gamesPlayed)) * TOTAL_GAMES).toFixed(1))
              : Math.round((val / Math.max(1, gamesPlayed)) * TOTAL_GAMES);
          row[m + '_proj'] = Math.max(0, Number((total - val).toFixed(1)));
          row[m + '_total'] = total;
        } else {
          row[m + '_proj'] = 0;
          row[m + '_total'] = val;
        }
      });
      return row;
    });
  }, [stats, gamesPlayed]);

  const getRankStyle = (rank) => {
    if (rank === 1) return 'text-yellow-400 font-black';
    if (rank <= 3) return 'text-slate-100 font-bold';
    return 'text-slate-400';
  };

  const mercariLink = "https://px.a8.net/svt/ejp?a8mat=4B1N9L+C6720I+5LNQ+BW8O2&a8ejpredirect=https%3A%2F%2Fjp.mercari.com%2Fsearch%3Fkeyword%3D%25E5%25A4%25A7%25E8%25B0%25B7%25E7%25BF%2594%25E5%25B9%25B3%2520%25E3%2583%2589%25E3%2582%25B8%25E3%2583%25A3%25E3%2583%25BC%25E3%2582%25B9%2520%25E3%2582%25B0%25E3%2583%2583%25E3%2582%25BA%26status%3Don_sale%26sort%3Dnum_likes%26order%3Ddesc";

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-5 font-sans overflow-x-hidden text-left">
      
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3 z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">
            SHO-TIME <span className="text-blue-500">TRACKER</span>
            <span className="text-[10px] text-slate-500 not-italic ml-2 font-normal uppercase tracking-widest border border-slate-700 px-1.5 py-0.5 rounded leading-none">V39</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isSyncing ? 'Syncing Live Data...' : `LIVE SYNCED: ${lastUpdated}`}
             </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono w-full md:w-auto shadow-xl">
          <div className="flex justify-between md:justify-start gap-4">
            <span className="text-slate-400">チーム消化: <span className="text-white font-bold">{gamesPlayed}G</span></span>
            <span className="text-slate-400">残り試合: <span className="text-blue-400 font-bold">{TOTAL_GAMES - gamesPlayed}G</span></span>
          </div>
        </div>
      </header>

      {/* AD SECTION (Marketplace) */}
      <section className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase px-1 flex items-center gap-1">
            <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} /> Live Broadcast
          </span>
          <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C506SY+4EKC+631SX" rel="nofollow" target="_blank" className="block overflow-hidden rounded-xl border border-slate-800 hover:border-blue-500 transition-all bg-slate-900 h-full">
            <img border="0" width="600" height="100" alt="ABEMA" src="https://www20.a8.net/svt/bgt?aid=260417289734&wid=001&eno=01&mid=s00000020550001022000&mc=1" className="w-full h-full object-cover" />
          </a>
        </div>
        <div className="md:col-span-8 flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-red-500 tracking-widest uppercase px-1 flex items-center gap-1">
            <ShoppingBag size={10} /> Mercari Hot Items
          </span>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-3">
            <div className="flex-grow grid grid-cols-3 gap-2">
              {MERCARI_ITEMS.map(item => (
                <a key={item.id} href={mercariLink} target="_blank" rel="nofollow" className="group relative overflow-hidden rounded-lg bg-black border border-slate-800 transition-all hover:border-red-500/50 hover:-translate-y-0.5 shadow-lg">
                  <img src={item.img} alt={item.title} className="w-full h-16 md:h-20 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="p-1.5 bg-gradient-to-t from-black to-transparent">
                    <div className="text-[8px] text-slate-300 font-bold truncate mb-0.5">{item.title}</div>
                    <div className="text-[10px] text-white font-black font-mono">{item.price}</div>
                  </div>
                  <div className="absolute top-1 right-1 bg-red-600 text-white text-[6px] font-black px-1 rounded-sm shadow-xl">HOT</div>
                </a>
              ))}
            </div>
            <div className="md:w-32 flex flex-col justify-center items-center gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
               <a href={mercariLink} target="_blank" rel="nofollow" className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95">
                  <ShoppingBag size={16} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">出品をチェック</span>
               </a>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Navigation */}
      <nav className="max-w-6xl w-full mx-auto flex overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...METRICS.batting, ...METRICS.pitching].map(m => (
          <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
            <div className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase">{m.label}</div>
            <div className={`text-lg font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>{currentStat2026[m.id]}</div>
          </button>
        ))}
      </nav>

      {/* Main Analysis */}
      <main className="max-w-6xl w-full mx-auto flex flex-col gap-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 ring-1 ring-blue-500/20">{activeMetricObj.icon}</div>
            <h2 className="text-xl font-black text-white leading-tight">{activeMetricObj.label} 詳細・予測</h2>
          </div>
          <div className="text-4xl md:text-5xl font-black italic text-blue-400 drop-shadow-lg flex items-baseline leading-none">
            {activeMetricId === 'era' ? currentStat2026.era : Math.round((currentStat2026[activeMetricId] / gamesPlayed) * TOTAL_GAMES)}
            <span className="text-[10px] not-italic text-slate-500 ml-2 uppercase font-black tracking-widest border-l border-slate-700 h-4 flex items-center pl-2">Expected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Trend Chart */}
          <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 h-[300px]">
            <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span><TrendingUp size={12} className="inline mr-1" /> 累積推移 (2026 vs Past)</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="label" fontSize={8} interval={30} tickLine={false} axisLine={false} tickMargin={10}/>
                <YAxis fontSize={8} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} width={30}/>
                <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px'}}/>
                <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
                <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1} dot={false} opacity={0.6}/>
                <Line type="monotone" dataKey="2025" stroke="#6366f1" strokeWidth={1} dot={false} opacity={0.5}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Annual Comparison */}
          <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 h-[300px]">
             <div className="flex justify-between items-center mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span><BarChart2 size={12} className="inline mr-1" /> 年度別実績と到達予測</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="year" fontSize={9} tickLine={false} axisLine={false} tickMargin={10} fontStyle="italic" fontWeight="bold"/>
                <YAxis fontSize={8} tickLine={false} axisLine={false} width={30}/>
                
                <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="3 3" opacity={0.4} />
                <ReferenceLine y={activeMetricObj.thresholds[2]} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.4} />

                <Bar dataKey={activeMetricId} stackId="a" radius={[4, 4, 0, 0]}>
                  {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                </Bar>
                {activeMetricId !== 'era' && <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[9px] text-slate-600 font-mono py-8 tracking-widest uppercase">
        © 2026 Dodgers Nation Analytics • Data Engine v3.9 • Auto-Sync Enabled
      </footer>
    </div>
  );
}
