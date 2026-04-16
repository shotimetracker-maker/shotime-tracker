import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceArea, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, RefreshCw, 
  TrendingUp, Clock, Shield, Gauge, Microscope, Star, Footprints, CalendarDays,
  Medal, BarChart2, BookOpen
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
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, desc: '打球をスタンドに叩き込む数。圧倒的なパワーの証拠。', ranks: { team: 1, league: 6, mlb: 12 }, mlbAvg: 15, thresholds: [15, 30, 40] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, desc: '自分のバットでランナーを返しチームに得点を入れた数。', ranks: { team: 2, league: 8, mlb: 15 }, mlbAvg: 55, thresholds: [55, 85, 100] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, desc: 'ピッチャーの隙を突いて次の塁を奪う数。足の速さと賢さ。', ranks: { team: 2, league: 12, mlb: 25 }, mlbAvg: 8, thresholds: [8, 20, 35] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, desc: 'ヒットを打って出塁した数。攻撃のリズムを作ります。', ranks: { team: 3, league: 15, mlb: 30 }, mlbAvg: 100, thresholds: [100, 150, 180] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, desc: 'ボールを見極めて歩いた数。相手から恐れられている証拠。', ranks: { team: 1, league: 4, mlb: 8 }, mlbAvg: 40, thresholds: [40, 70, 90] },
    { id: 'b_war', label: '野手WAR', color: '#f472b6', icon: <Star size={14} />, desc: '勝利にどれだけ貢献したかを総合的に表す究極の指標。', ranks: { team: 1, league: 2, mlb: 3 }, mlbAvg: 2.0, thresholds: [2.0, 4.5, 7.0] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, desc: '投げている間に味方がリードし勝った試合数。エースの証明。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 8, thresholds: [8, 12, 16] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, desc: 'バッターを空振りなどでアウトにした数。支配力の象徴。', ranks: { team: 1, league: 4, mlb: 7 }, mlbAvg: 120, thresholds: [120, 180, 220] },
    { id: 'ip', label: '投球回', color: '#8b5cf6', icon: <Clock size={14} />, desc: 'マウンドでアウトを取った回数。チームの大黒柱。', ranks: { team: 2, league: 15, mlb: 30 }, mlbAvg: 140, thresholds: [140, 180, 200] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, desc: '9回投げた時の平均失点。低いほど点が取られない最強投手。', ranks: { team: 1, league: 1, mlb: 1 }, mlbAvg: 4.30, thresholds: [4.30, 3.20, 2.50] },
    { id: 'g', label: '登板試合', color: '#2dd4bf', icon: <CalendarDays size={14} />, desc: 'マウンドに上がった試合数。体の強さを表します。', ranks: { team: 1, league: 10, mlb: 20 }, mlbAvg: 25, thresholds: [25, 30, 33] },
    { id: 'p_war', label: '投手WAR', color: '#fb7185', icon: <Star size={14} />, desc: '投手としてどれだけチームの勝ちを増やしたかの指標。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 2.0, thresholds: [2.0, 4.0, 6.0] },
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
          if (metric === 'era') {
             const progress = Math.min(1, i / Math.max(1, daysSinceStart));
             entry[year] = i === 0 ? null : Number((finalVal + (Math.sin(i) * (1-progress))).toFixed(2));
          } else {
             const progress = Math.min(1, i / Math.max(1, daysSinceStart));
             entry[year] = Math.floor(finalVal * progress);
          }
        }
      } else {
        const progress = i / 186;
        entry[year] = metric === 'era' ? finalVal : Math.floor(finalVal * progress);
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
        const total = Math.round((val / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES);
        row[m + '_proj'] = Math.max(0, total - val);
        row[m + '_total'] = total;
      } else {
        row[m + '_proj'] = 0;
        row[m + '_total'] = val;
      }
    });
    return row;
  });
};

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
    return Math.round((currentStat[mId] / ESTIMATED_GAMES_PLAYED) * TOTAL_GAMES);
  };

  const calculatedMax = Math.ceil(Math.max(activeMetricObj.mlbAvg * 2, activeMetricObj.thresholds[2]) * 1.2);

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-6">
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h1 className="text-3xl font-black italic text-white tracking-tighter">SHO-TIME <span className="text-blue-500">TRACKER</span></h1>
          <p className="text-xs text-slate-400">大谷翔平のシーズン成績を分析・可視化</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono w-full md:w-auto shadow-xl">
          <div className="flex justify-between md:justify-start gap-4">
            <span>消化: <span className="text-white font-bold">{ESTIMATED_GAMES_PLAYED} 試合</span></span>
            <span>残り: <span className="text-blue-400 font-bold">{REMAINING_GAMES} 試合</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto flex flex-col gap-5 flex-grow">
        <div className="flex flex-col gap-2.5">
          {/* 打撃指標タブ */}
          <div className="flex overflow-x-auto gap-2 pb-1.5 items-center">
            <div className="px-3 py-1 bg-red-950/50 text-red-300 text-[10px] font-bold rounded-lg shrink-0 uppercase tracking-wider border border-red-900/50">Bat</div>
            {METRICS.batting.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-colors ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">{m.label}</div>
                <div className={`text-xl font-black ${activeMetricId === m.id ? 'text-white' : 'text-slate-200'}`}>{currentStat[m.id]}</div>
              </button>
            ))}
          </div>
          {/* 投球指標タブ */}
          <div className="flex overflow-x-auto gap-2 pb-1.5 items-center">
            <div className="px-3 py-1 bg-emerald-950/50 text-emerald-300 text-[10px] font-bold rounded-lg shrink-0 uppercase tracking-wider border border-emerald-900/50">Pitch</div>
            {METRICS.pitching.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-colors ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">{m.label}</div>
                <div className={`text-xl font-black ${activeMetricId === m.id ? 'text-white' : 'text-slate-200'}`}>{currentStat[m.id]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:p-6 flex flex-col gap-6 shadow-2xl flex-grow">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 gap-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">{activeMetricObj.icon} {activeMetricObj.label} <span className="text-xs font-normal text-slate-500 hidden md:inline">詳細分析</span></h2>
            <div className="text-4xl font-black italic text-blue-400 drop-shadow-lg">{getProjectedValue(activeMetricId)}<span className="text-xs not-italic text-slate-500 ml-1.5 uppercase font-bold tracking-wider">Proj.</span></div>
          </div>

          {/* グラフエリア：ここを高さを固定（h-[300px]）にするのが重要 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow">
            {/* 日別トラッカー */}
            <div className="bg-black/20 p-4 rounded-xl relative h-[280px] md:h-auto border border-slate-800">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Trend</span>
                <button onClick={() => setShowTodayCompare(!showTodayCompare)} className={`text-[10px] px-2.5 py-1 rounded transition-colors ${showTodayCompare ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>4/17比較</button>
              </div>
              {/* ResponsiveContainerの親に高さをしっかり持たせる */}
              <div className="h-[calc(100%-35px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                    <XAxis dataKey="label" fontSize={9} interval={30} tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis fontSize={9} hide={false} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} width={30}/>
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px'}}/>
                    <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 4}}/>
                    <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1} dot={false} opacity={0.6}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {showTodayCompare && (
                <div className="absolute top-12 right-4 bg-slate-950 p-3 rounded-lg border border-slate-700 z-50 text-[10px] shadow-2xl space-y-1 animation-fade-in">
                  <div className="font-bold border-b border-slate-700 pb-1 mb-1">4/17時点</div>
                  <div className="flex justify-between gap-3 text-blue-300"><span>2026年:</span> <span className="font-mono font-bold">{todayData['2026']}</span></div>
                  <div className="flex justify-between gap-3 text-rose-300"><span>2024年:</span> <span className="font-mono font-bold">{todayData['2024']}</span></div>
                </div>
              )}
            </div>

            {/* 年度別比較 */}
            <div className="bg-black/20 p-4 rounded-xl h-[280px] md:h-auto border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">Annual Stats</span>
              <div className="h-[calc(100%-30px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                    <XAxis dataKey="year" fontSize={9} tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis fontSize={9} domain={[0, calculatedMax]} tickLine={false} axisLine={false} width={30}/>
                    <ReferenceLine y={activeMetricObj.mlbAvg} stroke="#64748b" strokeDasharray="3 3" label={{value: 'MLB Avg', position: 'insideTopLeft', fill: '#64748b', fontSize: 8}}/>
                    <Bar dataKey={activeMetricId} stackId="a" radius={[4, 4, 0, 0]}>
                      {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                    </Bar>
                    {activeMetricId !== 'era' && <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]}/>}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[10px] text-slate-600 font-mono pt-4 border-t border-slate-800/50 mt-4">
        DODGERS NATION • 2026 SEASON ANALYTICS • POWERED BY REACT
      </footer>
    </div>
  );
}
