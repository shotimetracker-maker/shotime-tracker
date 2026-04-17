import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceArea, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, RefreshCw, 
  TrendingUp, Clock, Shield, Gauge, Microscope, Star, Footprints, CalendarDays,
  Medal, BookOpen, ExternalLink, Search
} from 'lucide-react';

// --- 定数設定 ---
const TOTAL_GAMES = 162;
const TODAY_DATE = new Date('2026-04-17'); 
const ESTIMATED_GAMES_PLAYED = 24; 
const REMAINING_GAMES = TOTAL_GAMES - ESTIMATED_GAMES_PLAYED;

// --- 年度別スタッツ ---
const INITIAL_STATS = [
  { year: '2021', hr: 46, rbi: 100, sb: 26, h: 138, bb: 96, b_war: 5.1, w: 9, k: 156, ip: 130, era: 3.18, g: 23, p_war: 3.0 },
  { year: '2022', hr: 34, rbi: 95, sb: 11, h: 160, bb: 72, b_war: 3.4, w: 15, k: 219, ip: 166, era: 2.33, g: 28, p_war: 6.2 },
  { year: '2023', hr: 44, rbi: 95, sb: 20, h: 151, bb: 91, b_war: 6.0, w: 10, k: 167, ip: 132, era: 3.14, g: 23, p_war: 4.0 },
  { year: '2024', hr: 54, rbi: 130, sb: 59, h: 197, bb: 81, b_war: 9.2, w: 0, k: 0, ip: 0, era: 0, g: 0, p_war: 0 },
  { year: '2025', hr: 55, rbi: 102, sb: 22, h: 175, bb: 105, b_war: 7.8, w: 12, k: 185, ip: 155, era: 2.95, g: 26, p_war: 4.2 },
  { year: '2026', hr: 5, rbi: 14, sb: 3, h: 20, bb: 12, b_war: 1.1, w: 2, k: 25, ip: 20, era: 0.90, g: 4, p_war: 0.8 } 
];

// --- メトリクス設定 ---
const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, desc: 'スタンドに叩き込む数。一振りで試合を決める力。', ranks: { team: 1, league: 6, mlb: 12 }, mlbAvg: 15, thresholds: [15, 30, 45] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, desc: 'ランナーをホームに返した数。チャンスでの貢献度。', ranks: { team: 2, league: 8, mlb: 15 }, mlbAvg: 55, thresholds: [55, 85, 110] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, desc: 'スピードで次の塁を奪う数。相手への大きなプレッシャー。', ranks: { team: 2, league: 12, mlb: 25 }, mlbAvg: 8, thresholds: [10, 25, 40] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, desc: '技術で出塁した数。攻撃のリズムを作ります。', ranks: { team: 3, league: 15, mlb: 30 }, mlbAvg: 100, thresholds: [110, 160, 190] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, desc: '選球眼。打たれるくらいなら歩かせようと思わせる恐怖の証。', ranks: { team: 1, league: 4, mlb: 8 }, mlbAvg: 40, thresholds: [45, 75, 95] },
    { id: 'b_war', label: '野手WAR', color: '#f472b6', icon: <Star size={14} />, desc: '控え選手と比較して何勝分貢献したかの総合指標。', ranks: { team: 1, league: 2, mlb: 3 }, mlbAvg: 2.0, thresholds: [2.0, 5.0, 8.0] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, desc: '自分が投げてチームが勝った数。エースの能力。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 8, thresholds: [8, 13, 18] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, desc: '支配力の象徴。ピンチを自力で凌ぐ最強のアウト奪取。', ranks: { team: 1, league: 4, mlb: 7 }, mlbAvg: 120, thresholds: [130, 190, 230] },
    { id: 'ip', label: '投球回', color: '#8b5cf6', icon: <Clock size={14} />, desc: 'マウンドに立ち続けた回数。長い回を投げる信頼の証。', ranks: { team: 2, league: 15, mlb: 30 }, mlbAvg: 140, thresholds: [150, 185, 205] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, desc: '平均自責点。低いほど「点を取られない最強投手」。', ranks: { team: 1, league: 1, mlb: 1 }, mlbAvg: 4.30, thresholds: [4.30, 3.30, 2.50] },
    { id: 'g', label: '登板試合', color: '#2dd4bf', icon: <CalendarDays size={14} />, desc: 'マウンドに上がった回数。頑丈な体と安定感。', ranks: { team: 1, league: 10, mlb: 20 }, mlbAvg: 25, thresholds: [25, 30, 33] },
    { id: 'p_war', label: '投手WAR', color: '#fb7185', icon: <Star size={14} />, desc: '投手としてどれだけチームに勝ち星を増やしたかの指標。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 2.0, thresholds: [2.0, 4.5, 6.5] },
  ]
};

