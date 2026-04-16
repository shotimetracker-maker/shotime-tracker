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

// --- メトリクス設定 (順位・閾値・解説を含む) ---
const METRICS = {
  batting: [
    { id: 'hr', label: '本塁打', color: '#f87171', icon: <Trophy size={14} />, 
      desc: '【パワーと決定力の象徴】打球をスタンドに叩き込む数。これが多ければ多いほど、一振りで試合を決める「圧倒的なパワー」を持っている証拠になります。', 
      ranks: { team: 1, league: 6, mlb: 12 }, mlbAvg: 15, thresholds: [15, 30, 45] },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, 
      desc: '【勝利を呼び込む勝負強さ】自分のバットでランナーをホームに返し、チームに得点を入れた数。チャンスの場面での「頼りがい」を表します。', 
      ranks: { team: 2, league: 8, mlb: 15 }, mlbAvg: 55, thresholds: [55, 85, 110] },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, 
      desc: '【相手をかき回すスピード】ピッチャーの隙を突いて次の塁を奪う数。単に足が速いだけでなく、相手の心理を読む賢さも必要です。', 
      ranks: { team: 2, league: 12, mlb: 25 }, mlbAvg: 8, thresholds: [10, 25, 40] },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, 
      desc: '【攻撃の起点を作る技術】ヒットを打って出塁した数。出塁することでピッチャーにプレッシャーを与え、攻撃のリズムを作ります。', 
      ranks: { team: 3, league: 15, mlb: 30 }, mlbAvg: 100, thresholds: [110, 160, 190] },
    { id: 'bb', label: '四死球', color: '#a78bfa', icon: <Footprints size={14} />, 
      desc: '【選球眼と相手からの恐怖】ボールを見極めて歩いた数。「打たれるくらいなら歩かせよう」と相手に恐れられている証でもあります。', 
      ranks: { team: 1, league: 4, mlb: 8 }, mlbAvg: 40, thresholds: [45, 75, 95] },
    { id: 'b_war', label: '野手WAR', color: '#f472b6', icon: <Star size={14} />, 
      desc: '【究極のチーム貢献度】「この選手がいるおかげで、控え選手と比べて何勝増えるか」を表します。8を超えると歴史的な大活躍です。', 
      ranks: { team: 1, league: 2, mlb: 3 }, mlbAvg: 2.0, thresholds: [2.0, 5.0, 8.0] },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#3b82f6', icon: <Shield size={14} />, 
      desc: '【エースの証明】自分が投げている間にチームがリードし、勝った試合の数。試合を作る能力がなければこの数字は伸びません。', 
      ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 8, thresholds: [8, 13, 18] },
    { id: 'k', label: '奪三振', color: '#10b981', icon: <Gauge size={14} />, 
      desc: '【圧倒的な支配力】バッターを空振りさせてアウトを取った数。ピンチを自力で切り抜ける「最も確実なアウトの取り方」です。', 
      ranks: { team: 1, league: 4, mlb: 7 }, mlbAvg: 120, thresholds: [130, 190, 230] },
    { id: 'ip', label: '投球回', color: '#8b5cf6', icon: <Clock size={14} />, 
      desc: '【タフネスさと信頼】マウンドに立ってアウトを取った回数。長いイニングを投げられるのは「大黒柱」としての信頼の証です。', 
      ranks: { team: 2, league: 15, mlb: 30 }, mlbAvg: 140, thresholds: [150, 185, 205] },
    { id: 'era', label: '防御率', color: '#f43f5e', icon: <Microscope size={14} />, 
      desc: '【ピッチャーの真の実力】「1試合(9回)投げた時、平均で何点取られるか」。低いほど「点を取られない最強の投手」です。', 
      ranks: { team: 1, league: 1, mlb: 1 }, mlbAvg: 4.30, thresholds: [4.30, 3.30, 2.50] },
    { id: 'g', label: '登板試合', color: '#2dd4bf', icon: <CalendarDays size={14} />, 
      desc: '【ケガをしない強靭さ】マウンドに上がった試合の数。一年間ローテーションを守り抜く「体の強さ」を表します。', 
      ranks: { team: 1, league: 10, mlb: 20 }, mlbAvg: 25, thresholds: [25, 30, 33] },
    { id: 'p_war', label: '投手WAR', color: '#fb7185', icon: <Star size={14} />, 
      desc: '【投手版の貢献度】「この投手がいるおかげで何勝増えるか」。防御率や投球回を総合して計算される真の価値です。', 
      ranks: { team: 1, league: 3, mlb: 5 }, mlbAvg: 2.0, thresholds: [2.0, 4.5, 6.5] },
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
    <span className="text-[10px] text-slate-400">{label}</span>
  </div>
);

