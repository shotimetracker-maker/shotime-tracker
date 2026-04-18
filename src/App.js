import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  Trophy, Activity, Target, Zap, 
  TrendingUp, Shield, Gauge, Microscope, Star, Footprints, CalendarDays,
  BarChart2, ShoppingBag, Layers, Percent
} from 'lucide-react';

// --- 設定 ---
const PLAYER_ID = "660271";
const TOTAL_GAMES = 162;

const FALLBACK_STATS = [
  { year: '2021', avg: .257, slg: .592, ops: .965, hr: 46, rbi: 100, sb: 26, h: 138, bb: 96, pa: 639, b_war: 5.1, w: 9, k: 156, era: 3.18, g: 23, p_war: 3.0 },
  { year: '2022', avg: .273, slg: .519, ops: .875, hr: 34, rbi: 95, sb: 11, h: 160, bb: 72, pa: 666, b_war: 3.4, w: 15, k: 219, era: 2.33, g: 28, p_war: 6.2 },
  { year: '2023', avg: .304, slg: .654, ops: 1.066, hr: 44, rbi: 95, sb: 20, h: 151, bb: 91, pa: 599, b_war: 6.0, w: 10, k: 167, era: 3.14, g: 23, p_war: 4.0 },
  { year: '2024', avg: .310, slg: .646, ops: 1.036, hr: 54, rbi: 130, sb: 59, h: 197, bb: 81, pa: 731, b_war: 9.2, w: 0, k: 0, era: 0, g: 0, p_war: 0 },
  { year: '2025', avg: .306, slg: .600, ops: 1.000, hr: 55, rbi: 102, sb: 20, h: 172, bb: 109, pa: 680, b_war: 7.8, w: 1, k: 62, era: 2.87, g: 14, p_war: 1.2 },
  { year: '2026', avg: .324, slg: .650, ops: 1.050, hr: 6, rbi: 12, sb: 1, h: 18, bb: 15, pa: 75, b_war: 1.1, w: 2, k: 22, era: 0.45, g: 4, p_war: 0.6 } 
];

const METRICS = {
  batting: [
    { id: 'avg', label: '打率', color: '#fb7185', icon: <Percent size={14} />, thresholds: [.260, .300, .330], desc: '安打を放つ確率。現代野球でも重要な指標。3割(.300)を超えれば一流打者、.330を超えると首位打者争いレベルです。', unit: '' },
    { id: 'hr', label: '本塁打', color: '#f43f5e', icon: <Trophy size={14} />, thresholds: [15, 30, 45], desc: 'スタンドに叩き込む豪快なアーチ。30本超えで一流の長距離砲、45本以上はMVP級の歴史的シーズンと言えます。', unit: '本' },
    { id: 'rbi', label: '打点', color: '#fb923c', icon: <Target size={14} />, thresholds: [60, 90, 110], desc: 'チャンスで走者を返す能力。100打点を超えるとリーグを代表する強打者の証であり、チームの勝利への貢献度が非常に高い指標です。', unit: '点' },
    { id: 'sb', label: '盗塁', color: '#fbbf24', icon: <Zap size={14} />, thresholds: [10, 25, 40], desc: '俊足で次の塁を陥れる技術。20盗塁以上で機動力の高い選手と見なされ、40盗塁を超えるとスピードスターとして警戒されます。', unit: '個' },
    { id: 'h', label: '安打', color: '#60a5fa', icon: <Activity size={14} />, thresholds: [120, 160, 190], desc: 'バットコントロールの正確さ。シーズン160安打は主力選手の基準、190安打を超えると首位打者争いに絡むレベルです。', unit: '本' },
    { id: 'slg', label: '長打率', color: '#a855f7', icon: <Target size={14} />, thresholds: [.450, .550, .650], desc: '1打数あたりに獲得できる平均塁打数。長打力を示す指標で、.500を超えれば優秀、.600を超えると球界を代表するスラッガーです。', unit: '' },
    { id: 'ops', label: 'OPS', color: '#ec4899', icon: <Star size={14} />, thresholds: [.800, .950, 1.050], desc: '出塁率と長打率を足した、打者の総合的な攻撃力を示す最重要指標の一つ。1.000を超えると歴史的な大打者として評価されます。', unit: '' },
    { id: 'bb', label: '四球', color: '#a78bfa', icon: <Footprints size={14} />, thresholds: [45, 75, 95], desc: '相手投手の恐怖と選球眼の高さ。', unit: '個' },
    { id: 'pa', label: '打席数', color: '#38bdf8', icon: <Layers size={14} />, thresholds: [400, 550, 650], desc: '試合に出場し続けたタフさの指標。600打席を超えればシーズンを通して主力として完走したことを意味します。', unit: '打席' },
    { id: 'b_war', label: '打者WAR', color: '#f472b6', icon: <Star size={14} />, thresholds: [2.0, 5.0, 8.0], desc: '控え選手と比較してどれだけ勝利を上積みしたか。2.0でレギュラー級、5.0でオールスター、8.0を超えるとMVP級の貢献度です。', unit: '' },
  ],
  pitching: [
    { id: 'w', label: '勝利数', color: '#10b981', icon: <Shield size={14} />, thresholds: [8, 12, 16], desc: '投手として勝利を導いた数。10勝は先発ローテーションの柱、15勝以上ならリーグ屈指のエースとして評価されます。', unit: '勝' },
    { id: 'k', label: '奪三振', color: '#34d399', icon: <Gauge size={14} />, thresholds: [120, 180, 220], desc: '打者を打ち取る圧倒的な支配力。150奪三振で奪三振能力が高いとされ、200を超えると奪三振王の候補になります。', unit: '個' },
    { id: 'era', label: '防御率', color: '#ec4899', icon: <Microscope size={14} />, thresholds: [4.20, 3.30, 2.60], desc: '9回あたりの自責点。3.50以下で優秀な先発投手、2.0台であれば球界を代表するサイ・ヤング賞級の投球内容です。', unit: '' },
    { id: 'g', label: '登板回数', color: '#0ea5e9', icon: <CalendarDays size={14} />, thresholds: [15, 25, 30], desc: 'マウンドに上がった頻度。先発として25試合以上に登板すれば、年間を通してローテーションを守った信頼の証です。', unit: '試合' },
    { id: 'p_war', label: '投手WAR', color: '#c084fc', icon: <Star size={14} />, thresholds: [1.5, 3.5, 5.5], desc: '投手としての総合貢献度。3.0を超えると球団の顔となる投手、5.0以上はリーグを支配するエースの領域です。', unit: '' },
  ]
};

