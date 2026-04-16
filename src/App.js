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

// --- メトリクス設定 (打撃・投球 分割) ---
const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, 
      desc: '【パワーと決定力の象徴】打球をスタンドに叩き込む数。これが多ければ多いほど、一振りで試合を決める「圧倒的なパワー」を持っている証拠になります。', ranks: { team: 1, league: 6, mlb: 12 }, mlbAvg: 15, thresholds: [15, 30, 40] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, 
      desc: '【勝利を呼び込む勝負強さ】自分のバットでランナーをホームに返し、チームに得点を入れた数。チャンスの場面でどれだけ仕事ができるかを表します。', ranks: { team: 2, league: 8, mlb: 15 }, mlbAvg: 55, thresholds: [55, 85, 100] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, 
      desc: '【相手をかき回すスピード】ピッチャーの隙を突いて次の塁を奪う数。単に足が速いだけでなく、相手の心理を読む賢さも必要。最強の武器です。', ranks: { team: 2, league: 12, mlb: 25 }, mlbAvg: 8, thresholds: [8, 20, 35] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, 
      desc: '【攻撃の起点を作る技術】ヒットを打って出塁した数。ホームランにならなくても、塁に出ることでピッチャーにプレッシャーを与え、攻撃のリズムを作ります。', ranks: { team: 3, league: 15, mlb: 30 }, mlbAvg: 100, thresholds: [100, 150, 180] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, 
      desc: '【選球眼と相手からの恐怖】ボールを見極めて歩いた数。「打たれるくらいなら歩かせよう」と相手に恐れられている証でもあります。', ranks: { team: 1, league: 4, mlb: 8 }, mlbAvg: 40, thresholds: [40, 70, 90] },
    { id: 'b_war', label: '野手WAR', color: '#f472b6', icon: <Star size={14} />, 
      desc: '【究極のチーム貢献度】メジャーで最も重視される指標。「この選手がいるおかげで、控え選手と比べてチームの勝ち星が何勝増えるか」を表します。', ranks: { team: 1, league: 2, mlb: 3 }, mlbAvg: 2.0, thresholds: [2.0, 4.5, 7.0] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, 
      desc: '【エースの証明】自分が投げている間にチームがリードし、そのまま勝った試合の数。試合を作る能力がなければこの数字は伸びません。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 8, thresholds: [8, 12, 16] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, 
      desc: '【圧倒的な支配力】バッターにバットを振らせない、あるいは空振りさせてアウトを取った数。自力でピンチを切り抜ける最も確実なアウトの取り方です。', ranks: { team: 1, league: 4, mlb: 7 }, mlbAvg: 120, thresholds: [120, 180, 220] },
    { id: 'ip', label: '投球回', color: '#8b5cf6', icon: <Clock size={14} />, 
      desc: '【タフネスさと信頼】マウンドに立ってアウトを取った回数。長いイニングを投げられるピッチャーは、味方のリリーフを休ませる「大黒柱」と言えます。', ranks: { team: 2, league: 15, mlb: 30 }, mlbAvg: 140, thresholds: [140, 180, 200] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, 
      desc: '【ピッチャーの真の実力】「1試合(9回)投げた時、平均で何点取られるか」という目安。低いほど「点を取られない最強の投手」です。', ranks: { team: 1, league: 1, mlb: 1 }, mlbAvg: 4.30, thresholds: [4.30, 3.20, 2.50] },
    { id: 'g', label: '登板試合', color: '#2dd4bf', icon: <CalendarDays size={14} />, 
      desc: '【ケガをしない強靭さ】マウンドに上がった試合の数。どんなにすごい球を投げても、ケガで休んでは意味がありません。体の強さを表します。', ranks: { team: 1, league: 10, mlb: 20 }, mlbAvg: 25, thresholds: [25, 30, 33] },
    { id: 'p_war', label: '投手WAR', color: '#fb7185', icon: <Star size={14} />, 
      desc: '【究極のチーム貢献度(投手版)】「この投手がいるおかげで、控え投手と比べてチームの勝ち星が何勝増えるか」。投手としての真の価値を表す数字です。', ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 2.0, thresholds: [2.0, 4.0, 6.0] },
  ]
};

