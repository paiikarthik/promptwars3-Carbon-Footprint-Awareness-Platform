import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Trophy, 
  Sparkles,
  Leaf, 
  Settings,
  MessageSquare,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CarbonMap from './pages/CarbonMap';
import Challenges from './pages/Challenges';
import EcoTwin from './components/EcoTwin';
import EcoBuddy from './components/EcoBuddy';
import CarbonLogModal from './components/CarbonLogModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [carbonHistory, setCarbonHistory] = useState(null);
  const [ecoTwin, setEcoTwin] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  const userId = 'demo_user'; // Using standard session identifier

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // 1. Fetch backend health check to check live/mock state
      const healthRes = await fetch('/');
      if (healthRes.ok) {
        const health = await healthRes.json();
        const liveGemini = health.mode_configurations.google_gemini === 'YES';
        const liveFirebase = health.mode_configurations.firebase_firestore === 'YES';
        setDemoMode(!(liveGemini && liveFirebase));
      }

      // 2. Fetch User Profile
      const userRes = await fetch(`/api/user/${userId}`);
      const userData = await userRes.json();
      setUser(userData);

      // 3. Fetch Carbon History
      const histRes = await fetch(`/api/carbon/history/${userId}`);
      const histData = await histRes.json();
      setCarbonHistory(histData);

      // 4. Fetch Eco Twin
      const twinRes = await fetch(`/api/eco-twin/${userId}`);
      const twinData = await twinRes.json();
      setEcoTwin(twinData);
    } catch (err) {
      console.error("Failed to load user session data", err);
    }
  };

  const handleSaveCarbonLog = async (logInputs) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(`/api/carbon/log/${userId}/${todayStr}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logInputs)
      });
      if (response.ok) {
        // Refresh dashboard and twin values
        await fetchUserData();
      }
    } catch (err) {
      console.error("Error logging daily carbon data", err);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      const response = await fetch(`/api/user/delete/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        // Reset state
        await fetchUserData();
        alert("All your environmental records have been cleared successfully.");
      }
    } catch (err) {
      console.error("Error deleting data", err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-eco-bg-dark text-slate-100 font-sans">
      
      {/* 1. SIDEBAR NAVIGATION - Large screens */}
      <aside className="hidden md:flex md:w-64 flex-col bg-eco-bg-dark border-r border-white/5 relative z-20">
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-eco-accent-green/20 via-transparent to-eco-accent-cyan/20"></div>
        
        {/* Brand Logo */}
        <div className="p-6 border-b border-white/5 flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-br from-eco-accent-green to-eco-accent-mint text-slate-950 rounded-xl font-bold shadow-lg shadow-eco-accent-green/20 animate-pulse-slow">
            <Leaf className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h1 className="text-md font-extrabold font-display text-white block">EcoAI Guardian</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">Carbon Coach</span>
          </div>
        </div>

        {/* Tab Items */}
        <nav className="flex-1 px-4 py-6 space-y-2.5">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
            { id: 'eco-twin', name: 'Virtual Eco Twin', icon: Sparkles },
            { id: 'maps', name: 'Carbon Map Radar', icon: Map },
            { id: 'challenges', name: 'Challenges Hub', icon: Trophy }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-eco-accent-green/10 border border-eco-accent-green/25 text-eco-accent-mint'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* User Badge footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-eco-accent-cyan/20 text-eco-accent-cyan flex items-center justify-center font-bold text-sm">
              L{user?.level || 1}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">{user?.displayName || 'Eco Pioneer'}</span>
              <span className="text-[10px] text-slate-400 block truncate">{user?.points || 0} EcoPoints</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER - Small screens */}
      <div className="md:hidden fixed top-0 left-0 w-full h-14 bg-eco-bg-dark/90 border-b border-white/5 backdrop-blur-md z-30 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Leaf className="w-5 h-5 text-eco-accent-green" />
          <span className="font-extrabold text-white text-sm font-display">EcoAI Guardian</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsBuddyOpen(!isBuddyOpen)}
            className="p-2 bg-eco-accent-green/20 text-eco-accent-mint rounded-lg"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="w-64 bg-eco-bg-dark h-full border-r border-white/10 flex flex-col p-4 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="font-bold text-white font-display">Eco Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2 flex-1">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'eco-twin', name: 'Virtual Eco Twin', icon: Sparkles },
                { id: 'maps', name: 'Carbon Map Radar', icon: Map },
                { id: 'challenges', name: 'Challenges Hub', icon: Trophy }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-eco-accent-green/10 border border-eco-accent-green/20 text-eco-accent-mint'
                      : 'border border-transparent text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-14 md:pt-0">
        
        {/* Banner Alert for Demo Mode Fallback */}
        {demoMode && (
          <div className="bg-gradient-to-r from-sky-950/70 to-emerald-950/70 border-b border-sky-900/50 px-4 py-2 flex items-center justify-between text-xxs sm:text-xs">
            <div className="flex items-center space-x-2 text-sky-300">
              <AlertCircle className="w-4 h-4 text-sky-400" />
              <span>
                <strong>Demo Mode Active:</strong> Simulating Google APIs & Firestore. Configure credentials in <code>backend/.env</code> to unlock live capabilities.
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Section Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-display uppercase tracking-wide">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'eco-twin' && 'Eco Digital Twin'}
                {activeTab === 'maps' && 'Carbon Map Radar'}
                {activeTab === 'challenges' && 'Challenges & Leaderboard'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'dashboard' && 'Monitor daily emissions trends and predictions.'}
                {activeTab === 'eco-twin' && 'Reflect your sustainability choices visually.'}
                {activeTab === 'maps' && 'Navigate green POIs and route carbon emissions.'}
                {activeTab === 'challenges' && 'Rank up by saving carbon in community milestones.'}
              </p>
            </div>
            
            {/* Quick Open Chat trigger (Floating Header) */}
            <button
              onClick={() => setIsBuddyOpen(!isBuddyOpen)}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-eco-accent-green/20 hover:bg-eco-accent-green/35 text-eco-accent-mint border border-eco-accent-green/30 text-xs font-bold rounded-xl shadow-lg transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>EcoBuddy Coach</span>
            </button>
          </div>

          {/* Active Tab Router */}
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <Dashboard 
                user={user} 
                carbonHistory={carbonHistory} 
                onLogNewData={() => setIsLogModalOpen(true)}
                onDeleteData={handleDeleteAllData}
              />
            )}
            {activeTab === 'eco-twin' && (
              <EcoTwin data={ecoTwin} />
            )}
            {activeTab === 'maps' && (
              <CarbonMap user={user} />
            )}
            {activeTab === 'challenges' && (
              <Challenges user={user} onChallengeUpdate={fetchUserData} />
            )}
          </div>
        </div>
      </main>

      {/* 3. COLLAPSIBLE AI CHAT DRAWER (EcoBuddy) */}
      <div 
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-eco-bg-dark border-l border-white/10 shadow-2xl transition-transform duration-300 transform ${
          isBuddyOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="absolute top-4 left-4 z-50">
          <button 
            onClick={() => setIsBuddyOpen(false)}
            className="p-1.5 bg-eco-bg-dark/80 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-full pt-12">
          <EcoBuddy userId={userId} />
        </div>
      </div>

      {/* 4. MODALS */}
      <CarbonLogModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSave={handleSaveCarbonLog}
        defaultPreferences={user?.preferences}
      />
    </div>
  );
}