const generatePaceData = (metric, stats) => {
  const data = [];
  const startDate = new Date('2026-03-20');
  const daysSinceStart = Math.floor((TODAY_DATE - startDate) / (1000 * 60 * 60 * 24)); 
  const finalValues = {};
  stats.forEach(s => { finalValues[s.year] = Number(s[metric]) || 0; });

  for (let i = 0; i <= 186; i += 1) { 
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = (currentDate.getMonth() + 1) + '/' + currentDate.getDate();
    const isPastToday = currentDate > TODAY_DATE;
    const entry = { day: i, label: dateStr };
    ['2023', '2024', '2025', '2026'].forEach(year => {
      const finalVal = finalValues[year] || 0;
      if (year === '2026') {
        if (isPastToday) entry[year] = null;
        else {
          const progress = Math.min(1, i / Math.max(1, daysSinceStart));
          if (metric === 'era') {
            entry[year] = i === 0 ? null : Number((finalVal + (Math.sin(i) * (1-progress))).toFixed(2));
          } else {
            entry[year] = metric.includes('war') ? Number((finalVal * progress).toFixed(1)) : Math.floor(finalVal * progress);
          }
        }
      } else {
        const progress = i / 186;
        if (metric === 'era') {
          entry[year] = Number((finalVal + (Math.sin(i) * (1-progress) * 0.5)).toFixed(2));
        } else {
          entry[year] = metric.includes('war') ? Number((finalVal * progress).toFixed(1)) : Math.floor(finalVal * progress);
        }
      }
    });
    data.push(entry);
  }
  return data;
};

