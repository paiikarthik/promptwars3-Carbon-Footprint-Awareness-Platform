import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Users, 
  MapPin, 
  School, 
  Briefcase, 
  Globe, 
  CheckCircle,
  Play,
  Leaf,
  Trophy,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Challenges({ user, onChallengeUpdate }) {
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all', 'global', 'city', 'college', 'workplace'

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch challenges
      const chalRes = await fetch('/api/challenges');
      const chalData = await chalRes.json();
      setChallenges(chalData);

      // Fetch leaderboard
      const leadRes = await fetch('/api/leaderboard');
      const leadData = await leadRes.json();
      setLeaderboard(leadData);
    } catch (err) {
      console.error("Failed to load challenges/leaderboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      const response = await fetch(`/api/challenges/${id}/join/${user.userId || 'demo_user'}`, { method: 'POST' });
      if (response.ok) {
        await fetchData();
        onChallengeUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await fetch(`/api/challenges/${id}/complete/${user.userId || 'demo_user'}`, { method: 'POST' });
      if (response.ok) {
        // Trigger confetti!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#06b6d4', '#fbbf24']
        });
        await fetchData();
        onChallengeUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getScopeIcon = (scope) => {
    switch (scope) {
      case 'global': return <Globe className="w-4 h-4 text-sky-400" />;
      case 'city': return <MapPin className="w-4 h-4 text-eco-accent-yellow" />;
      case 'college': return <School className="w-4 h-4 text-purple-400" />;
      case 'workplace': return <Briefcase className="w-4 h-4 text-emerald-400" />;
      default: return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredChallenges = scopeFilter === 'all' 
    ? challenges 
    : challenges.filter(c => c.scope === scopeFilter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Challenges List Panel */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Scope Filter bar */}
        <div className="glass-card rounded-2xl p-4 border-white/10 flex flex-wrap gap-2 items-center justify-between">
          <span className="text-xs font-semibold text-white uppercase tracking-wider font-display">Active Sprints</span>
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', name: 'All' },
              { id: 'global', name: 'Global' },
              { id: 'city', name: 'City' },
              { id: 'college', name: 'College' },
              { id: 'workplace', name: 'Work' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setScopeFilter(f.id)}
                className={`py-1.5 px-3 text-xxs rounded-lg border transition ${
                  scopeFilter === f.id
                    ? 'border-eco-accent-green bg-eco-accent-green/20 text-white font-bold'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="space-y-4">
          {filteredChallenges.map((c) => {
            const isParticipant = c.participants?.includes(user?.userId || 'demo_user');
            const isCompleted = c.completed_by?.includes(user?.userId || 'demo_user');

            return (
              <div 
                key={c.id} 
                className={`glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between relative overflow-hidden transition-all ${
                  isCompleted ? 'border-eco-accent-green/25 bg-eco-accent-green/5' : ''
                }`}
              >
                {/* Visual badge top right */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rotate-45 border-l border-b border-white/5"></div>
                
                <div>
                  <div className="flex items-center space-x-2 text-slate-400 text-xxs uppercase tracking-wider font-bold">
                    {getScopeIcon(c.scope)}
                    <span>{c.scope_name}</span>
                  </div>

                  <h4 className="text-md font-bold text-white mt-1 font-display">{c.title}</h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center space-x-4 text-xxs text-slate-400">
                    <span className="flex items-center text-eco-accent-mint font-semibold">
                      <Leaf className="w-3.5 h-3.5 mr-1" />
                      Saves {c.target_saving_kg} kg CO2
                    </span>
                    <span className="flex items-center text-eco-accent-yellow font-bold">
                      <Award className="w-3.5 h-3.5 mr-0.5" />
                      +{c.points_reward} Points
                    </span>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-eco-accent-green/20 text-eco-accent-mint border border-eco-accent-green/30 text-xs font-bold uppercase">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  ) : isParticipant ? (
                    <button
                      onClick={() => handleComplete(c.id)}
                      className="px-4 py-1.5 bg-eco-accent-green hover:bg-emerald-600 text-slate-900 font-extrabold text-xs rounded-lg transition"
                    >
                      Complete Sprint
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(c.id)}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Join Challenge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Panel */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Leaderboard list */}
        <div className="glass-card rounded-2xl p-5 border-white/10 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-eco-accent-yellow mb-4">
            <Trophy className="w-5 h-5 text-eco-accent-yellow" />
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">Leaderboard (Carbon Saved)</h4>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {leaderboard.map((u, idx) => {
              const isCurrentUser = u.userId === (user?.userId || 'demo_user');
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    isCurrentUser 
                      ? 'border-eco-accent-green bg-eco-accent-green/10' 
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-950' 
                        : idx === 2 
                        ? 'bg-amber-700 text-white' 
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      {u.rank}
                    </span>
                    <div>
                      <span className={`text-xs font-bold block ${isCurrentUser ? 'text-eco-accent-mint' : 'text-white'}`}>
                        {u.displayName}
                      </span>
                      <span className="text-xxs text-slate-400 block">{u.city}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">{u.carbon_saved_kg} kg Saved</span>
                    <span className="text-xxs text-eco-accent-cyan block font-medium">{u.points} EP</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xxs text-slate-400 text-center font-semibold">
            Ranks recalculate dynamically as carbon logs are updated.
          </div>
        </div>

        {/* Badges Earned Section */}
        <div className="glass-card rounded-2xl p-5 border-white/10">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Trophy Case</h4>
          <div className="flex flex-wrap gap-2.5">
            {user?.badges?.length > 0 ? (
              user.badges.map((b, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-xl p-2 group hover:border-eco-accent-yellow/20 transition duration-300 relative">
                  <div className="p-1.5 rounded-lg bg-eco-accent-yellow/15 text-eco-accent-yellow">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xxs font-bold text-white block">{b.name}</span>
                    <span className="text-[9px] text-slate-400 block max-w-[100px] truncate">{b.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xxs text-slate-500">Trophies will appear here upon challenge completions.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