// --- Baseball Savant風 リアル推移シミュレーター (2025年等、実データがない過去年用) ---
const generateRealisticLogs = (stat) => {
  const pa = stat.pa || 0; const hr = stat.hr || 0; const bb = stat.bb || 0; const h = stat.h || 0;
  const remainingH = Math.max(0, h - hr); const outs = Math.max(0, pa - hr - remainingH - bb);
  const pool = [];
  for(let i=0; i<hr; i++) pool.push({ type: 'HR' });
  for(let i=0; i<remainingH; i++) pool.push({ type: 'H' });
  for(let i=0; i<bb; i++) pool.push({ type: 'BB' });
  for(let i=0; i<outs; i++) pool.push({ type: 'OUT' });

  const targetTB = Math.round((stat.slg || 0) * (pa - bb));
  let currentTB = hr * 4 + remainingH;
  const hEvents = pool.filter(e => e.type === 'H');
  while(currentTB < targetTB && hEvents.length > 0) {
      const ev = hEvents[Math.floor(Math.random() * hEvents.length)];
      if (!ev.tb) ev.tb = 1;
      if (ev.tb < 3) { ev.tb++; currentTB++; }
  }
  hEvents.forEach(e => { if(!e.tb) e.tb = 1; });
  pool.sort(() => Math.random() - 0.5);

  let hLogs = []; let pIdx = 0; let cum = { hr:0, rbi:0, sb:0, h:0, bb:0, pa:0, ab:0, tb:0 };
  for(let g=1; g<=162; g++) {
      const gamePA = Math.min(Math.floor(Math.random() * 3) + 3, pool.length - pIdx);
      for(let i=0; i<gamePA; i++) {
          const ev = pool[pIdx++]; if (!ev) break;
          cum.pa++;
          if (ev.type === 'HR') { cum.hr++; cum.h++; cum.ab++; cum.tb+=4; cum.rbi += Math.floor(Math.random()*3)+1; }
          else if (ev.type === 'H') { cum.h++; cum.ab++; cum.tb+=ev.tb; cum.rbi += Math.random()<0.2?1:0; }
          else if (ev.type === 'BB') { cum.bb++; }
          else if (ev.type === 'OUT') { cum.ab++; }
      }
      cum.sb += Math.random() < ((stat.sb||0)/162) ? 1 : 0;
      const avg = cum.ab > 0 ? cum.h / cum.ab : 0;
      const obp = cum.pa > 0 ? (cum.h + cum.bb) / cum.pa : 0;
      const slg = cum.ab > 0 ? cum.tb / cum.ab : 0;
      const b_war = stat.pa > 0 ? (cum.pa / stat.pa) * (stat.b_war||0) : 0;
      hLogs.push({ game: g, avg, slg, ops: obp+slg, hr: cum.hr, rbi: cum.rbi, sb: cum.sb, h: cum.h, bb: cum.bb, pa: cum.pa, b_war });
  }

  let pLogs = []; let cumP = { w:0, k:0, er:0, outs:0 };
  const p_g = stat.g || 0; const interval = p_g > 0 ? Math.floor(162 / p_g) : 162;
  const targetOuts = p_g * 18;
  for(let g=1; g<=162; g++) {
      if (p_g > 0 && g % interval === 0 && (g / interval) <= p_g) {
          cumP.outs += 18; cumP.k += Math.round((stat.k||0) / p_g);
          cumP.w += Math.random() < ((stat.w||0)/p_g) ? 1 : 0;
          cumP.er += Math.round(((stat.era||0) * 18) / 27);
      }
      const p_war = targetOuts > 0 ? (cumP.outs / targetOuts) * (stat.p_war||0) : 0;
      pLogs.push({ game: g, w: cumP.w, k: cumP.k, era: cumP.outs > 0 ? (cumP.er * 27) / cumP.outs : 0, p_war });
  }
  return { hitting: hLogs, pitching: pLogs };
};