export default function App() {
  const [activeMetricId, setActiveMetricId] = useState('hr');
  const [stats, setStats] = useState(INITIAL_STATS);
  const [showTodayCompare, setShowTodayCompare] = useState(false);

  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];
  const activeCategory = METRICS.batting.find(m => m.id === activeMetricId) ? 'batting' : 'pitching';
  
  const paceData = useMemo(() => generatePaceData(activeMetricId, stats), [activeMetricId, stats]);
  const annualData = useMemo(() => generateAnnualData(stats), [stats]);
  const currentStat = stats.find(s => s.year === '2026') || {};
  const todayData = paceData.find(d => d.label === '4/17') || paceData[0];

  const getProjectedValue = (mId) => {
    if (mId === 'era') return currentStat.era;
    const val = (currentStat[mId] / ESTIMATED_GAMES_PLAYED) * TOTAL_GAMES;
    return mId.includes('war') ? Number(val.toFixed(1)) : Math.round(val);
  };

  const calculatedMax = Math.ceil(Math.max(activeMetricObj.mlbAvg * 2, activeMetricObj.thresholds[2]) * 1.2);

  // ラベル表示用関数
  const renderLabel = (props) => {
    const { x, y, width, value, index } = props;
    if (value === 0) return null;
    const year = annualData[index].year;
    const is2026 = year === '2026';
    const total = annualData[index][activeMetricId + '_total'];
    return (
      <text x={x + width / 2} y={y - 8} fill={is2026 ? "#60a5fa" : "#94a3b8"} fontSize={10} fontWeight="bold" textAnchor="middle">
        {is2026 ? total : value}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-3 md:p-6 flex flex-col gap-6">
      
      {/* 1. Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">
            SHO-TIME <span className="text-blue-500">TRACKER</span>
            <span className="text-[10px] text-slate-500 not-italic ml-2 font-normal uppercase tracking-widest border border-slate-700 px-1.5 py-0.5 rounded">V27</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium tracking-wide">
            大谷翔平のシーズン成績を分析・可視化するデータダッシュボード
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono w-full md:w-auto shadow-xl">
          <div className="flex flex-col md:flex-row gap-2 md:gap-5">
            <span>チーム消化試合: <span className="text-white font-bold">{ESTIMATED_GAMES_PLAYED} 試合</span></span>
            <span>レギュラー残り: <span className="text-blue-400 font-bold">{REMAINING_GAMES} 試合</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto flex flex-col gap-5">
        
        {/* 2. Indicators Tabs (上下2段) */}
        <div className="flex flex-col gap-2.5">
          <div className="flex overflow-x-auto gap-2 pb-2 items-center [scrollbar-width:none] [&::-webkit-scrollbar]:h-1">
            <div className="px-3 py-1 bg-red-950/50 text-red-300 text-[10px] font-bold rounded-lg shrink-0 border border-red-900/50">BAT</div>
            {METRICS.batting.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">{m.label}</div>
                <div className={`text-xl font-black font-mono ${activeMetricId === m.id ? 'text-white' : 'text-slate-200'}`}>{currentStat[m.id]}</div>
              </button>
            ))}
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 items-center [scrollbar-width:none] [&::-webkit-scrollbar]:h-1">
            <div className="px-3 py-1 bg-emerald-950/50 text-emerald-300 text-[10px] font-bold rounded-lg shrink-0 border border-emerald-900/50">PITCH</div>
            {METRICS.pitching.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2 rounded-xl border shrink-0 transition-all ${activeMetricId === m.id ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">{m.label}</div>
                <div className={`text-xl font-black font-mono ${activeMetricId === m.id ? 'text-white' : 'text-slate-200'}`}>{currentStat[m.id]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main Detailed Content */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 md:p-6 flex flex-col gap-6 shadow-2xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              {activeMetricObj.icon} {activeMetricObj.label} 詳細分析
            </h2>
            <div className="text-4xl font-black italic text-blue-400 drop-shadow-lg">
              {getProjectedValue(activeMetricId)}
              <span className="text-xs not-italic text-slate-500 ml-1.5 uppercase font-bold tracking-wider">今年度の予測</span>
            </div>
          </div>

          {/* 4. Description & Rank Grid (復活) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold mb-2">
                <BookOpen size={14} /> この指標の凄さ
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{activeMetricObj.desc}</p>
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
                <div className={`text-xs flex items-center justify-center gap-1 ${getRankStyle(activeMetricObj.ranks.league)}`}>
                  {activeMetricObj.ranks.league === 1 && <Medal size={12} className="text-yellow-500" />} {activeMetricObj.ranks.league}位
                </div>
              </div>
              <div className="flex flex-col justify-center py-1 border-l border-slate-800">
                <div className="text-[9px] text-slate-500 mb-1 tracking-wider uppercase">MLB全体</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getRankStyle(activeMetricObj.ranks.mlb)}`}>
                  {activeMetricObj.ranks.mlb === 1 && <Medal size={12} className="text-yellow-500" />} {activeMetricObj.ranks.mlb}位
                </div>
              </div>
            </div>
          </div>

          {/* 5. Charts Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 日別トラッカー (全年度復活) */}
            <div className="bg-black/20 p-4 rounded-xl relative h-[300px] border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">日別累計の推移比較</span>
                <div className="flex gap-2.5">
                  <LegendBadge color="#3b82f6" label="2026" />
                  <LegendBadge color="#f43f5e" label="2024" />
                  <LegendBadge color="#6366f1" label="2025" />
                  <LegendBadge color="#94a3b8" label="2023" />
                </div>
              </div>
              <div className="h-[calc(100%-35px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paceData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                    <XAxis dataKey="label" fontSize={9} interval={30} tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis fontSize={9} hide={false} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} width={30}/>
                    <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px'}}/>
                    <Line type="monotone" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls />
                    <Line type="monotone" dataKey="2025" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.6}/>
                    <Line type="monotone" dataKey="2024" stroke="#f43f5e" strokeWidth={1.5} dot={false} opacity={0.7}/>
                    <Line type="monotone" dataKey="2023" stroke="#94a3b8" strokeWidth={1} dot={false} opacity={0.4}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 年度別比較 (ラベル・凡例ライン復活) */}
            <div className="bg-black/20 p-4 rounded-xl h-[300px] border border-slate-800 relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">年度別の実績比較</span>
              </div>
              {/* 凡例ラベル */}
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 mb-2 text-[9px] font-mono bg-slate-950/50 p-1.5 rounded border border-slate-800">
                <div className="flex items-center gap-1"><span className="w-2 h-0.5 bg-slate-500"></span><span className="text-slate-400">平均({activeMetricObj.thresholds[0]})</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500"></span><span className="text-emerald-400/80">AS級({activeMetricObj.thresholds[1]})</span></div>
                <div className="flex items-center gap-1"><span className="w-2 h-0.5 bg-amber-500"></span><span className="text-amber-400/80">MVP級({activeMetricObj.thresholds[2]})</span></div>
              </div>
              <div className="h-[calc(100%-65px)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                    <XAxis dataKey="year" fontSize={9} tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis fontSize={9} domain={[0, calculatedMax]} tickLine={false} axisLine={false} width={30}/>
                    
                    {/* 閾値ライン復活 */}
                    <ReferenceLine y={activeMetricObj.thresholds[0]} stroke="#64748b" strokeDasharray="3 3" opacity={0.6} />
                    <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={activeMetricObj.thresholds[2]} stroke="#fbbf24" strokeDasharray="3 3" opacity={0.5} />

                    <Bar dataKey={activeMetricId} stackId="a" radius={[4, 4, 0, 0]}>
                      {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                      <LabelList content={renderLabel} />
                    </Bar>
                    {activeMetricId !== 'era' && <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="3 3" radius={[4, 4, 0, 0]}/>}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[10px] text-slate-600 font-mono pt-4 border-t border-slate-800/50 mt-4 pb-8">
        DODGERS NATION • 2026 SEASON ANALYTICS • POWERED BY REACT & RECHARTS
      </footer>
    </div>
  );
}