const generatePaceData = (metric, stats) => {
  const data = [];
  const totalDays = 186; 
  const startDate = new Date('2026-03-20');
  const daysSinceStart = Math.floor((TODAY_DATE - startDate) / (1000 * 60 * 60 * 24)); 
  
  const finalValues = {};
  stats.forEach(s => { finalValues[s.year] = Number(s[metric]) || 0; });

  for (let i = 0; i <= totalDays; i += 1) { 
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    const isPastToday = currentDate > TODAY_DATE;

    const entry = { day: i, label: dateStr };
    ['2023', '2024', '2025', '2026'].forEach(year => {
      const finalVal = finalValues[year] || 0;
      
      if (year === '2026') {
        if (isPastToday) entry[year] = null;
        else {
          if (metric === 'era') {
             const progress = Math.min(1, i / Math.max(1, daysSinceStart));
             const volatility = (1 - progress) * 2; 
             const simulatedEra = finalVal + (Math.sin(i * 2) * volatility);
             entry[year] = i === 0 ? null : Number(simulatedEra.toFixed(2));
          } else {
             const progress = Math.min(1, Math.pow(i / Math.max(1, daysSinceStart), 1.05));
             entry[year] = metric.includes('war') ? Number((finalVal * progress).toFixed(1)) : Math.floor(finalVal * progress);
          }
        }
      } else {
        if (metric === 'era') {
           const volatility = Math.max(0, 1 - (i / totalDays)); 
           const simulatedEra = finalVal + (Math.sin(i) * volatility);
           entry[year] = i === 0 ? null : Number(simulatedEra.toFixed(2));
        } else {
           const progress = Math.pow(i / totalDays, 1.05); 
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
    const is2026 = stat.year === '2026';
    const row = { year: stat.year };
    ['hr', 'rbi', 'sb', 'h', 'bb', 'b_war', 'w', 'k', 'ip', 'era', 'g', 'p_war'].forEach(m => {
      const val = Number(stat[m]) || 0;
      row[m] = val;
      if (is2026) {
        if (m === 'era') {
          row[`${m}_proj`] = 0;
          row[`${m}_total`] = val;
        } else {
          const totalProj = m.includes('war') 
            ? Number(((val / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES).toFixed(1))
            : Math.round((val / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES);
          row[`${m}_proj`] = Math.max(0, Number((totalProj - val).toFixed(1))); 
          row[`${m}_total`] = totalProj;          
        }
      } else {
        row[`${m}_proj`] = 0;
        row[`${m}_total`] = val;
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
    <span className="text-[10px] text-slate-400">{label}</span>
  </div>
);

export default function App() {
  const [activeCategory, setActiveCategory] = useState('batting');
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [stats, setStats] = useState(INITIAL_STATS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTodayCompare, setShowTodayCompare] = useState(false);

  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];
  
  useEffect(() => {
    if (METRICS.batting.find(m => m.id === activeMetricId)) setActiveCategory('batting');
    else if (METRICS.pitching.find(m => m.id === activeMetricId)) setActiveCategory('pitching');
  }, [activeMetricId]);

  const paceData = useMemo(() => generatePaceData(activeMetricId, stats), [activeMetricId, stats]);
  const annualData = useMemo(() => generateAnnualData(stats), [stats]);
  const currentStat = stats.find(s => s.year === '2026') || {};
  const todayData = useMemo(() => paceData.find(d => d.label === '4/17') || paceData[0], [paceData]);

  const syncStats = async () => {
    setIsSyncing(true);
    const apiKey = ""; 
    try {
      const query = `Provide Shohei Ohtani 2026 regular season stats strictly as JSON format: {"hr":X, "rbi":X, "sb":X, "h":X, "bb":X, "b_war":X, "w":X, "k":X, "ip":X, "era":X, "g":X, "p_war":X} as of April 17, 2026.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: query }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const data = await response.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      if(result && result.hr !== undefined){
         const cleanResult = {};
         Object.keys(result).forEach(k => cleanResult[k] = Number(result[k]));
         setStats(prev => prev.map(s => s.year === '2026' ? { ...s, ...cleanResult } : s));
      }
    } catch (e) { console.error("データ同期エラー", e); } finally { setIsSyncing(false); }
  };

  const getProjectedValue = (metricId) => {
    if (metricId === 'era') return currentStat.era;
    const val = (currentStat[metricId] / Math.max(1, ESTIMATED_GAMES_PLAYED)) * TOTAL_GAMES;
    return metricId.includes('war') ? Number(val.toFixed(1)) : Math.round(val);
  };

  const renderActualLabel = (props) => {
    const { x, y, width, value, index, mId } = props;
    const dataRow = annualData[index];
    if (value > 0) {
      const is2026Stacked = dataRow.year === '2026' && mId !== 'era';
      const yPos = is2026Stacked ? y + 12 : y - 5;
      const fillCol = dataRow.year === '2026' ? '#ffffff' : '#94a3b8';
      return <text x={x + width / 2} y={yPos} fill={fillCol} fontSize={9} fontWeight="bold" textAnchor="middle">{value}</text>;
    }
    return null;
  };

  const renderProjectedLabel = (metricId, props) => {
    const { x, y, width, value, index } = props;
    const dataRow = annualData[index];
    if (dataRow && dataRow.year === '2026' && value > 0) {
      return <text x={x + width / 2} y={y - 5} fill="#60a5fa" fontSize={10} fontWeight="bold" textAnchor="middle">{dataRow[`${metricId}_total`]}</text>;
    }
    return null;
  };

  const maxDataVal = Math.max(...annualData.map(d => d[`${activeMetricId}_total`] || 0));
  const maxThreshold = activeMetricObj.thresholds ? Math.max(...activeMetricObj.thresholds) : 0;
  const calculatedMax = Math.ceil(Math.max(maxDataVal, maxThreshold) * 1.15);

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 font-sans p-3 md:p-6 flex flex-col gap-5">
      
      {/* 1. Header & Title Section */}
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-3 z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter flex items-center gap-2 text-white">
              SHO-TIME <span className="text-blue-500">TRACKER</span> 
              <span className="text-[10px] text-slate-500 not-italic ml-2 font-normal uppercase tracking-widest border border-slate-700 px-1.5 py-0.5 rounded self-center md:self-auto mt-1 md:mt-0">V25</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide">
              大谷翔平の今シーズンの成績推移と最終着地予想を可視化するデータ分析ダッシュボード
            </p>
          </div>
          
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 shadow-sm gap-5 w-full md:w-auto">
            <div className="flex flex-col md:flex-row gap-2 md:gap-5 text-xs font-mono px-2 w-full">
              <div className="flex justify-between md:justify-start gap-2">
                <span className="text-slate-500">チーム消化試合数:</span> 
                <span className="text-white font-bold">{ESTIMATED_GAMES_PLAYED} 試合</span>
              </div>
              <div className="flex justify-between md:justify-start gap-2">
                <span className="text-blue-500">レギュラーシーズン残り:</span> 
                <span className="text-blue-400 font-bold">{REMAINING_GAMES} 試合</span>
              </div>
            </div>
            <button onClick={syncStats} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors shrink-0" disabled={isSyncing} title="最新データを取得">
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 上下レイアウト (上: 2段タブ, 下: メインコンテンツ) */}
      <main className="max-w-6xl w-full mx-auto flex flex-col gap-4 flex-grow z-0">
        
        {/* --- 上部: 2段タブ (打撃段 / 投球段) スクロールバー付き --- */}
        <div className="flex flex-col gap-3">
          
          {/* 打撃 (Batting) タブ列 */}
          <div className="flex overflow-x-auto gap-2 pb-2.5 w-full items-stretch [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex flex-col items-center justify-center bg-red-950/40 border border-red-900/30 text-red-400 font-black px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest shrink-0 [writing-mode:vertical-rl]">
              Batting
            </div>
            {METRICS.batting.map(m => {
              const isActive = activeMetricId === m.id;
              const currentVal = currentStat[m.id] !== undefined ? currentStat[m.id] : '-';
              return (
                <button 
                  key={m.id}
                  onClick={() => setActiveMetricId(m.id)}
                  className={`flex-shrink-0 flex items-center p-2.5 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600/15 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' 
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60'
                  }`}
                  style={{ minWidth: '90px' }}
                >
                  <div className="flex flex-col items-center w-full gap-1">
                    <div className={`text-[10px] font-bold whitespace-nowrap flex items-center gap-1 ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                      {m.icon} {m.label}
                    </div>
                    <div className={`text-lg font-black font-mono ${isActive ? 'text-white' : 'text-slate-300'}`}>{currentVal}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 投球 (Pitching) タブ列 */}
          <div className="flex overflow-x-auto gap-2 pb-2.5 w-full items-stretch [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-600 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="flex flex-col items-center justify-center bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 font-black px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest shrink-0 [writing-mode:vertical-rl]">
              Pitching
            </div>
            {METRICS.pitching.map(m => {
              const isActive = activeMetricId === m.id;
              const currentVal = currentStat[m.id] !== undefined ? currentStat[m.id] : '-';
              return (
                <button 
                  key={m.id}
                  onClick={() => setActiveMetricId(m.id)}
                  className={`flex-shrink-0 flex items-center p-2.5 rounded-xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600/15 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' 
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60'
                  }`}
                  style={{ minWidth: '90px' }}
                >
                  <div className="flex flex-col items-center w-full gap-1">
                    <div className={`text-[10px] font-bold whitespace-nowrap flex items-center gap-1 ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                      {m.icon} {m.label}
                    </div>
                    <div className={`text-lg font-black font-mono ${isActive ? 'text-white' : 'text-slate-300'}`}>{currentVal}</div>
                  </div>
                </button>
              );
            })}
          </div>
          
        </div>

        {/* --- 下部: メインコンテンツ (選択された指標の詳細) --- */}
        <div className="flex-grow flex flex-col gap-4 bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 md:p-5 shadow-inner mt-2">
          
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800/60 pb-3">
             <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">{activeMetricObj.icon}</div>
             <h2 className="text-lg md:text-xl font-black tracking-tight text-white">{activeMetricObj.label} <span className="text-slate-400 font-normal ml-1">詳細分析</span></h2>
             <span className={`ml-auto text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${activeCategory === 'batting' ? 'bg-red-900/30 text-red-300 border border-red-800/50' : 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/50'}`}>
                {activeCategory === 'batting' ? 'Batting' : 'Pitching'}
             </span>
          </div>

          {/* 上段: 解説 & 着地予想 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col gap-3">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 shadow-inner flex-grow">
                <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold mb-2">
                  <BookOpen size={14} /> この数字ってどう凄い？
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activeMetricObj.desc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="flex flex-col justify-center py-1">
                  <div className="text-[9px] text-slate-500 mb-1 tracking-wider uppercase">Team</div>
                  <div className={`text-xs flex items-center justify-center gap-1 ${getRankStyle(activeMetricObj.ranks.team)}`}>
                    {activeMetricObj.ranks.team === 1 && <Medal size={12} className="text-yellow-500" />} {activeMetricObj.ranks.team}位
                  </div>
                </div>
                <div className="flex flex-col justify-center py-1 border-l border-slate-800">
                  <div className="text-[9px] text-slate-500 mb-1 tracking-wider uppercase">League</div>
                  <div className={`text-xs flex 
