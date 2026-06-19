import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  TrendingDown, 
  Calendar, 
  User, 
  Award, 
  Flame, 
  Zap, 
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

export default function Dashboard({ user, carbonHistory, onLogNewData, onDeleteData }) {
  const [prediction, setPrediction] = useState(null);
  const [isLoadingPred, setIsLoadingPred] = useState(false);
  const [dailyTaskCompleted, setDailyTaskCompleted] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrediction();
    }
  }, [user, carbonHistory]);

  const fetchPrediction = async () => {
    setIsLoadingPred(true);
    try {
      const response = await fetch(`/api/carbon/predict/${user.userId || 'demo_user'}`);
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error("Failed to load carbon predictions", err);
    } finally {
      setIsLoadingPred(false);
    }
  };

  const logs = carbonHistory?.logs || [];
  const summary = carbonHistory?.summary || { average_daily_co2: 0, average_carbon_score: 0, total_logs_count: 0 };

  // Format history data for AreaChart (last 7 logs)
  const trendData = [...logs]
    .reverse()
    .slice(-7)
    .map(log => ({
      date: log.date.substring(5), // MM-DD
      Emissions: log.total_emissions,
      Score: log.carbon_score
    }));

  // Format category breakdown for BarChart
  const latestLog = logs[0];
  const breakdownData = latestLog ? [
    { name: 'Transport', CO2: latestLog.category_breakdown.transportation, fill: '#10b981' },
    { name: 'Energy', CO2: latestLog.category_breakdown.energy, fill: '#06b6d4' },
    { name: 'Food', CO2: latestLog.category_breakdown.food, fill: '#fbbf24' },
    { name: 'Lifestyle', CO2: latestLog.category_breakdown.lifestyle, fill: '#f87171' }
  ] : [
    { name: 'Transport', CO2: 4.5, fill: '#10b981' },
    { name: 'Energy', CO2: 5.2, fill: '#06b6d4' },
    { name: 'Food', CO2: 3.0, fill: '#fbbf24' },
    { name: 'Lifestyle', CO2: 1.8, fill: '#f87171' }
  ];

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-eco-accent-green';
    if (score >= 50) return 'text-eco-accent-yellow';
    return 'text-eco-accent-red';
  };

  const getScoreStroke = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  };

  // Gamification card calculations
  const nextLevelXp = user?.level * 500 || 500;
  const xpPercentage = Math.min(100, Math.round(((user?.xp || 0) % 500) / 500 * 100));

  return (
    <div className="space-y-6">
      {/* Upper Panel: Profile Summary, Level progress, points */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* User Card */}
        <div className="md:col-span-8 glass-card rounded-2xl p-6 border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-eco-accent-green"></div>
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-eco-accent-green/20 text-eco-accent-mint rounded-2xl border border-eco-accent-green/35">
              <User className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Sustainability Profile</span>
              <h3 className="text-xl font-bold text-white font-display mt-0.5">{user?.displayName || 'Eco Pioneer'}</h3>
              <p className="text-xs text-slate-400 flex items-center mt-1">
                <span className="w-2 h-2 rounded-full bg-eco-accent-green mr-1.5"></span>
                Location: <strong className="text-slate-300 ml-1">{user?.city || 'Metro City'}</strong>
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto md:min-w-[200px] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center">
                <Award className="w-4 h-4 mr-1 text-eco-accent-cyan" />
                Level {user?.level || 1}
              </span>
              <span className="text-slate-400">{(user?.xp || 0) % 500} / 500 XP</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-eco-accent-green to-eco-accent-cyan transition-all duration-500"
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xxs text-slate-400">
              <span className="font-bold text-white uppercase">{user?.points || 0} EcoPoints</span>
              <span className="flex items-center text-amber-500 font-bold">
                <Flame className="w-3.5 h-3.5 mr-0.5 animate-bounce" />
                {user?.streak || 0} Day Streak
              </span>
            </div>
          </div>
        </div>

        {/* Quick Log Button Card */}
        <div className="md:col-span-4 glass-card rounded-2xl p-6 border-white/10 flex flex-col justify-between items-stretch">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Daily Tracking</h4>
            <p className="text-xs text-slate-400 mt-1">Consistency is key to reducing carbon footprint.</p>
          </div>
          <button
            onClick={onLogNewData}
            className="w-full mt-4 py-3 bg-gradient-to-r from-eco-accent-green to-eco-accent-mint hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-eco-accent-green/10 hover:shadow-eco-accent-green/20 transition-all flex items-center justify-center space-x-2"
          >
            <Leaf className="w-4 h-4 fill-slate-950" />
            <span>Log Emissions Today</span>
          </button>
        </div>
      </div>

      {/* Main Row: Score Meter & Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Score Gauge */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 border-white/10 flex flex-col items-center justify-between text-center min-h-[300px]">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Carbon Health Score</h4>
          
          <div className="relative w-44 h-44 flex items-center justify-center my-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={getScoreStroke(summary.average_carbon_score || 70)}
                strokeWidth="8"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (summary.average_carbon_score || 70)) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold font-display ${getScoreColor(summary.average_carbon_score || 70)}`}>
                {summary.average_carbon_score || 70}
              </span>
              <span className="text-xxs uppercase tracking-widest text-slate-400 mt-1 font-bold">Out of 100</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {summary.average_carbon_score >= 75 
              ? 'Excellent! Your carbon output is well below the target thresholds.' 
              : summary.average_carbon_score >= 50
              ? 'Moderate standing. Small commuting modifications can elevate your score.'
              : 'Notice: High emission metrics detected. Use EcoBuddy for optimization ideas.'}
          </p>
        </div>

        {/* Carbon Trend graph */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 border-white/10 min-h-[300px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">Daily Emission Trend</h4>
              <p className="text-xs text-slate-400">Your carbon logs (kg CO2) over the last 7 entries</p>
            </div>
            <div className="flex items-center text-xs text-eco-accent-cyan font-semibold">
              <TrendingDown className="w-4 h-4 mr-1" />
              Trend Analysis
            </div>
          </div>

          <div className="w-full h-44">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(16, 28, 21, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelClassName="text-white font-bold"
                  />
                  <Area type="monotone" dataKey="Emissions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCO2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 text-slate-500">
                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">No historical logs available yet. Make a log today!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Comparison & Prediction Engine row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Cards */}
        <div className="glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between">
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold block">Avg Daily Footprint</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-extrabold text-white font-display">
              {summary.average_daily_co2 || '12.4'}
            </span>
            <span className="text-xs text-slate-400">kg CO2</span>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">vs Global Average (15 kg)</span>
            <span className="text-eco-accent-mint font-semibold flex items-center">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              -17.3%
            </span>
          </div>
        </div>

        {/* Category breakdown overview */}
        <div className="glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between">
          <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold block">Latest Carbon Split</span>
          
          <div className="h-16 flex items-end space-x-2.5 mt-2">
            {breakdownData.map((b, i) => {
              const maxVal = Math.max(...breakdownData.map(d => d.CO2), 1.0);
              const heightPct = (b.CO2 / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="w-full bg-white/5 rounded-t-sm h-12 flex items-end overflow-hidden border border-white/5">
                    <div 
                      className="w-full rounded-t-sm transition-all duration-700" 
                      style={{ height: `${heightPct}%`, backgroundColor: b.fill }}
                    ></div>
                  </div>
                  <span className="text-xxs text-slate-400 mt-1">{b.name[0]}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-xxs text-slate-400 text-center font-semibold">
            {latestLog ? 'Based on latest logged day' : 'Demonstration parameters'}
          </div>
        </div>

        {/* Prediction Engine Widget */}
        <div className="glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-eco-accent-cyan/10 rounded-full blur-xl"></div>
          
          <span className="text-xxs uppercase tracking-wider text-eco-accent-cyan font-bold block flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-eco-accent-cyan" />
            AI Prediction Engine
          </span>

          {isLoadingPred ? (
            <div className="h-20 flex items-center justify-center">
              <span className="w-2 h-2 bg-eco-accent-cyan rounded-full animate-ping"></span>
            </div>
          ) : prediction ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Next Month Est:</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-white font-display">{prediction.predicted_next_month_total}</span>
                  <span className="text-xxs text-slate-400">kg CO2</span>
                </div>
              </div>
              <p className="text-xxs text-slate-400 leading-tight border-t border-white/5 pt-1.5 flex items-start">
                {prediction.difference > 0 ? (
                  <TrendingUp className="w-4 h-4 text-eco-accent-red mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-eco-accent-green mr-1 flex-shrink-0" />
                )}
                <span>
                  {prediction.reason} ({prediction.difference_pct > 0 ? '+' : ''}{prediction.difference_pct}% change).
                </span>
              </p>
            </div>
          ) : (
            <div className="text-xxs text-slate-500 h-16 flex items-center justify-center">
              Awaiting logs to configure forecasting.
            </div>
          )}
        </div>
      </div>

      {/* Gamification: Daily Challenges Box */}
      <div className="glass-card rounded-2xl p-6 border-white/10">
        <h4 className="text-md font-bold text-white font-display mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-eco-accent-yellow" />
          <span>Today's Gamified Challenges</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border transition ${dailyTaskCompleted ? 'border-eco-accent-green/20 bg-eco-accent-green/5' : 'border-white/5 bg-white/5'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xxs font-bold text-eco-accent-green uppercase">Daily Habit</span>
                <h5 className="text-sm font-semibold text-white mt-1">Walk or Cycle 5,000 Steps</h5>
                <p className="text-xs text-slate-400 mt-1">Avoid vehicles for short journeys to reduce local emissions.</p>
              </div>
              <input
                type="checkbox"
                checked={dailyTaskCompleted}
                onChange={(e) => {
                  setDailyTaskCompleted(e.target.checked);
                  // Award XP locally
                  if (e.target.checked && user) {
                    user.xp += 50;
                    user.points += 15;
                    user.level = Math.floor(user.xp / 500) + 1;
                  }
                }}
                className="w-5 h-5 rounded accent-eco-accent-green cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2 mt-3 text-xxs font-bold text-eco-accent-mint">
              <Leaf className="w-3.5 h-3.5" />
              <span>+15 Points / +50 XP / Saves ~1.8 kg CO2</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-between">
            <div>
              <span className="text-xxs font-bold text-eco-accent-cyan uppercase">Weekly Sprint</span>
              <h5 className="text-sm font-semibold text-white mt-1">Reduce Home AC Usage</h5>
              <p className="text-xs text-slate-400 mt-1">Lessen cooling system load by 1 hour daily to reduce power consumption.</p>
            </div>
            <div className="flex items-center justify-between mt-3 text-xxs font-bold text-eco-accent-cyan">
              <span className="flex items-center">
                <Flame className="w-3.5 h-3.5 mr-0.5 text-amber-500" />
                Saves ~20 kg CO2 / month
              </span>
              <span className="text-slate-400">Join in Challenges tab</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete User Data Option for Privacy/Security compliance */}
      <div className="pt-6 flex justify-end">
        <button 
          onClick={() => {
            if (confirm("WARNING: Are you sure you want to delete all your carbon history, Eco Twin profile, and points? This action is permanent.")) {
              onDeleteData();
            }
          }}
          className="px-4 py-2 border border-eco-accent-red/25 hover:bg-eco-accent-red/10 text-eco-accent-red text-xs font-semibold rounded-lg transition flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Delete My Environmental Profile</span>
        </button>
      </div>
    </div>
  );
}
