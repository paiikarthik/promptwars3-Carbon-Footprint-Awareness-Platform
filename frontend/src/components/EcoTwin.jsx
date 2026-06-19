import React from 'react';
import { Leaf, Flame, ShieldCheck, Milestone } from 'lucide-react';

export default function EcoTwin({ data }) {
  if (!data) return null;

  const { current_status, roadmap } = data;
  const score = current_status.overall_health_score || 0;

  // Visual state determined by carbon score
  let leafColor = '#f87171'; // Red (wilted)
  let leavesCount = 4;
  let leafScale = 0.8;
  let statusText = 'Eco Critical';
  let statusClass = 'text-eco-accent-red';

  if (score >= 75) {
    leafColor = '#34d399'; // Green (vibrant)
    leavesCount = 14;
    leafScale = 1.25;
    statusText = 'Eco Guardian';
    statusClass = 'text-eco-accent-mint';
  } else if (score >= 50) {
    leafColor = '#fbbf24'; // Yellow (recovering)
    leavesCount = 8;
    leafScale = 1.0;
    statusText = 'Eco Steady';
    statusClass = 'text-eco-accent-yellow';
  }

  // Generate leaf SVG coordinates based on count
  const renderLeaves = () => {
    const coords = [
      { cx: 80, cy: 110, rx: 12, ry: 20, rotate: -40 },
      { cx: 120, cy: 110, rx: 12, ry: 20, rotate: 40 },
      { cx: 70, cy: 70, rx: 14, ry: 24, rotate: -30 },
      { cx: 130, cy: 70, rx: 14, ry: 24, rotate: 30 },
      { cx: 100, cy: 50, rx: 15, ry: 26, rotate: 0 },
      // Tier 2
      { cx: 90, cy: 85, rx: 12, ry: 20, rotate: -15 },
      { cx: 110, cy: 85, rx: 12, ry: 20, rotate: 15 },
      { cx: 60, cy: 100, rx: 10, ry: 18, rotate: -60 },
      { cx: 140, cy: 100, rx: 10, ry: 18, rotate: 60 },
      // Tier 3
      { cx: 100, cy: 30, rx: 10, ry: 16, rotate: 5 },
      { cx: 75, cy: 50, rx: 10, ry: 18, rotate: -20 },
      { cx: 125, cy: 50, rx: 10, ry: 18, rotate: 20 },
      { cx: 82, cy: 128, rx: 8, ry: 14, rotate: -45 },
      { cx: 118, cy: 128, rx: 8, ry: 14, rotate: 45 },
    ];

    return coords.slice(0, leavesCount).map((c, i) => (
      <ellipse
        key={i}
        cx={c.cx}
        cy={c.cy}
        rx={c.rx * leafScale}
        ry={c.ry * leafScale}
        fill={leafColor}
        opacity={0.85}
        transform={`rotate(${c.rotate}, ${c.cx}, ${c.cy})`}
        className="transition-all duration-1000 ease-in-out hover:scale-110 cursor-pointer"
      />
    ));
  };

  const getImpactBadge = (val) => {
    switch (val) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-red/20 text-eco-accent-red border border-eco-accent-red/35">High Impact</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-yellow/20 text-eco-accent-yellow border border-eco-accent-yellow/35">Medium Impact</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-eco-accent-green/20 text-eco-accent-mint border border-eco-accent-green/35">Low Impact</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Visual Digital Twin avatar card */}
      <div className="lg:col-span-5 glass-card rounded-2xl p-6 flex flex-col items-center justify-between border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-eco-accent-green to-eco-accent-cyan"></div>
        
        <div className="w-full text-center mb-2">
          <h4 className="text-lg font-semibold text-white font-display">Virtual Eco Twin</h4>
          <p className="text-xs text-slate-400">Your digital environmental reflections</p>
        </div>

        {/* Tree SVG */}
        <div className="w-full max-w-[220px] aspect-square flex items-center justify-center my-4 animate-float">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Ground */}
            <path d="M 30 170 Q 100 160 170 170" stroke="#1f2937" strokeWidth="4" fill="none" />
            <path d="M 50 170 Q 100 162 150 170" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" fill="none" opacity={score / 100} />
            
            {/* Trunk */}
            <path d="M 92 170 L 96 110 Q 98 100 90 90 Q 82 80 84 70" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 108 170 L 104 110 Q 102 100 110 90 Q 118 80 116 70" stroke="#78350f" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 100 170 L 100 100" stroke="#92400e" strokeWidth="12" fill="none" strokeLinecap="round" />
            
            {/* Branches */}
            <path d="M 98 120 Q 85 105 75 110" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 102 115 Q 118 98 128 102" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 100 90 Q 90 70 95 60" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 100 90 Q 110 70 105 60" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Leaves Layer */}
            {renderLeaves()}

            {/* Score Badge floating */}
            <circle cx="100" cx="100" r="22" fill="#080d0a" stroke={leafColor} strokeWidth="3" transform="translate(0, 55)" />
            <text x="100" y="159" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">Score</text>
            <text x="100" y="174" textAnchor="middle" fill={leafColor} fontSize="14" fontWeight="extrabold">{score}</text>
          </svg>
        </div>

        <div className="w-full text-center">
          <span className={`text-md font-bold uppercase tracking-wider ${statusClass}`}>{statusText}</span>
          <div className="mt-3 grid grid-cols-2 gap-2 w-full text-left">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between">
              <span className="text-xxs text-slate-400 uppercase font-semibold">Transport</span>
              <span className="mt-1">{getImpactBadge(current_status.transportation_impact)}</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between">
              <span className="text-xxs text-slate-400 uppercase font-semibold">Home Energy</span>
              <span className="mt-1">{getImpactBadge(current_status.energy_impact)}</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between">
              <span className="text-xxs text-slate-400 uppercase font-semibold">Food Diet</span>
              <span className="mt-1">{getImpactBadge(current_status.food_impact)}</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between">
              <span className="text-xxs text-slate-400 uppercase font-semibold">Lifestyle</span>
              <span className="mt-1">{getImpactBadge(current_status.lifestyle_impact)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap milestones card */}
      <div className="lg:col-span-7 glass-card rounded-2xl p-6 border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 text-eco-accent-cyan mb-4">
            <Milestone className="w-5 h-5" />
            <h4 className="text-lg font-semibold font-display text-white">Your Personal Roadmap</h4>
          </div>
          
          <div className="space-y-4">
            {roadmap.map((milestone, idx) => (
              <div 
                key={idx} 
                className={`flex items-start space-x-4 p-3.5 rounded-xl border transition ${
                  milestone.completed 
                    ? 'border-eco-accent-green/20 bg-eco-accent-green/5' 
                    : 'border-white/5 bg-white/5'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${
                  milestone.completed 
                    ? 'bg-eco-accent-green/20 text-eco-accent-mint' 
                    : 'bg-white/5 text-slate-400'
                }`}>
                  {milestone.completed ? <ShieldCheck className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-eco-accent-cyan">Week {milestone.week} - {milestone.milestone}</span>
                    {milestone.completed && (
                      <span className="text-xxs font-bold text-eco-accent-mint uppercase tracking-wider">Completed</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{milestone.action}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Leaf className="w-3.5 h-3.5 text-eco-accent-green" />
                    <span className="text-xs text-slate-400">Target Savings: <strong className="text-slate-300 font-semibold">{milestone.target_saving} kg CO2</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
          🌱 Tip: Completing roadmap actions dynamically improves your Digital Twin's vitality score and rewards you with extra sustainability badges.
        </div>
      </div>
    </div>
  );
}