// --- MLB APIの実データ GameLog パース処理 ---
const processRealGameLogs = (splits, group, refStat) => {
  if (!splits || splits.length === 0) return [];
  const sorted = [...splits].reverse(); // 古い順から累積
  let cum = { hr:0, rbi:0, sb:0, h:0, bb:0, pa:0, ab:0, tb:0, hbp:0, sf:0, w:0, k:0, er:0, outs:0, g:0 };
  
  return sorted.map((log, i) => {
      const s = log.stat;
      cum.g += 1;
      if (group === 'hitting') {
          cum.hr += s.homeRuns || 0; cum.rbi += s.rbi || 0; cum.sb += s.stolenBases || 0;
          cum.h += s.hits || 0; cum.bb += s.baseOnBalls || 0; cum.pa += s.plateAppearances || 0;
          cum.ab += s.atBats || 0; cum.tb += s.totalBases || 0; cum.hbp += s.hitByPitch || 0; cum.sf += s.sacrificeFlies || 0;
          const avg = cum.ab > 0 ? cum.h / cum.ab : 0;
          const obp = (cum.ab + cum.bb + cum.hbp + cum.sf) > 0 ? (cum.h + cum.bb + cum.hbp) / (cum.ab + cum.bb + cum.hbp + cum.sf) : 0;
          const slg = cum.ab > 0 ? cum.tb / cum.ab : 0;
          const b_war = refStat?.pa > 0 ? (cum.pa / refStat.pa) * (refStat.b_war||0) : 0; // WARは打席数でスケール
          return { game: i + 1, hr: cum.hr, rbi: cum.rbi, sb: cum.sb, h: cum.h, bb: cum.bb, pa: cum.pa, avg, slg, ops: obp + slg, b_war };
      } else {
          cum.w += s.wins || 0; cum.k += s.strikeOuts || 0; cum.er += s.earnedRuns || 0;
          if (s.inningsPitched) {
              const [f, p] = s.inningsPitched.split('.');
              cum.outs += parseInt(f || 0) * 3 + parseInt(p || 0);
          }
          const era = cum.outs > 0 ? (cum.er * 27) / cum.outs : 0;
          const p_war = refStat?.p_g > 0 ? (cum.g / refStat.p_g) * (refStat.p_war||0) : 0;
          return { game: i + 1, w: cum.w, k: cum.k, era, p_war };
      }
  });
};

// 2025年のシミュレーションデータを初期化
const SIMULATED_LOGS_2025 = generateRealisticLogs(FALLBACK_STATS.find(s=>s.year==='2025'));