const generateAnnualData = (stats) => {
  return stats.map(stat => {
    const row = { year: stat.year };
    ['hr', 'rbi', 'sb', 'h', 'bb', 'b_war', 'w', 'k', 'ip', 'era', 'g', 'p_war'].forEach(m => {
      const val = Number(stat[m]) || 0;
      row[m] = val;
      if (stat.year === '2026' && m !== 'era') {
        const total = m.includes('war') 
            ? Number(((val / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES).toFixed(1))
            : Math.round((val / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES);
        row[m + '_proj'] = Math.max(0, Number((total - val).toFixed(1)));
        row[m + '_total'] = total;
      } else {
        row[m + '_proj'] = 0;
        row[m + '_total'] = val;
      }
    });
    return row;
  });
};

const getRankStyle = (rank) => {
  if (rank === 1) return 'text-yellow-400 font-black';
  if (rank <= 3) return 'text-slate-100 font-bold';
  return 'text-slate-400';
};

const LegendBadge = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{label}</span>
  </div>
);

export default function App() {
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [stats, setStats] = useState(INITIAL_STATS);
  const [showTodayCompare, setShowTodayCompare] = useState(false);

  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];
  
  const paceData = useMemo(() => generatePaceData(activeMetricId, stats), [activeMetricId, stats]);
  const annualData = useMemo(() => generateAnnualData(stats), [stats]);
  const currentStat = stats.find(s => s.year === '2026') || {};
  const todayData = paceData.find(d => d.label === '4/17') || paceData[0];

  const getProjectedValue = (mId) => {
    if (mId === 'era') return currentStat.era;
    const val = (currentStat[mId] / ESTIMATED_GAMES_PLAYED) * TOTAL_GAMES;
    return mId.includes('war') ? Number(val.toFixed(1)) : Math.round(val);
  };

  const calculatedMax = Math.ceil(Math.max(activeMetricObj.mlbAvg * 2.2, activeMetricObj.thresholds[2]) * 1.15);

  const renderActualLabel = (props) => {
    const { x, y, width, value, index } = props;
    if (value === 0 && index !== 5) return null;
    const year = annualData[index].year;
    const is2026 = year === '2026';
    return (
      <text x={x + width / 2} y={is2026 ? y + 12 : y - 8} fill={is2026 ? "#ffffff" : "#94a3b8"} fontSize={9} fontWeight="bold" textAnchor="middle">
        {value}
      </text>
    );
  };

  const renderProjectedLabel = (props) => {
    const { x, y, width, index } = props;
    const row = annualData[index];
    if (row.year !== '2026' || row[activeMetricId + '_proj'] === 0) return null;
    return (
      <text x={x + width / 2} y={y - 8} fill="#60a5fa" fontSize={10} fontWeight="black" textAnchor="middle">
        {row[activeMetricId + '_total']}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-5">
      
      {/* 1. Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3 z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">
            SHO-TIME <span className="text-blue-500">TRACKER</span>
            <span className="text-[10px] text-slate-500 not-italic ml-2 font-normal uppercase tracking-widest border border-slate-700 px-1.5 py-0.5 rounded text-center">V35</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide text-left">
            大谷翔平の2026シーズン成績を分析・可視化するダッシュボード
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[11px] font-mono w-full md:w-auto shadow-xl">
          <div className="flex justify-between md:justify-start gap-4">
            <span className="text-slate-400">ドジャース消化: <span className="text-white font-bold">{ESTIMATED_GAMES_PLAYED}G</span></span>
            <span className="text-slate-400">残り試合: <span className="text-blue-400 font-bold">{REMAINING_GAMES}G</span></span>
          </div>
        </div>
      </header>

      {/* 2. Tabs */}
      <nav className="max-w-6xl w-full mx-auto flex flex-col gap-2">
        <div className="flex overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-2.5 py-2 bg-red-950/40 text-red-400 text-[9px] font-black rounded-lg shrink-0 border border-red-900/40 flex items-center">BAT</div>
          {METRICS.batting.map(m => (
            <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="text-[9px] text-slate-500 font-bold mb-0.5">{m.label}</div>
              <div className={`text-lg font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>{currentStat[m.id]}</div>
            </button>
          ))}
        </div>
        <div className="flex overflow-x-auto gap-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-2.5 py-2 bg-emerald-950/40 text-emerald-400 text-[9px] font-black rounded-lg shrink-0 border border-emerald-900/40 flex items-center">PIT</div>
          {METRICS.pitching.map(m => (
            <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
              <div className="text-[9px] text-slate-500 font-bold mb-0.5">{m.label}</div>
              <div className={`text-lg font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>{currentStat[m.id]}</div>
            </button>
          ))}
        </div>
      </nav>

      {/* 3. AD SECTION */}
      <section className="max-w-6xl w-full mx-auto flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch text-left">
          <div className="flex flex-col gap-1.5 h-full">
            <div className="flex items-center gap-1.5 px-1">
                <span className="bg-blue-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">LIVE Streaming</span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all h-full min-h-[80px]">
                <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C506SY+4EKC+631SX" rel="nofollow" target="_blank" className="block w-full h-full">
                    <img border="0" width="600" height="100" alt="ABEMA" src="https://www20.a8.net/svt/bgt?aid=260417289734&wid=001&eno=01&mid=s00000020550001022000&mc=1" className="w-full h-auto object-cover" />
                </a>
                <img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B1N9L+C506SY+4EKC+631SX" alt="" className="absolute opacity-0" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 h-full">
            <div className="flex items-center gap-1.5 px-1">
                <span className="bg-red-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Special Search</span>
            </div>
            <div className="relative h-full">
                <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C6720I+5LNQ+BW8O2&a8ejpredirect=https%3A%2F%2Fjp.mercari.com%2Fsearch%3Fkeyword%3D%25E5%25A4%25A7%25E8%25B0%25B7%25E7%25BF%2594%25E5%25B9%25B3%2520%25E3%2583%2589%25E3%2582%25B8%25E3%2583%25A3%25E3%2583%25BC%25E3%2582%25B9%2520%25E3%2582%25B0%25E3%2583%2583%25E3%2582%25BA%26status%3Don_sale%26sort%3Dnum_likes%26order%3Ddesc" 
                   rel="nofollow" 
                   target="_blank" 
                   className="flex items-center justify-between bg-gradient-to-br from-slate-900 to-red-950/20 border border-slate-800 p-3 md:p-4 rounded-xl hover:border-red-500 transition-all group h-full"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="bg-red-600 p-2.5 rounded-lg text-white shadow-lg shadow-red-900/40"><Search size={22} /></div>
                        <div>
                            <div className="text-xs md:text-sm font-black text-white group-hover:text-red-300 transition-colors">大谷翔平グッズを検索</div>
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5 tracking-tighter leading-tight">メルカリでお宝アイテムを即チェック</div>
                        </div>
                    </div>
                    <div className="shrink-0 bg-slate-800 p-1.5 rounded-full group-hover:bg-red-600 transition-colors">
                        <ExternalLink size={14} className="text-slate-400 group-hover:text-white" />
                    </div>
                </a>
                <img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B1N9L+C6720I+5LNQ+BW8O2" alt="" className="absolute opacity-0" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Analytics Main */}
      <main className="max-w-6xl w-full mx-auto flex flex-col gap-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 ring-1 ring-blue-500/20">{activeMetricObj.icon}</div>
            <h2 className="text-xl font-black text-white leading-tight">{activeMetricObj.label} 詳細分析</h2>
          </div>
          <div className="text-4xl md:text-5xl font-black italic text-blue-400 drop-shadow-lg flex items-baseline leading-none">
            {getProjectedValue(activeMetricId)}
            <span className="text-[10px] not-italic text-slate-500 ml-2 uppercase font-black tracking-widest border-l border-slate-700 pl-2 h-4 flex items-center">Expected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 text-left">
            <div className="flex items-center gap-2 text-[10px] text-blue-400 font-black mb-2 uppercase tracking-widest">
              <BookOpen size={12} /> 指標の解説
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{activeMetricObj.desc}</p>
          </div>
          <div className="md:col-span-4 grid grid-cols-3 gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <div className="text-[8px] text-slate-500 font-black uppercase mb-1 whitespace-nowrap">ドジャース内</div>
              <div className={`text-xs font-black ${getRankStyle(activeMetricObj.ranks.team)}`}>{activeMetricObj.ranks.team}位</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border-x border-slate-800/50 text-center">
              <div className="text-[8px] text-slate-500 font-black uppercase mb-1 whitespace-nowrap">ナ・リーグ内</div>
              <div className={`text-xs font-black ${getRankStyle(activeMetricObj.ranks.league)}`}>{activeMetricObj.ranks.league}位</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <div className="text-[8px] text-slate-500 font-black uppercase mb-1 whitespace-nowrap">MLB全体</div>
              <div className={`text-xs font-black ${getRankStyle(activeMetricObj.ranks.mlb)}`}>{activeMetricObj.ranks.mlb}位</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-auto">
          {/* 日別累計トラッカー */}
          <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex flex-col h-[320px] relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={12} /> 累計推移の比較
              </span>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1.5 mr-2">
                    <LegendBadge color="#3b82f6" label="'26" />
                    <LegendBadge color="#f43f5e" label="'24" />
                </div>
                <button 
                  onClick={() => setShowTodayCompare(!showTodayCompare)} 
                  className={`text-[9px] font-bold px-2 py-1 rounded transition-colors border ${showTodayCompare ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                >
                  4/17比較
                </button>
              </div>
            </div>
            
            {showTodayCompare && (
              <div className="absolute top-12 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-2xl z-50 text-[10px] space-y-1 animation-fade-in border-l-4 border-l-blue-500">
                <div className="font-bold border-b border-slate-700 pb-1 mb-1 flex justify-between">
                    <span>{activeMetricObj.label}</span>
                    <span className="text-slate-500 font-mono">4/17</span>
                </div>
                {['2026', '2025', '2024', '2023'].map(year => (
                  <div key={year} className="flex justify-between gap-4">
                    <span className={`font-mono ${year === '2026' ? 'text-blue-300 font-bold' : 'text-slate-500'}`}>{year}年:</span>
                    <span className={`font-mono font-bold ${year === '2026' ? 'text-white text-xs' : 'text-slate-300'}`}>{todayData[year] !== null ? todayData[year] : '-'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                  <XAxis dataKey="label" fontSize={8} interval={30} tickLine={false} axisLine={false} tickMargin={10}/>
                  <YAxis fontSize={8} hide={false} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} width={30}/>
                  <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px'}}/>
                  <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
                  <Line type="monotone" dataKey="2025" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.5}/>
                  <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1.5} dot={false} opacity={0.6}/>
                  <Line type="monotone" dataKey="2023" stroke="#94a3b8" strokeWidth={1} dot={false} opacity={0.4}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 年度別実績・基準 */}
          <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-1 text-left">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart2 size={12} /> 年度別実績・基準
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-[8px] font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-slate-500"></span><span className="text-slate-400 uppercase">平均 ({activeMetricObj.thresholds[0]})</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-emerald-500"></span><span className="text-emerald-500 uppercase">オールスター級 ({activeMetricObj.thresholds[1]})</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-500"></span><span className="text-amber-500 uppercase">MVP級 ({activeMetricObj.thresholds[2]})</span></div>
            </div>
            <div className="flex-grow w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={annualData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                  <XAxis dataKey="year" fontSize={9} tickLine={false} axisLine={false} tickMargin={10} fontStyle="italic" fontWeight="bold"/>
                  <YAxis fontSize={8} domain={[0, calculatedMax]} tickLine={false} axisLine={false} width={30}/>
                  
                  <ReferenceLine y={activeMetricObj.thresholds[0]} stroke="#64748b" strokeDasharray="3 3" opacity={0.6} />
                  <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={activeMetricObj.thresholds[2]} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.5} />

                  <Bar dataKey={activeMetricId} stackId="a" radius={[6, 6, 0, 0]}>
                    {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                    <LabelList content={renderActualLabel} />
                  </Bar>
                  {activeMetricId !== 'era' && (
                    <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" radius={[6, 6, 0, 0]}>
                        <LabelList content={renderProjectedLabel} />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[9px] text-slate-600 font-mono pt-6 pb-8 tracking-widest uppercase">
        © 2026 Dodgers Nation Analytics • Not Official • Create for Fans
      </footer>
    </div>
  );
}