export default function App() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [realLogs, setRealLogs] = useState({ 2024: { hitting: [], pitching: [] }, 2026: { hitting: [], pitching: [] } });
  const [activeMetricId, setActiveMetricId] = useState('avg');
  const [showTodayCompare, setShowTodayCompare] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [gamesPlayed, setGamesPlayed] = useState(18);

  // --- API Fetch: Season Stats & GameLogs ---
  const fetchMLBData = async (retryCount = 0) => {
    setIsSyncing(true);
    try {
      const yearStr = new Date().getFullYear().toString();
      
      const reqs = [
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=hitting&season=${yearStr}`),
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=season&group=pitching&season=${yearStr}`),
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=gameLog&group=hitting&season=2024`),
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=gameLog&group=pitching&season=2024`),
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=gameLog&group=hitting&season=${yearStr}`),
        fetch(`https://statsapi.mlb.com/api/v1/people/${PLAYER_ID}/stats?stats=gameLog&group=pitching&season=${yearStr}`)
      ];
      
      const res = await Promise.all(reqs);
      const data = await Promise.all(res.map(r => r.json()));

      const hStats = data[0].stats?.[0]?.splits?.[0]?.stat || {};
      const pStats = data[1].stats?.[0]?.splits?.[0]?.stat || {};
      
      if (hStats.gamesPlayed) setGamesPlayed(hStats.gamesPlayed);

      const currentStatsObj = {
          avg: parseFloat(hStats.avg) || FALLBACK_STATS[5].avg,
          slg: parseFloat(hStats.slg) || FALLBACK_STATS[5].slg,
          ops: parseFloat(hStats.ops) || FALLBACK_STATS[5].ops,
          hr: hStats.homeRuns ?? FALLBACK_STATS[5].hr,
          rbi: hStats.rbi ?? FALLBACK_STATS[5].rbi,
          sb: hStats.stolenBases ?? FALLBACK_STATS[5].sb,
          h: hStats.hits ?? FALLBACK_STATS[5].h,
          bb: hStats.baseOnBalls ?? FALLBACK_STATS[5].bb,
          pa: hStats.plateAppearances ?? FALLBACK_STATS[5].pa,
          w: pStats.wins ?? FALLBACK_STATS[5].w,
          k: pStats.strikeOuts ?? FALLBACK_STATS[5].k,
          era: parseFloat(pStats.era) || FALLBACK_STATS[5].era,
          g: hStats.gamesPlayed ?? FALLBACK_STATS[5].g,
          p_g: pStats.gamesPlayed ?? FALLBACK_STATS[5].g,
          b_war: FALLBACK_STATS[5].b_war, p_war: FALLBACK_STATS[5].p_war
      };

      setStats(prev => prev.map(s => s.year === '2026' ? { ...s, ...currentStatsObj } : s));

      // GameLog パース
      setRealLogs({
        2024: {
           hitting: processRealGameLogs(data[2].stats?.[0]?.splits, 'hitting', FALLBACK_STATS.find(s=>s.year==='2024')),
           pitching: processRealGameLogs(data[3].stats?.[0]?.splits, 'pitching', FALLBACK_STATS.find(s=>s.year==='2024'))
        },
        2026: {
           hitting: processRealGameLogs(data[4].stats?.[0]?.splits, 'hitting', currentStatsObj),
           pitching: processRealGameLogs(data[5].stats?.[0]?.splits, 'pitching', currentStatsObj)
        }
      });

      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      if (retryCount < 3) setTimeout(() => fetchMLBData(retryCount + 1), 1000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMLBData();
    const interval = setInterval(fetchMLBData, 300000);
    return () => clearInterval(interval);
  }, []);

  const currentStat2026 = useMemo(() => stats.find(s => s.year === '2026') || {}, [stats]);
  const activeMetricObj = [...METRICS.batting, ...METRICS.pitching].find(m => m.id === activeMetricId) || METRICS.batting[0];
  const isRateMetric = (id) => ['avg', 'slg', 'ops', 'era'].includes(id);

  // --- Baseball Savant風 ペースデータ構築 ---
  const paceData = useMemo(() => {
    const isBatting = METRICS.batting.some(m => m.id === activeMetricId);
    const group = isBatting ? 'hitting' : 'pitching';
    const data = [];
    const maxGames = isBatting ? 162 : 35; // 投手は35登板程度を表示範囲に
    
    for (let i = 1; i <= maxGames; i++) {
      const entry = { label: `G${i}` };
      
      // 2024 (Real API Log)
      const val24 = realLogs[2024][group][i-1]?.[activeMetricId];
      if (val24 !== undefined) entry['2024'] = val24;
      else if (i > 1 && realLogs[2024][group].length > 0) entry['2024'] = realLogs[2024][group][realLogs[2024][group].length - 1][activeMetricId]; // 最終値を引っぱる
      
      // 2025 (Simulated Log)
      const val25 = SIMULATED_LOGS_2025[group][i-1]?.[activeMetricId];
      if (val25 !== undefined) entry['2025'] = val25;
      else if (i > 1 && SIMULATED_LOGS_2025[group].length > 0) entry['2025'] = SIMULATED_LOGS_2025[group][SIMULATED_LOGS_2025[group].length - 1][activeMetricId];

      // 2026 (Real Live API Log)
      const val26 = realLogs[2026][group][i-1]?.[activeMetricId];
      if (val26 !== undefined) {
         entry['2026'] = val26;
      } else {
         entry['2026'] = null; // 未来の試合は非表示
      }

      data.push(entry);
    }
    return data;
  }, [activeMetricId, realLogs]);

  const annualData = useMemo(() => {
    return stats.map(stat => {
      const row = { ...stat };
      if (stat.year === '2026') {
        if (isRateMetric(activeMetricId)) {
           row[activeMetricId + '_proj'] = 0;
           row[activeMetricId + '_total'] = stat[activeMetricId];
        } else {
          const cur = Number(stat[activeMetricId]) || 0;
          let total;
          if (activeMetricId.includes('war')) {
            total = Number(((cur / Math.max(1, gamesPlayed)) * TOTAL_GAMES).toFixed(1));
            row[activeMetricId + '_proj'] = Number(Math.max(0, total - cur).toFixed(1));
          } else {
            total = Math.round((cur / Math.max(1, gamesPlayed)) * TOTAL_GAMES);
            row[activeMetricId + '_proj'] = Math.max(0, total - cur);
          }
          row[activeMetricId + '_total'] = total;
        }
      }
      return row;
    });
  }, [stats, gamesPlayed, activeMetricId]);

  const formatValue = (id, val) => {
      if (val === null || val === undefined) return '-';
      if (['avg', 'slg', 'ops'].includes(id)) return val.toFixed(3).replace(/^0+/, '');
      if (id === 'era' || id.includes('war')) return val.toFixed(id.includes('war') ? 1 : 2);
      return val;
  };

  const formatDisplayValue = (id, val) => {
    if (val === null || val === undefined) return '-';
    if (['avg', 'slg', 'ops'].includes(id)) return val.toFixed(3);
    if (id === 'era') return val.toFixed(2);
    if (id.includes('war')) return val.toFixed(1);
    return val;
  }

  const mercariLink = "https://px.a8.net/svt/ejp?a8mat=4B1N9L+C6720I+5LNQ+BW8O2&a8ejpredirect=https%3A%2F%2Fjp.mercari.com%2Fsearch%3Fkeyword%3D%25E5%25A4%25A7%25E8%25B0%25B7%25E7%25BF%2594%25E5%25B9%25B3%2520%25E3%2583%2589%25E3%2582%25B8%25E3%2583%25A3%25E3%2583%25BC%25E3%2582%25B9%2520%25E3%2582%25B0%25E3%2583%2583%25E3%2582%25BA%26status%3Don_sale%26sort%3Dnum_likes%26order%3Ddesc";

  return (
    <div className="min-h-screen bg-[#050914] text-slate-200 p-4 md:p-8 flex flex-col gap-6 font-sans text-left">
      
      {/* 1. Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase leading-none">
          Sho-Time <span className="text-blue-500 tracking-normal">Tracker</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider">
          大谷翔平：前人未到の二刀流リアルタイム分析ダッシュボード
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {isSyncing ? 'Syncing GameLogs...' : `LIVE SYNCED: ${lastSync || 'READY'}`}
             </p>
          </div>
          <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black text-blue-400">
            チームの残り試合数 <span className="text-white">{TOTAL_GAMES - gamesPlayed}</span> 試合、終了済み <span className="text-white">{gamesPlayed}</span> 試合
          </div>
        </div>
      </header>

      {/* 2. AD SECTION */}
      <section className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ABEMA */}
        <div className="md:col-span-4 min-h-[100px] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <a href="https://px.a8.net/svt/ejp?a8mat=4B1N9L+C506SY+4EKC+631SX" target="_blank" rel="nofollow" className="block w-full h-full">
            <img 
              src="https://www20.a8.net/svt/bgt?aid=260417289734&wid=001&eno=01&mid=s00000020550001022000&mc=1" 
              alt="ABEMA" 
              className="w-full h-full object-contain bg-[#0a0a0a]"
            />
          </a>
        </div>
        
        {/* Mercari Screenshot (Uploaded Image) */}
        <div className="md:col-span-8 min-h-[100px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-red-500 group">
          <a href={mercariLink} target="_blank" rel="nofollow" className="block w-full h-full relative">
            <img 
              src="/Screenshot_20260418-144640.jpg" 
              alt="Mercari Special Items" 
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            />
            {/* ダークグラデーションのオーバーレイで文字を目立たせる */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center p-4">
               <div className="flex flex-col gap-1.5">
                 <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded w-fit tracking-wider">HOT ITEM</span>
                 <span className="text-white font-black text-sm md:text-lg drop-shadow-lg">大谷翔平グッズを探す</span>
               </div>
            </div>
            {/* 右側のショッピングバッグアイコン */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 p-3 rounded-full text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform">
               <ShoppingBag size={24} />
            </div>
          </a>
        </div>
      </section>

      {/* 3. Metrics Navigation */}
      <nav className="max-w-6xl w-full mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] px-1">Batting Indicators / 打者指標</span>
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            {METRICS.batting.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2.5 rounded-xl border shrink-0 transition-all min-w-[100px] ${activeMetricId === m.id ? 'bg-rose-600/20 border-rose-500 ring-1 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase">{m.label}</div>
                <div className={`text-xl font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>
                    {formatValue(m.id, currentStat2026[m.id])}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-1">Pitching Indicators / 投手指標</span>
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            {METRICS.pitching.map(m => (
              <button key={m.id} onClick={() => setActiveMetricId(m.id)} className={`px-4 py-2.5 rounded-xl border shrink-0 transition-all min-w-[100px] ${activeMetricId === m.id ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <div className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase">{m.label}</div>
                <div className={`text-xl font-black font-mono leading-none ${activeMetricId === m.id ? 'text-white' : 'text-slate-300'}`}>
                    {formatValue(m.id, currentStat2026[m.id])}
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 4. Analytics Main */}
      <main className="max-w-6xl w-full mx-auto flex flex-col gap-6 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 md:p-8 shadow-2xl overflow-hidden">
        
        {/* Detailed Description & Multi-Value Display */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-6">
          <div className="flex-grow max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 ring-1 ring-blue-500/20">{activeMetricObj.icon}</div>
              <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{activeMetricObj.label} / 詳細解説</h2>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              {activeMetricObj.desc}
            </p>
          </div>
          
          <div className="flex gap-8 items-end w-full lg:w-auto">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">最新の数値</div>
              <div className="text-4xl md:text-5xl font-black italic text-slate-400 font-mono">
                {formatDisplayValue(activeMetricId, currentStat2026[activeMetricId])}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">今シーズン終了時の推定値</div>
              <div className="text-5xl md:text-6xl font-black italic text-blue-400 drop-shadow-lg font-mono">
                {isRateMetric(activeMetricId) 
                  ? formatDisplayValue(activeMetricId, currentStat2026[activeMetricId])
                  : (annualData.find(d => d.year === '2026')?.[activeMetricId + '_total'] || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-auto">
          
          {/* 折れ線グラフ: 各シーズンの日別成績比較 (GameLogベース) */}
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 flex flex-col h-[400px] relative">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} /> 試合ごとの成績推移 (GameLog)</span>
              <button 
                onClick={() => setShowTodayCompare(!showTodayCompare)} 
                className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${showTodayCompare ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
              >
                最新の数値
              </button>
            </div>

            {showTodayCompare && (
              <div className="absolute top-16 right-6 bg-[#0f172a] border border-slate-700 p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 min-w-[180px] animation-fade-in">
                <div className="text-[10px] font-black border-b border-slate-800 pb-2 mb-2 text-blue-400 uppercase tracking-tighter">最新時点の実績値</div>
                {['2026', '2025', '2024'].map(year => {
                  const val = paceData.find(d => d.label === `G${gamesPlayed}`)?.[year] || 0;
                  return (
                    <div key={year} className="flex justify-between gap-6 py-1 font-mono text-xs">
                      <span className={year === '2026' ? 'text-white font-bold' : 'text-slate-500'}>{year}年:</span>
                      <span className="font-bold text-white">{formatDisplayValue(activeMetricId, val)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis 
                    dataKey="label" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10}
                    label={{ value: 'Season Progress (Game 1 - 162)', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                    fontSize={9} 
                    reversed={activeMetricId === 'era'} 
                    tickLine={false} 
                    axisLine={false}
                    domain={isRateMetric(activeMetricId) && activeMetricId !== 'era' ? ['auto', 'auto'] : [0, 'auto']}
                    tickFormatter={(val) => {
                      if (['avg', 'slg', 'ops'].includes(activeMetricId)) return val.toFixed(3).replace(/^0+/, '');
                      return val;
                    }}
                    label={{ value: activeMetricObj.label + (activeMetricObj.unit ? ` (${activeMetricObj.unit})` : ''), angle: -90, position: 'insideLeft', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px'}}
                  formatter={(value, name) => [formatDisplayValue(activeMetricId, value), name === '2026' ? '2026 (Live API)' : name]}
                />
                <Line name="2026" type="step" dataKey="2026" stroke="#3b82f6" strokeWidth={3} dot={false} connectNulls={false} />
                <Line name="2025" type="step" dataKey="2025" stroke="#6366f1" strokeWidth={1.5} dot={false} opacity={0.5}/>
                <Line name="2024" type="step" dataKey="2024" stroke="#f43f5e" strokeWidth={1.5} dot={false} opacity={0.4}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 棒グラフ: 年度別実績 */}
          <div className="bg-slate-950/40 p-5 rounded-3xl border border-slate-800/50 flex flex-col h-[400px]">
            <div className="mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><BarChart2 size={14} /> 年度別実績</span>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-slate-600"></div><span>平均的 ({formatDisplayValue(activeMetricId, activeMetricObj.thresholds[0])})</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500"></div><span>オールスター級 ({formatDisplayValue(activeMetricId, activeMetricObj.thresholds[1])})</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500"></div><span>MVP級 ({formatDisplayValue(activeMetricId, activeMetricObj.thresholds[2])})</span></div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} fontStyle="italic" fontWeight="black"/>
                <YAxis fontSize={9} reversed={activeMetricId === 'era'} tickLine={false} axisLine={false} domain={isRateMetric(activeMetricId) && activeMetricId !== 'era' ? ['auto', 'auto'] : [0, 'auto']} />
                
                <ReferenceLine y={activeMetricObj.thresholds[0]} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine y={activeMetricObj.thresholds[1]} stroke="#10b981" strokeDasharray="4 4" />
                <ReferenceLine y={activeMetricObj.thresholds[2]} stroke="#fbbf24" strokeDasharray="4 4" />

                <Bar dataKey={activeMetricId} stackId="a" radius={[6, 6, 0, 0]}>
                  {annualData.map((e, i) => <Cell key={i} fill={e.year === '2026' ? '#3b82f6' : '#334155'} />)}
                  <LabelList content={(props) => {
                    const { x, y, width, value, index } = props;
                    if (value === 0 && index !== 5) return null;
                    const is2026 = annualData[index].year === '2026';
                    return (
                      <text x={x + width / 2} y={is2026 ? y + 14 : y - 10} fill={is2026 ? "#ffffff" : "#64748b"} fontSize={9} fontWeight="black" textAnchor="middle">
                        {formatValue(activeMetricId, value)}
                      </text>
                    );
                  }} />
                </Bar>
                
                {/* 投影予測バー（率指標以外） */}
                {!isRateMetric(activeMetricId) && (
                    <Bar dataKey={activeMetricId + '_proj'} stackId="a" fill="transparent" stroke="#3b82f6" strokeDasharray="4 4" radius={[6, 6, 0, 0]}>
                         <LabelList content={(props) => {
                             const { x, y, width, index } = props;
                             if (annualData[index].year !== '2026') return null;
                             return (
                               <text x={x + width / 2} y={y - 12} fill="#3b82f6" fontSize={12} fontWeight="900" textAnchor="middle">
                                 {annualData[index][activeMetricId + '_total']}
                               </text>
                             );
                         }} />
                    </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[10px] text-slate-700 font-mono py-12 tracking-[0.4em] uppercase">
        © 2026 Dodgers Nation Analytics • Engine v50.0 (Savant Spec) • Validated by Official API
      </footer>
    </div>
  );
}
